import "server-only"

import type { User } from "@supabase/supabase-js"
import { notFound } from "next/navigation"

import { requireAdminAction } from "@/lib/actions/auth"
import { ADMIN_RANKINGS_PAGE_SIZE, getCachedAdminRankingSummaries, paginateRankings } from "@/lib/rankingStorage"
import { ForbiddenError, UnauthorizedError } from "@/lib/middleware/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { DOCUMENT_CATEGORIES, type DocumentCategory } from "@/lib/documentosUtils"
import { SORT_OPTIONS, type SortOption } from "@/lib/schemas/documentosSchemas"

export const ADMIN_ALUMNOS_PER_PAGE = 8
export const ADMIN_PLAYERS_PAGE_SIZE = 50
export const ADMIN_DOCUMENTS_PAGE_SIZE = 100

export interface AdminAlumno {
  auth_id: string
  email: string
  nombre: string
  apellido: string
  created_at: string
}

export interface AdminUserResult {
  id: string
  email: string
  nombre: string
  apellido: string
  club_name?: string
}

export interface AdminTeam {
  id: number
  name: string
  club_id: number
}

export interface AdminClubOption {
  id: number
  name: string
}

export interface AdminClubEdit {
  id: number
  name: string
  address: string | null
  telephone: string | null
  mail: string | null
  schedule: string | null
  image: string | null
}

export interface AdminProfesorEdit {
  id: number
  titulo: string
  foto: string | null
  club_id: number | null
  anio_nacimiento: number | null
  modalidad: string
  zona: string | null
  biografia: string | null
  email: string | null
  telefono: string | null
  tarifa_horaria: string | null
}

export interface AdminArbitroEdit {
  id: number
  name: string
  title: string
  photo: string | null
  club_id: number | null
  birth_year: number | null
  bio: string | null
  email: string | null
  phone: string | null
}

export interface AdminPlayer {
  id: number
  full_name: string
  fide_id: string | null
  rating: number | null
  club: AdminClubOption | null
}

export interface AdminPlayerStats {
  total: number
  withFideId: number
  withClub: number
}

export interface AdminRanking {
  id: string
  name: string
  displayName?: string
  date: string
  totalPlayers: number
  status: "current" | "archived"
  filePath: string
  size: number
}

export interface AdminDocumento {
  id: number
  name: string
  category: DocumentCategory
  file_path: string
  file_size: number | null
  file_type?: string | null
  sort_order?: number
  importance_level?: number
  created_at: string
}

export type CategoryImportance = Record<DocumentCategory, number>

type ClubRelation = { name?: string | null } | { name?: string | null }[] | null

async function requireAdminPageAccess() {
  try {
    await requireAdminAction()
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      notFound()
    }
    throw error
  }
}

function parsePositiveId(id: string): number {
  const value = Number.parseInt(id, 10)
  if (Number.isNaN(value) || value <= 0) notFound()
  return value
}

function getMetadataString(user: User, key: "nombre" | "apellido"): string {
  const value = user.user_metadata?.[key]
  return typeof value === "string" ? value : ""
}

function normalizeClubRelation(club: AdminClubOption | AdminClubOption[] | null): AdminClubOption | null {
  if (Array.isArray(club)) return club[0] || null
  return club || null
}

function getClubName(clubs: ClubRelation): string | null {
  const club = Array.isArray(clubs) ? clubs[0] : clubs
  return club?.name || null
}

function getDefaultCategoryImportance(): CategoryImportance {
  return Object.fromEntries(
    Object.keys(DOCUMENT_CATEGORIES).map((category) => [category, 0])
  ) as CategoryImportance
}

async function getClubAdminNames(supabase: ReturnType<typeof createAdminClient>) {
  const clubMap = new Map<string, string>()

  const { data: clubAdmins } = await supabase
    .from("club_admins")
    .select("auth_id, clubs(name)")

  for (const row of clubAdmins || []) {
    const clubName = getClubName(row.clubs as ClubRelation)
    if (!clubName) continue

    const current = clubMap.get(row.auth_id)
    clubMap.set(row.auth_id, current ? `${current}, ${clubName}` : clubName)
  }

  return clubMap
}

