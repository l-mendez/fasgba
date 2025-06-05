import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Generate a hash for a file buffer to identify duplicates (server-side)
 */
export async function generateFileHashFromBuffer(buffer: ArrayBuffer): Promise<string> {
  const hashSum = crypto.createHash('md5')
  hashSum.update(new Uint8Array(buffer))
  return hashSum.digest('hex')
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
 * Upload an image with deduplication for a specific news item (server-side)
 */
export async function uploadImageWithDeduplication(
  newsId: number, 
  fileBuffer: ArrayBuffer,
  fileName: string,
  prefix: string = ''
): Promise<{ filePath: string; wasReused: boolean }> {
  try {
    // Generate hash for deduplication
    const fileHash = await generateFileHashFromBuffer(fileBuffer)
    
    // Check if this image already exists for this news item
    const existingPath = await findExistingImage(newsId, fileHash)
    
    if (existingPath) {
      return { filePath: existingPath, wasReused: true }
    }

    // File doesn't exist, upload it with consistent naming (no prefix for deduplication)
    const fileExt = fileName.split('.').pop()
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    // Use consistent naming without prefix to ensure deduplication works
    const newFileName = `${fileHash}-${timestamp}-${randomId}.${fileExt}`
    
    const filePath = `news/${newsId}/${newFileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, new Uint8Array(fileBuffer), {
        contentType: `image/${fileExt}`
      })
    
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
 * Upload multiple images with deduplication for a news item (server-side)
 */
export async function uploadImagesWithDeduplication(
  newsId: number,
  images: Array<{ buffer: ArrayBuffer; fileName: string; prefix?: string }>
): Promise<Array<{ filePath: string; wasReused: boolean; originalIndex: number }>> {
  const results: Array<{ filePath: string; wasReused: boolean; originalIndex: number }> = []
  const uploadedHashes = new Map<string, string>() // hash -> filePath

  // Process images sequentially to avoid race conditions with duplicate detection
  for (let index = 0; index < images.length; index++) {
    const imageInfo = images[index]
    
    try {
      // Generate hash for this image
      const fileHash = await generateFileHashFromBuffer(imageInfo.buffer)
      
      // Check if we've already uploaded this hash in this batch
      if (uploadedHashes.has(fileHash)) {
        results.push({
          filePath: uploadedHashes.get(fileHash)!,
          wasReused: true,
          originalIndex: index
        })
        continue
      }
      
      // Check if this image already exists in storage
      const existingPath = await findExistingImage(newsId, fileHash)
      
      if (existingPath) {
        // File exists in storage, reuse it
        uploadedHashes.set(fileHash, existingPath)
        results.push({
          filePath: existingPath,
          wasReused: true,
          originalIndex: index
        })
        continue
      }

      // File doesn't exist, upload it with a consistent name (no prefix for deduplication)
      const fileExt = imageInfo.fileName.split('.').pop()
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      // Use consistent naming without prefix to ensure deduplication works
      const newFileName = `${fileHash}-${timestamp}-${randomId}.${fileExt}`
      
      const filePath = `news/${newsId}/${newFileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, new Uint8Array(imageInfo.buffer), {
          contentType: `image/${fileExt}`
        })
      
      if (uploadError) {
        throw new Error('Failed to upload image: ' + uploadError.message)
      }

      // Store in our local cache and results
      uploadedHashes.set(fileHash, filePath)
      results.push({
        filePath,
        wasReused: false,
        originalIndex: index
      })
    } catch (error) {
      console.error(`Error processing image ${index}:`, error)
      throw error
    }
  }

  return results
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