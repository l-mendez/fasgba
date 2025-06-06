import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/middleware/auth'
import { apiSuccess, handleError, forbiddenError } from '@/lib/utils/apiResponse'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Check if user has admin permissions - use regular client for auth check
    const supabase = await createClient()
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()
    
    if (adminError || !adminData) {
      return forbiddenError('Admin access required')
    }

    // Use admin client for storage operations
    const adminSupabase = createAdminClient()

    const { tempJsonPath } = await request.json()
    
    if (!tempJsonPath) {
      return handleError(new Error('Missing temp file path'))
    }

    console.log(`Cleaning up temp file: ${tempJsonPath}`)

    // Delete the temp JSON file using admin client
    const { error: deleteError } = await adminSupabase.storage
      .from('ranking-data')
      .remove([tempJsonPath])
    
    if (deleteError) {
      console.warn('Failed to delete temp file:', deleteError)
      // Don't throw error, just warn - we still want to return success
    }

    // Also try to clean up any other temp files that might be lingering
    try {
      const { data: tempFiles, error: listError } = await adminSupabase.storage
        .from('ranking-data')
        .list('temp', {
          limit: 100
        })

      if (!listError && tempFiles && tempFiles.length > 0) {
        // Get files older than 1 hour for cleanup
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        const oldTempFiles = tempFiles
          .filter(file => {
            const fileDate = new Date(file.created_at)
            return fileDate < oneHourAgo
          })
          .map(file => `temp/${file.name}`)

        if (oldTempFiles.length > 0) {
          console.log(`Cleaning up ${oldTempFiles.length} old temp files`)
          await adminSupabase.storage
            .from('ranking-data')
            .remove(oldTempFiles)
        }
      }
    } catch (cleanupError) {
      console.warn('Error during additional temp file cleanup:', cleanupError)
      // Don't fail the request for this
    }

    return apiSuccess({
      message: 'Upload cancelled and temp files cleaned up',
      tempFilePath: tempJsonPath
    })

  } catch (error) {
    return handleError(error)
  }
} 