export interface TournamentFormData {
  title: string
  description: string
  time: string
  place: string
  location: string
  rounds: string
  pace: string
  inscription_details: string
  cost: string
  prizes: string
  registration_link: string
  dates: string[]
  tournament_type: 'individual' | 'team'
  players_per_team: string
  max_teams: string
  registration_deadline: string
  team_match_points: Record<string, number>
}

export interface TournamentFormSource {
  title?: string | null
  description?: string | null
  time?: string | null
  place?: string | null
  location?: string | null
  rounds?: number | null
  pace?: string | null
  inscription_details?: string | null
  cost?: string | null
  prizes?: string | null
  registration_link?: string | null
  all_dates?: string[]
  tournament_type?: 'individual' | 'team' | null
  players_per_team?: number | null
  max_teams?: number | null
  registration_deadline?: string | null
  team_match_points?: Record<string, number> | null
}

export function createEmptyTournamentFormData(): TournamentFormData {
  return {
    title: "",
    description: "",
    time: "",
    place: "",
    location: "",
    rounds: "",
    pace: "",
    inscription_details: "",
    cost: "",
    prizes: "",
    registration_link: "",
    dates: [],
    tournament_type: 'individual',
    players_per_team: "",
    max_teams: "",
    registration_deadline: "",
    team_match_points: {},
  }
}

export function tournamentToFormData(tournament: TournamentFormSource): TournamentFormData {
  const formattedDates = tournament.all_dates?.map((dateStr: string) => {
    const date = new Date(dateStr)
    return date.toISOString().split('T')[0]
  }) || []

  return {
    title: tournament.title || "",
    description: tournament.description || "",
    time: tournament.time || "",
    place: tournament.place || "",
    location: tournament.location || "",
    rounds: tournament.rounds ? String(tournament.rounds) : "",
    pace: tournament.pace || "",
    inscription_details: tournament.inscription_details || "",
    cost: tournament.cost || "",
    prizes: tournament.prizes || "",
    registration_link: tournament.registration_link || "",
    dates: formattedDates,
    tournament_type: tournament.tournament_type || 'individual',
    players_per_team: tournament.players_per_team ? String(tournament.players_per_team) : "",
    max_teams: tournament.max_teams ? String(tournament.max_teams) : "",
    registration_deadline: tournament.registration_deadline || "",
    team_match_points: tournament.team_match_points || {},
  }
}

export interface ValidateTournamentFormOptions {
  isSiteAdmin?: boolean
  selectedClubId?: number
}

export function validateTournamentForm(
  formData: TournamentFormData,
  options: ValidateTournamentFormOptions = {}
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!formData.title.trim()) {
    errors.title = "El título es requerido"
  }

  if (formData.dates.length === 0) {
    errors.dates = "Debe agregar al menos una fecha"
  }

  if (formData.rounds && (isNaN(Number(formData.rounds)) || Number(formData.rounds) <= 0)) {
    errors.rounds = "El número de rondas debe ser un número positivo"
  }

  if (formData.tournament_type === 'team') {
    if (formData.players_per_team && (isNaN(Number(formData.players_per_team)) || Number(formData.players_per_team) <= 0)) {
      errors.players_per_team = "El número de jugadores por equipo debe ser un número positivo"
    }

    if (formData.max_teams && (isNaN(Number(formData.max_teams)) || Number(formData.max_teams) < 2)) {
      errors.max_teams = "El número máximo de equipos debe ser al menos 2"
    }
  }

  if (formData.registration_deadline && formData.dates.length > 0) {
    const registrationDate = new Date(formData.registration_deadline)
    const earliestTournamentDate = new Date(Math.min(...formData.dates.map(date => new Date(date).getTime())))

    if (registrationDate >= earliestTournamentDate) {
      errors.registration_deadline = "La fecha límite de inscripción debe ser anterior al inicio del torneo"
    }
  }

  if (options.isSiteAdmin === false && !options.selectedClubId) {
    errors.club = "Debe seleccionar un club"
  }

  return errors
}

export function buildTournamentApiPayload(formData: TournamentFormData) {
  const tournamentData = {
    title: formData.title.trim(),
    description: formData.description.trim() || undefined,
    time: formData.time.trim() || undefined,
    place: formData.place.trim() || undefined,
    location: formData.location.trim() || undefined,
    rounds: formData.rounds ? Number(formData.rounds) : undefined,
    pace: formData.pace.trim() || undefined,
    inscription_details: formData.inscription_details.trim() || undefined,
    cost: formData.cost.trim() || undefined,
    prizes: formData.prizes.trim() || undefined,
    registration_link: formData.registration_link.trim() || undefined,
    dates: formData.dates,
    tournament_type: formData.tournament_type,
    players_per_team: formData.players_per_team ? Number(formData.players_per_team) : undefined,
    max_teams: formData.max_teams ? Number(formData.max_teams) : undefined,
    registration_deadline: formData.registration_deadline || undefined,
    team_match_points: Object.keys(formData.team_match_points).length > 0 ? formData.team_match_points : undefined,
  }

  return Object.fromEntries(
    Object.entries(tournamentData).filter(([_, value]) => value !== undefined)
  )
}

export function formatTournamentDisplayDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
