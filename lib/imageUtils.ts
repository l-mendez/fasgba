import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Generate a hash for a file to identify duplicates (browser-compatible)
 */
export async function generateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  
  // Use Web Crypto API (browser-compatible)
  if (typeof window !== 'undefined') {
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } 
  
  // Use Node.js crypto for server-side (if needed)
  try {
    const crypto = await import('crypto')
    const hashSum = crypto.createHash('md5')
    hashSum.update(new Uint8Array(arrayBuffer))
    return hashSum.digest('hex')
  } catch (error) {
    // Fallback: use a simple hash based on file size and name
    const simpleHash = `${file.size}-${file.name}-${file.lastModified}`
    return Buffer.from(simpleHash).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)
  }
}

/**
 * Check if an image already exists in storage for a news item
 */
export async function findExistingImage(newsId: number, fileHash: string): Promise<string | null> {
  try {
    // List all files in the news folder
    const { data: files, error } = await supabase.storage
      .from('images')
      .list(`news/${newsId}`, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error || !files) {
      return null
    }

    // Look for a file with the hash in its name
    const existingFile = files.find(file => file.name.includes(fileHash))
    
    if (existingFile) {
      return `news/${newsId}/${existingFile.name}`
    }

    return null
  } catch (error) {
    console.error('Error checking for existing image:', error)
    return null
  }
}

/**
 * Upload an image with deduplication for a specific news item
 */
export async function uploadImageWithDeduplication(
  newsId: number, 
  file: File, 
  prefix: string = ''
): Promise<{ filePath: string; wasReused: boolean }> {
  try {
    // Generate hash for deduplication
    const fileHash = await generateFileHash(file)
    
    // Check if this image already exists for this news item
    const existingPath = await findExistingImage(newsId, fileHash)
    
    if (existingPath) {
      return { filePath: existingPath, wasReused: true }
    }

    // File doesn't exist, upload it
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileName = prefix 
      ? `${prefix}-${fileHash}-${timestamp}-${randomId}.${fileExt}`
      : `${fileHash}-${timestamp}-${randomId}.${fileExt}`
    
    const filePath = `news/${newsId}/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file)
    
    if (uploadError) {
      throw new Error('Failed to upload image: ' + uploadError.message)
    }

    return { filePath, wasReused: false }
  } catch (error) {
    console.error('Error uploading image with deduplication:', error)
    throw error
  }
}

/**
 * Upload multiple images with deduplication for a news item
 */
export async function uploadImagesWithDeduplication(
  newsId: number,
  images: Array<{ file: File; prefix?: string }>
): Promise<Array<{ filePath: string; wasReused: boolean; originalIndex: number }>> {
  const results = await Promise.all(
    images.map(async (imageInfo, index) => {
      const result = await uploadImageWithDeduplication(
        newsId, 
        imageInfo.file, 
        imageInfo.prefix
      )
      return { ...result, originalIndex: index }
    })
  )

  return results
}

/**
 * Get all image paths from a news item (featured + content blocks)
 */
export function extractImagePathsFromNews(image: string | null, text: string): string[] {
  const imagePaths: string[] = []

  // Add featured image if it exists
  if (image) {
    imagePaths.push(image)
  }

  // Parse content blocks to find embedded images
  try {
    const contentBlocks = JSON.parse(text)
    if (Array.isArray(contentBlocks)) {
      contentBlocks.forEach((block: any) => {
        if (block.type === 'image' && block.content?.src) {
          imagePaths.push(block.content.src)
        }
      })
    }
  } catch (parseError) {
    // If text is not valid JSON or doesn't contain blocks, that's okay
    console.warn('Could not parse news text for image extraction:', parseError)
  }

  return imagePaths
}

/**
 * Delete all images for a specific news item
 */
export async function deleteNewsImages(newsId: number): Promise<void> {
  try {
    // List all files in the news folder
    const { data: files, error: listError } = await supabase.storage
      .from('images')
      .list(`news/${newsId}`, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (listError) {
      console.error('Error listing images for deletion:', listError)
      return
    }

    if (!files || files.length === 0) {
      return // No images to delete
    }

    // Delete all files in the folder
    const filePaths = files.map(file => `news/${newsId}/${file.name}`)
    
    const { error: deleteError } = await supabase.storage
      .from('images')
      .remove(filePaths)

    if (deleteError) {
      console.error('Error deleting images:', deleteError)
      throw new Error('Failed to delete some images')
    }

    console.log(`Successfully deleted ${filePaths.length} images for news ${newsId}`)
  } catch (error) {
    console.error('Error in deleteNewsImages:', error)
    throw error
  }
} 