// For server-side direct imports
// Types based on API documentation
interface NewsItem {
  id: number
  title: string
  date: string
  image: string | null
  extract: string | null
  text: string
  tags: string[]
  club_id: number | null
  created_by_auth_id: string | null
  created_at: string
  updated_at: string
  author_email?: string
  author_name?: string
  club?: {
    id: number
    name: string
    address: string | null
  }
}

interface NewsResponse {
  news: NewsItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface Tournament {
  id: number
  title: string
  description: string | null
  time: string | null
  place: string | null
  location: string | null
  rounds: number | null
  pace: string | null
  inscription_details: string | null
  cost: string | null
  prizes: string | null
  image: string | null
  start_date?: string
  end_date?: string | null
  formatted_start_date?: string
  formatted_end_date?: string | null
  duration_days?: number
  is_upcoming?: boolean
  is_ongoing?: boolean
  is_past?: boolean
  all_dates?: string[]
  formatted_all_dates?: string[]
  created_by_club_id?: number | null
}

interface Club {
  id: number
  name: string
  address: string | null
  telephone: string | null
  mail: string | null
  schedule: string | null
}

// Get the correct base URL for API calls
function getApiBaseUrl(): string {
  // On client-side, always use relative URLs
  if (typeof window !== 'undefined') {
    return ''
  }
  
  // On server-side, we need to determine the correct URL
  // In Vercel, use the deployment URL (automatically set)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Default to localhost for development
  return 'http://localhost:3000'
}

// API call helper
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${endpoint}`
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// News API functions
export async function getNews(options: {
  page?: number
  limit?: number
  orderBy?: 'date' | 'title' | 'created_at' | 'updated_at'
  order?: 'asc' | 'desc'
  search?: string
  clubId?: number
  authorId?: string
  tags?: string
  include?: string
} = {}): Promise<NewsResponse> {
  const params = new URLSearchParams()
  
  if (options.page) params.append('page', options.page.toString())
  if (options.limit) params.append('limit', options.limit.toString())
  if (options.orderBy) params.append('orderBy', options.orderBy)
  if (options.order) params.append('order', options.order)
  if (options.search) params.append('search', options.search)
  if (options.clubId) params.append('clubId', options.clubId.toString())
  if (options.authorId) params.append('authorId', options.authorId)
  if (options.tags) params.append('tags', options.tags)
  if (options.include) params.append('include', options.include)

  const queryString = params.toString()
  const endpoint = `/api/news${queryString ? `?${queryString}` : ''}`
  
  return apiCall<NewsResponse>(endpoint)
}

// Tournaments API functions
export async function getTournaments(options: {
  page?: number
  limit?: number
  orderBy?: 'start_date' | 'title'
  order?: 'asc' | 'desc'
  status?: 'upcoming' | 'ongoing' | 'past' | 'all'
  search?: string
  format?: 'summary' | 'display' | 'raw'
} = {}): Promise<Tournament[]> {
  const params = new URLSearchParams()
  
  if (options.page) params.append('page', options.page.toString())
  if (options.limit) params.append('limit', options.limit.toString())
  if (options.orderBy) params.append('orderBy', options.orderBy)
  if (options.order) params.append('order', options.order)
  if (options.status) params.append('status', options.status)
  if (options.search) params.append('search', options.search)
  if (options.format) params.append('format', options.format)

  const queryString = params.toString()
  const endpoint = `/api/tournaments${queryString ? `?${queryString}` : ''}`
  
  return apiCall<Tournament[]>(endpoint)
}

// Clubs API functions
export async function getClubs(options: {
  search?: string
  hasContact?: boolean
  include?: string
} = {}): Promise<Club[]> {
  const params = new URLSearchParams()
  
  if (options.search) params.append('search', options.search)
  if (options.hasContact !== undefined) params.append('hasContact', options.hasContact.toString())
  if (options.include) params.append('include', options.include)

  const queryString = params.toString()
  const endpoint = `/api/clubs${queryString ? `?${queryString}` : ''}`
  
  return apiCall<Club[]>(endpoint)
}

export type { NewsItem, NewsResponse, Tournament, Club } 