import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({
        success: false,
        error: 'Authorization header required'
      }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return Response.json({
        success: false,
        error: 'Invalid token or user not found'
      }, { status: 401 })
    }

    // Check if user is already an admin
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('auth_id')
      .eq('auth_id', user.id)
      .single()

    if (existingAdmin) {
      return Response.json({
        success: true,
        message: 'User is already an admin',
        userId: user.id,
        userEmail: user.email
      })
    }

    // Add user to admins table
    const { error: insertError } = await supabase
      .from('admins')
      .insert([{ auth_id: user.id }])

    if (insertError) {
      return Response.json({
        success: false,
        error: `Failed to add admin: ${insertError.message}`,
        code: insertError.code
      }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: 'User successfully added as admin',
      userId: user.id,
      userEmail: user.email,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 