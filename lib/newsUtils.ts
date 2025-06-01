import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Types for News operations
export interface News {
  id: number
  title: string
  date: string
  image: string | null
  extract: string | null
  text: string
  tags: string[] | null
  club_id: number | null
  created_by_auth_id: string | null
  created_at: string
  updated_at: string
}

export interface NewsWithAuthor extends News {
  author_name?: string
  author_email?: string
}

export interface NewsWithClub extends News {
  club?: {
    id: number
    name: string
    address?: string
  }
}

export interface NewsDisplay extends NewsWithAuthor, NewsWithClub {}

export interface CreateNewsInput {
  title: string
  extract?: string
  text: string
  image?: string
  tags?: string[]
  club_id?: number
  created_by_auth_id: string
}

export interface UpdateNewsInput {
  title?: string
  extract?: string
  text?: string
  image?: string
  tags?: string[]
  club_id?: number
}

export interface NewsQueryOptions {
  page?: number
  limit?: number
  orderBy?: 'date' | 'title' | 'created_at' | 'updated_at'
  order?: 'asc' | 'desc'
  search?: string
  clubId?: number
  authorId?: string // Now string (UUID) instead of number
  tags?: string[]
  include?: Array<'author' | 'club'>
}

/**
 * Gets all news with filtering and pagination options
 */
export async function getAllNews(options: NewsQueryOptions = {}): Promise<{ data: NewsDisplay[], total: number }> {
  const {
    page = 1,
    limit = 10,
    orderBy = 'date',
    order = 'desc',
    search,
    clubId,
    authorId,
    tags,
    include = ['author', 'club']
  } = options

  const offset = (page - 1) * limit

  // Build the select query - simplified without user joins
  let selectFields = `
    id,
    title,
    date,
    image,
    extract,
    text,
    tags,
    club_id,
    created_by_auth_id,
    created_at,
    updated_at
  `

  if (include.includes('club')) {
    selectFields += `,
      club:clubs (
        id,
        name,
        address
      )
    `
  }

  let query = supabase
    .from('news')
    .select(selectFields, { count: 'exact' })

  // Apply filters
  if (search) {
    query = query.or(`title.ilike.%${search}%,extract.ilike.%${search}%,text.ilike.%${search}%`)
  }

  if (clubId) {
    query = query.eq('club_id', clubId)
  }

  if (authorId) {
    query = query.eq('created_by_auth_id', authorId)
  }

  if (tags && tags.length > 0) {
    query = query.overlaps('tags', tags)
  }

  // Apply ordering and pagination
  query = query
    .order(orderBy, { ascending: order === 'asc' })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching news:', error)
    throw new Error('Failed to fetch news')
  }

  // Process the data - we'll get author info from Supabase Auth if needed
  const processedData = (data || []).map(item => ({
    ...item,
    // For now, we'll leave author_name and author_email empty
    // They can be fetched separately if needed
    author_name: undefined,
    author_email: undefined,
    tags: item.tags || []
  }))

  return {
    data: processedData,
    total: count || 0
  }
}

/**
 * Gets a single news item by ID
 */
export async function getNewsById(id: number, include: Array<'author' | 'club'> = ['author', 'club']): Promise<NewsDisplay | null> {
  let selectFields = `
    id,
    title,
    date,
    image,
    extract,
    text,
    tags,
    club_id,
    created_by_auth_id,
    created_at,
    updated_at
  `

  if (include.includes('club')) {
    selectFields += `,
      club:clubs (
        id,
        name,
        address
      )
    `
  }

  const { data, error } = await supabase
    .from('news')
    .select(selectFields)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    console.error('Error fetching news by ID:', error)
    throw new Error('Failed to fetch news')
  }

  return {
    ...data,
    author_name: undefined, // Can be fetched separately if needed
    author_email: undefined,
    tags: data.tags || []
  }
}

/**
 * Creates a new news item
 */
export async function createNews(input: CreateNewsInput): Promise<News> {
  const { data, error } = await supabase
    .from('news')
    .insert({
      title: input.title,
      extract: input.extract,
      text: input.text,
      image: input.image,
      tags: input.tags || [],
      club_id: input.club_id,
      created_by_auth_id: input.created_by_auth_id,
      date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating news:', error)
    throw new Error('Failed to create news')
  }

  return data
}

/**
 * Updates a news item
 */
export async function updateNews(id: number, input: UpdateNewsInput): Promise<boolean> {
  const updateData: any = {
    ...input,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('news')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Error updating news:', error)
    throw new Error('Failed to update news')
  }

  return true
}

/**
 * Deletes a news item
 */
export async function deleteNews(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('news')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting news:', error)
    throw new Error('Failed to delete news')
  }

  return true
}

/**
 * Checks if a user can edit/delete a specific news item
 */
export async function canUserEditNews(newsId: number, authId: string): Promise<boolean> {
  const { data: news, error } = await supabase
    .from('news')
    .select('created_by_auth_id, club_id')
    .eq('id', newsId)
    .single()

  if (error || !news) {
    return false
  }

  // Check if user is the author
  if (news.created_by_auth_id === authId) {
    return true
  }

  // Check if user is a site admin
  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('auth_id')
    .eq('auth_id', authId)
    .single()

  if (!adminError && admin) {
    return true
  }

  // Check if user is a club admin for the club associated with this news
  if (news.club_id) {
    const { data: clubAdmin, error: clubAdminError } = await supabase
      .from('club_admins')
      .select('auth_id')
      .eq('auth_id', authId)
      .eq('club_id', news.club_id)
      .single()

    if (!clubAdminError && clubAdmin) {
      return true
    }
  }

  return false
}

/**
 * Gets news count for statistics
 */
export async function getNewsCount(filters: Partial<NewsQueryOptions> = {}): Promise<number> {
  let query = supabase
    .from('news')
    .select('*', { count: 'exact', head: true })

  if (filters.clubId) {
    query = query.eq('club_id', filters.clubId)
  }

  if (filters.authorId) {
    query = query.eq('created_by_auth_id', filters.authorId)
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags)
  }

  const { count, error } = await query

  if (error) {
    console.error('Error getting news count:', error)
    return 0
  }

  return count || 0
}

/**
 * Gets related news based on tags
 */
export async function getRelatedNews(newsId: number, limit: number = 4): Promise<NewsDisplay[]> {
  // First get the current news item to find its tags
  const currentNews = await getNewsById(newsId, [])
  if (!currentNews || !currentNews.tags || currentNews.tags.length === 0) {
    return []
  }

  const { data } = await getAllNews({
    limit,
    tags: currentNews.tags,
    include: ['club']
  })

  // Filter out the current news item
  return data.filter(news => news.id !== newsId)
}

/**
 * Gets unique tags from all news
 */
export async function getAllNewsTags(): Promise<string[]> {
  const { data, error } = await supabase
    .from('news')
    .select('tags')

  if (error) {
    console.error('Error fetching news tags:', error)
    return []
  }

  const allTags = new Set<string>()
  data?.forEach(item => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach(tag => allTags.add(tag))
    }
  })

  return Array.from(allTags).sort()
} 