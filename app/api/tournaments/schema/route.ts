import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { checkTournamentsTableStructure } from '@/lib/tournamentUtils'
import { requireAdmin } from '@/lib/middleware/auth'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request)
    
    const schemaInfo = await checkTournamentsTableStructure(supabase)
    return apiSuccess(schemaInfo)
  } catch (error) {
    return handleError(error)
  }
} 