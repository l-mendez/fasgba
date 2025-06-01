import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/middleware/auth'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const adminUser = await requireAdmin(request)
    if (adminUser instanceof Response) {
      return adminUser // Return the error response
    }

    // Get statistics in parallel
    const [usersData, newsCount, clubsData, tournamentsData] = await Promise.all([
      getUserStats(),
      getNewsStats(),
      getClubStats(),
      getTournamentStats()
    ])

    const stats = {
      usuarios: usersData.total,
      usuariosNuevos: usersData.newThisMonth,
      usuariosNuevosHoy: usersData.newToday,
      usuariosVerificados: usersData.verified,
      noticias: newsCount.total,
      noticiasEstesMes: newsCount.thisMonth,
      clubes: clubsData.total,
      clubesConContacto: clubsData.withContact,
      torneos: tournamentsData.total,
      torneosActivos: tournamentsData.active,
      torneosProximos: tournamentsData.upcoming,
      crecimientoMensual: usersData.growthPercentage
    }

    return apiSuccess(stats)
  } catch (error) {
    return handleError(error)
  }
}

async function getUserStats() {
  // Get all users from Supabase Auth
  const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000 // Maximum allowed
  })

  if (usersError) {
    throw new Error(`Failed to fetch users: ${usersError.message}`)
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const total = users.length
  const newThisMonth = users.filter(user => new Date(user.created_at) >= startOfMonth).length
  const newToday = users.filter(user => new Date(user.created_at) >= startOfToday).length
  const verified = users.filter(user => user.email_confirmed_at !== null).length
  const newLastMonth = users.filter(user => {
    const createdAt = new Date(user.created_at)
    return createdAt >= startOfLastMonth && createdAt < startOfMonth
  }).length

  // Calculate growth percentage
  const growthPercentage = newLastMonth > 0 ? 
    ((newThisMonth - newLastMonth) / newLastMonth * 100).toFixed(1) : 
    newThisMonth > 0 ? '100.0' : '0.0'

  return {
    total,
    newThisMonth,
    newToday,
    verified,
    growthPercentage: `${growthPercentage}%`
  }
}

async function getNewsStats() {
  const { count: total, error: totalError } = await supabaseAdmin
    .from('news')
    .select('*', { count: 'exact', head: true })

  if (totalError) {
    throw new Error(`Failed to fetch news count: ${totalError.message}`)
  }

  // Get news count for this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: thisMonth, error: monthError } = await supabaseAdmin
    .from('news')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString())

  if (monthError) {
    throw new Error(`Failed to fetch monthly news count: ${monthError.message}`)
  }

  return {
    total: total || 0,
    thisMonth: thisMonth || 0
  }
}

async function getClubStats() {
  const { data: clubs, error } = await supabaseAdmin
    .from('clubs')
    .select('*')

  if (error) {
    throw new Error(`Failed to fetch clubs: ${error.message}`)
  }

  const total = clubs.length
  const withContact = clubs.filter(club => club.mail || club.telephone).length

  return {
    total,
    withContact
  }
}

async function getTournamentStats() {
  // Get tournaments with their dates
  const { data: tournaments, error } = await supabaseAdmin
    .from('tournaments')
    .select(`
      *,
      tournament_dates:tournamentdates(
        event_date
      )
    `)

  if (error) {
    throw new Error(`Failed to fetch tournaments: ${error.message}`)
  }

  const now = new Date()
  now.setHours(0, 0, 0, 0) // Start of today

  let active = 0
  let upcoming = 0

  tournaments.forEach(tournament => {
    const dates = tournament.tournament_dates?.map((d: any) => new Date(d.event_date)) || []
    
    if (dates.length === 0) return

    dates.sort((a, b) => a.getTime() - b.getTime())
    const startDate = dates[0]
    const endDate = dates[dates.length - 1]

    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    if (now >= startDate && now <= endDate) {
      active++
    } else if (startDate > now) {
      upcoming++
    }
  })

  return {
    total: tournaments.length,
    active,
    upcoming
  }
} 