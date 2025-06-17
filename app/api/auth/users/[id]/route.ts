import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params
    const userId = resolvedParams.id

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

    // Prevent admin from deleting themselves
    if (user.id === userId) {
      return Response.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 })
    }

    // Check if the user to be deleted exists
    const { data: userToDelete, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (getUserError || !userToDelete.user) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Clean up related data before deleting the user
    try {
      // Remove from admins table if present
      await supabaseAdmin
        .from('admins')
        .delete()
        .eq('auth_id', userId)
      
      // Remove from club_admins table if present
      await supabaseAdmin
        .from('club_admins')
        .delete()
        .eq('auth_id', userId)
      
      // Remove from user_follows_club table if present
      await supabaseAdmin
        .from('user_follows_club')
        .delete()
        .eq('auth_id', userId)
      
      // Update news created by this user to remove the reference
      await supabaseAdmin
        .from('news')
        .update({ created_by_auth_id: null })
        .eq('created_by_auth_id', userId)
      
      // Update elohistory if present
      await supabaseAdmin
        .from('elohistory')
        .delete()
        .eq('auth_id', userId)
    } catch (cleanupError) {
      console.error('Error cleaning up user data:', cleanupError)
      // Continue with deletion even if cleanup fails partially
    }

    // Delete the user from Supabase Auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError)
      return Response.json({ 
        error: 'Error al eliminar el usuario', 
        details: deleteError.message 
      }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: `Usuario ${userToDelete.user.email} eliminado correctamente` 
    })
  } catch (error) {
    console.error('Error in delete user API:', error)
    return Response.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 