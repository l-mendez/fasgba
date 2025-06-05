import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, unauthorizedError } from '@/lib/utils/apiResponse'
import { hasPermission } from '@/lib/middleware/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedError('Authentication required')
    }

    const token = authHeader.substring(7)

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return unauthorizedError('Invalid authentication')
    }

    // Check if user is system admin
    const isSystemAdmin = await hasPermission('isAdmin', user.id)
    
    if (!isSystemAdmin) {
      return unauthorizedError('You must be a system admin to perform this action')
    }

    const { action } = await request.json()

    if (action === 'scan') {
      // Scan for orphaned image references
      const { data: newsItems, error: scanError } = await supabase
        .from('news')
        .select('id, title, image, text')
        .not('image', 'is', null)

      if (scanError) {
        throw new Error('Failed to scan news items: ' + scanError.message)
      }

      const orphanedItems = []
      const validItems = []

      for (const item of newsItems || []) {
        let hasOrphanedImages = false
        const orphanedPaths = []

        // Check featured image
        if (item.image) {
          const { error: imageError } = await supabase.storage
            .from('images')
            .download(item.image)
          
          if (imageError) {
            hasOrphanedImages = true
            orphanedPaths.push(item.image)
          }
        }

        // Check content block images
        try {
          const contentBlocks = JSON.parse(item.text)
          if (Array.isArray(contentBlocks)) {
            for (const block of contentBlocks) {
              if (block.type === 'image' && block.content?.src) {
                const imagePath = block.content.src
                const { error: imageError } = await supabase.storage
                  .from('images')
                  .download(imagePath)
                
                if (imageError) {
                  hasOrphanedImages = true
                  orphanedPaths.push(imagePath)
                }
              }
            }
          }
        } catch (e) {
          // Not JSON content, skip
        }

        if (hasOrphanedImages) {
          orphanedItems.push({
            id: item.id,
            title: item.title,
            orphanedPaths
          })
        } else {
          validItems.push({
            id: item.id,
            title: item.title
          })
        }
      }

      return apiSuccess({
        orphanedItems,
        validItems,
        totalScanned: newsItems?.length || 0,
        orphanedCount: orphanedItems.length,
        validCount: validItems.length
      })
    }

    if (action === 'cleanup') {
      const { newsIds } = await request.json()
      
      if (!Array.isArray(newsIds)) {
        throw new Error('newsIds must be an array')
      }

      const cleanupResults = []

      for (const newsId of newsIds) {
        try {
          // Get the news item
          const { data: newsItem, error: fetchError } = await supabase
            .from('news')
            .select('id, title, image, text')
            .eq('id', newsId)
            .single()

          if (fetchError || !newsItem) {
            cleanupResults.push({
              newsId,
              success: false,
              error: 'News item not found'
            })
            continue
          }

          let updateData: any = {}
          let updatedText = newsItem.text

          // Clean up featured image if orphaned
          if (newsItem.image) {
            const { error: imageError } = await supabase.storage
              .from('images')
              .download(newsItem.image)
            
            if (imageError) {
              updateData.image = null
            }
          }

          // Clean up content block images
          try {
            const contentBlocks = JSON.parse(newsItem.text)
            if (Array.isArray(contentBlocks)) {
              let hasChanges = false
              const cleanedBlocks = contentBlocks.filter(block => {
                if (block.type === 'image' && block.content?.src) {
                  // For now, remove image blocks with orphaned images
                  // In the future, you could replace with placeholder
                  return false // Remove orphaned image blocks
                }
                return true
              })

              if (cleanedBlocks.length !== contentBlocks.length) {
                updatedText = JSON.stringify(cleanedBlocks)
                hasChanges = true
              }

              if (hasChanges) {
                updateData.text = updatedText
              }
            }
          } catch (e) {
            // Not JSON content, skip
          }

          // Update the news item if changes were made
          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
              .from('news')
              .update(updateData)
              .eq('id', newsId)

            if (updateError) {
              cleanupResults.push({
                newsId,
                success: false,
                error: updateError.message
              })
            } else {
              cleanupResults.push({
                newsId,
                success: true,
                changes: Object.keys(updateData)
              })
            }
          } else {
            cleanupResults.push({
              newsId,
              success: true,
              changes: []
            })
          }
        } catch (error) {
          cleanupResults.push({
            newsId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      return apiSuccess({
        cleanupResults,
        totalProcessed: newsIds.length,
        successfulCleanups: cleanupResults.filter(r => r.success).length,
        failedCleanups: cleanupResults.filter(r => !r.success).length
      })
    }

    throw new Error('Invalid action. Use "scan" or "cleanup"')

  } catch (error) {
    return handleError(error)
  }
} 