function mapUserResult(user: User, clubMap: Map<string, string>): AdminUserResult {
  return {
    id: user.id,
    email: user.email || "",
    nombre: getMetadataString(user, "nombre"),
    apellido: getMetadataString(user, "apellido"),
    club_name: clubMap.get(user.id) || "",
  }
}

export async function getAdminAlumnosInitialData() {
  await requireAdminPageAccess()

  const supabase = createAdminClient()

  const { data: alumnos, error: alumnosError } = await supabase
    .from("alumnos")
    .select("auth_id, created_at")
    .order("created_at", { ascending: false })

  if (alumnosError) throw alumnosError

  const alumnosWithDetails = await Promise.all(
    (alumnos || []).map(async (alumno): Promise<AdminAlumno> => {
      const { data: { user } } = await supabase.auth.admin.getUserById(alumno.auth_id)

      return {
        auth_id: alumno.auth_id,
        created_at: alumno.created_at,
        email: user?.email || "N/A",
        nombre: user ? getMetadataString(user, "nombre") : "",
        apellido: user ? getMetadataString(user, "apellido") : "",
      }
    })
  )

  const [{ data: { users: authUsers }, error: usersError }, clubMap] = await Promise.all([
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    getClubAdminNames(supabase),
  ])

  if (usersError) throw usersError

  const alumnoIds = new Set(alumnosWithDetails.map((alumno) => alumno.auth_id))
  const availableUsers = (authUsers || [])
    .filter((user) => !alumnoIds.has(user.id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return {
    alumnos: alumnosWithDetails,
    users: availableUsers.slice(0, ADMIN_ALUMNOS_PER_PAGE).map((user) => mapUserResult(user, clubMap)),
    usersTotal: availableUsers.length,
  }
}

export async function getAdminEquiposInitialData() {
  await requireAdminPageAccess()

  const supabase = createAdminClient()
  const [clubsResult, teamsResult] = await Promise.all([
    supabase.from("clubs").select("id, name").order("name", { ascending: true }),
    supabase.from("teams").select("id, name, club_id").order("name", { ascending: true }),
  ])

  if (clubsResult.error) throw clubsResult.error
  if (teamsResult.error) throw teamsResult.error

  const clubs = (clubsResult.data || []) as AdminClubOption[]
  const teamsByClub = (teamsResult.data || []).reduce<Record<number, AdminTeam[]>>((acc, team) => {
    const clubId = team.club_id
    if (!acc[clubId]) acc[clubId] = []
    acc[clubId].push({
      id: team.id,
      name: team.name,
      club_id: clubId,
    })
    return acc
  }, {})

  return { clubs, teamsByClub }
}

export async function getAdminClubOptions() {
  await requireAdminPageAccess()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("clubs")
    .select("id, name")
    .order("name", { ascending: true })

  if (error) throw error

  return (data || []) as AdminClubOption[]
}

export async function getAdminClubEditData(id: string) {
  await requireAdminPageAccess()

  const clubId = parsePositiveId(id)
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("clubs")
    .select("id, name, address, telephone, mail, schedule, image")
    .eq("id", clubId)
    .single()

  if (error || !data) notFound()

  return data as AdminClubEdit
}

export async function getAdminProfesorEditData(id: string) {
  await requireAdminPageAccess()

  const profesorId = parsePositiveId(id)
  const supabase = createAdminClient()
  const [profesorResult, clubs] = await Promise.all([
    supabase
      .from("profesores")
      .select("id, titulo, foto, club_id, anio_nacimiento, modalidad, zona, biografia, email, telefono, tarifa_horaria")
      .eq("id", profesorId)
      .single(),
    getAdminClubOptions(),
  ])

  if (profesorResult.error || !profesorResult.data) notFound()

  return {
    profesor: profesorResult.data as AdminProfesorEdit,
    clubs,
  }
}

export async function getAdminArbitroEditData(id: string) {
  await requireAdminPageAccess()

  const arbitroId = parsePositiveId(id)
  const supabase = createAdminClient()
  const [arbitroResult, clubs] = await Promise.all([
    supabase
      .from("arbitros")
      .select("id, name, title, photo, club_id, birth_year, bio, email, phone")
      .eq("id", arbitroId)
      .single(),
    getAdminClubOptions(),
  ])

  if (arbitroResult.error || !arbitroResult.data) notFound()

  return {
    arbitro: arbitroResult.data as AdminArbitroEdit,
    clubs,
  }
}

export async function getAdminJugadoresInitialData() {
  await requireAdminPageAccess()

  const supabase = createAdminClient()

  const playersQuery = supabase
    .from("players")
    .select(`
      id,
      full_name,
      fide_id,
      rating,
      club:clubs!players_club_id_fkey (
        id,
        name
      )
    `, { count: "exact" })
    .order("full_name", { ascending: true })
    .range(0, ADMIN_PLAYERS_PAGE_SIZE - 1)

  const [playersResult, clubsResult, totalResult, fideResult, clubResult] = await Promise.all([
    playersQuery,
    supabase.from("clubs").select("id, name").order("name", { ascending: true }),
    supabase.from("players").select("*", { count: "exact", head: true }),
    supabase.from("players").select("*", { count: "exact", head: true }).not("fide_id", "is", null),
    supabase.from("players").select("*", { count: "exact", head: true }).not("club_id", "is", null),
  ])

  if (playersResult.error) throw playersResult.error
  if (clubsResult.error) throw clubsResult.error

  const players = (playersResult.data || []).map((player): AdminPlayer => ({
    id: player.id,
    full_name: player.full_name,
    fide_id: player.fide_id,
    rating: player.rating,
    club: normalizeClubRelation(player.club as AdminClubOption | AdminClubOption[] | null),
  }))

  return {
    players,
    totalResults: playersResult.count || 0,
    totalPages: Math.ceil((playersResult.count || 0) / ADMIN_PLAYERS_PAGE_SIZE),
    clubs: (clubsResult.data || []) as AdminClubOption[],
    stats: {
      total: totalResult.count || 0,
      withFideId: fideResult.count || 0,
      withClub: clubResult.count || 0,
    } satisfies AdminPlayerStats,
  }
}

export async function getAdminRankingInitialData(
  page: number = 1,
  pageSize: number = ADMIN_RANKINGS_PAGE_SIZE
) {
  await requireAdminPageAccess()

  const rankings = await getCachedAdminRankingSummaries()
  const paginated = paginateRankings(rankings, page, pageSize)

  return {
    ...paginated,
    existingRankingNames: rankings.map((ranking) => ranking.name),
  }
}

export async function getAdminDocumentosInitialData(sortOption: SortOption = "custom") {
  await requireAdminPageAccess()

  const supabase = createAdminClient()
  const sortConfig = SORT_OPTIONS[sortOption] || SORT_OPTIONS.custom
  const defaultImportance = getDefaultCategoryImportance()

  const [documentsResult, settingsResult] = await Promise.all([
    supabase
      .from("documentos")
      .select("id, name, category, file_path, file_size, file_type, sort_order, importance_level, created_at", { count: "exact" })
      .order(sortConfig.column, { ascending: sortConfig.ascending })
      .range(0, ADMIN_DOCUMENTS_PAGE_SIZE - 1),
    supabase.from("documentos").select("category, importance_level"),
  ])

  if (documentsResult.error) throw documentsResult.error

  const categoryImportance = { ...defaultImportance }
  for (const documento of settingsResult.data || []) {
    if (documento.category in categoryImportance) {
      const category = documento.category as DocumentCategory
      categoryImportance[category] = Math.max(categoryImportance[category], documento.importance_level || 0)
    }
  }

  return {
    documents: (documentsResult.data || []) as AdminDocumento[],
    totalDocuments: documentsResult.count || 0,
    categoryImportance,
  }
}
