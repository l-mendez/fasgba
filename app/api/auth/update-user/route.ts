import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function PUT(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Authorization header required' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    
    // Verify the requesting user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return Response.json({ error: 'Invalid or expired token' }, { status: 401 })
    }
    
    // Check if user is an admin
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()
    
    if (adminError || !adminData) {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    // Parse request body
    const { userId, metadata, email } = await request.json()
    
    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Update user metadata
    if (metadata) {
      const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: metadata
        }
      )
      
      if (metadataError) {
        console.error('Error updating user metadata:', metadataError)
        return Response.json({ error: 'Failed to update user metadata' }, { status: 500 })
      }
    }
    
    // Update email if provided
    if (email) {
      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          email: email
        }
      )
      
      if (emailError) {
        console.error('Error updating user email:', emailError)
        return Response.json({ error: 'Failed to update user email' }, { status: 500 })
      }
    }
    
    return Response.json({ success: true })
  } catch (error) {
    console.error('Error in update-user API:', error)
    return Response.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 