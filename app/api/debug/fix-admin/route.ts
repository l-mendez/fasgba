import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return Response.json({ error: 'User ID required' }, { status: 400 })
    }

    // Check if user exists in admins table
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admins')
      .select('*')
      .eq('auth_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return Response.json({ error: 'Database error checking admin', details: checkError }, { status: 500 })
    }

    if (existingAdmin) {
      return Response.json({ 
        success: true, 
        message: 'User is already an admin',
        admin: existingAdmin 
      })
    }

    // Add user to admins table
    const { data: newAdmin, error: insertError } = await supabase
      .from('admins')
      .insert({ auth_id: userId })
      .select()
      .single()

    if (insertError) {
      return Response.json({ error: 'Failed to add admin', details: insertError }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: 'User added as admin successfully',
      admin: newAdmin 
    })

  } catch (error) {
    return Response.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 