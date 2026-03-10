import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const tables = ['admins', 'club_admins', 'user_follows_club', 'clubs', 'news', 'tournaments', 'tournamentdates']
    const tableStatus: Record<string, any> = {}

    for (const tableName of tables) {
      try {
        // Try to select from the table to see if it exists
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        if (error) {
          tableStatus[tableName] = {
            exists: false,
            error: error.message,
            code: error.code
          }
        } else {
          tableStatus[tableName] = {
            exists: true,
            rowCount: count
          }
        }
      } catch (err) {
        tableStatus[tableName] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        }
      }
    }

    // Also check if the current user can access auth.users
    let authAccess = false
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      authAccess = !authError
    } catch (err) {
      authAccess = false
    }

    return Response.json({
      success: true,
      tables: tableStatus,
      authAccess,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
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