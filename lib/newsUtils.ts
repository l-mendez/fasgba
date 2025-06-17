import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from './supabase/server'
import { deleteNewsImages } from './imageUtils.server'

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

  // Process the data and fetch author information if needed
  let processedData = (data || []).map(item => ({
    ...item,
    tags: item.tags || []
  }))

  // Fetch author information if included
  if (include.includes('author')) {
    processedData = await Promise.all(
      processedData.map(async (item) => {
        let author_email = undefined
        let author_name = undefined

        if (item.created_by_auth_id) {
          try {
            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(item.created_by_auth_id)
            
            if (!userError && userData.user) {
              author_email = userData.user.email || undefined
              // Get nombre and apellido from user_metadata and combine them
              const nombre = userData.user.user_metadata?.nombre || ''
              const apellido = userData.user.user_metadata?.apellido || ''
              author_name = nombre && apellido ? `${nombre} ${apellido}` : (nombre || apellido || undefined)
            }
          } catch (error) {
            console.warn(`Could not fetch author info for news ${item.id}:`, error)
          }
        }

        return {
          ...item,
          author_email,
          author_name
        }
      })
    )
  } else {
    // Add undefined author fields if not including author info
    processedData = processedData.map(item => ({
      ...item,
      author_email: undefined,
      author_name: undefined
    }))
  }

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

  let processedData = {
    ...data,
    tags: data.tags || []
  }

  // Fetch author information if included
  if (include.includes('author')) {
    let author_email = undefined
    let author_name = undefined

    if (data.created_by_auth_id) {
      try {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(data.created_by_auth_id)
        
        if (!userError && userData.user) {
          author_email = userData.user.email || undefined
          // Get nombre and apellido from user_metadata and combine them
          const nombre = userData.user.user_metadata?.nombre || ''
          const apellido = userData.user.user_metadata?.apellido || ''
          author_name = nombre && apellido ? `${nombre} ${apellido}` : (nombre || apellido || undefined)
        }
      } catch (error) {
        console.warn(`Could not fetch author info for news ${data.id}:`, error)
      }
    }

    processedData = {
      ...processedData,
      author_email,
      author_name
    }
  } else {
    // Add undefined author fields if not including author info
    processedData = {
      ...processedData,
      author_email: undefined,
      author_name: undefined
    }
  }

  return processedData
}

/**
 * Creates a new news item (initially without images, to be updated after creation)
 */
export async function createNews(input: CreateNewsInput): Promise<News> {
  // Create news item first without images to get the ID
  const { data, error } = await supabase
    .from('news')
    .insert({
      title: input.title,
      extract: input.extract,
      text: input.text,
      image: null, // Will be updated after processing
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
 * Updates a news item with processed images in organized folders
 */
export async function updateNewsWithProcessedImages(
  newsId: number, 
  processedText: string, 
  featuredImagePath?: string
): Promise<boolean> {
  const updateData: any = {
    text: processedText,
    updated_at: new Date().toISOString()
  }

  if (featuredImagePath) {
    updateData.image = featuredImagePath
  }

  const { error } = await supabase
    .from('news')
    .update(updateData)
    .eq('id', newsId)

  if (error) {
    console.error('Error updating news with processed images:', error)
    throw new Error('Failed to update news with images')
  }

  return true
}

/**
 * Updates a news item (regular update for other operations)
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
 * Deletes a news item and its associated images from storage
 */
export async function deleteNews(id: number): Promise<boolean> {
  try {
    // Check if news exists
    const { data: news, error: fetchError } = await supabase
      .from('news')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching news for deletion:', fetchError)
      throw new Error('Failed to fetch news for deletion')
    }

    if (!news) {
      throw new Error('News item not found')
    }

    // Delete all images for this news item using the new organized structure
    await deleteNewsImages(id)

    // Delete the news item from database
    const { error: deleteError } = await supabase
      .from('news')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting news from database:', deleteError)
      throw new Error('Failed to delete news')
    }

    return true
  } catch (error) {
    console.error('Error in deleteNews:', error)
    throw error
  }
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
  try {
    const { data, error } = await supabase
      .from('news')
      .select('tags')

    if (error) {
      console.error('Error fetching news tags with service client:', error)
      
      // Try with server client as fallback
      try {
        const serverClient = await createServerClient()
        const { data: serverData, error: serverError } = await serverClient
          .from('news')
          .select('tags')
        
        if (serverError) {
          console.error('Error fetching news tags with server client:', serverError)
          return []
        }
        
        const allTags = new Set<string>()
        serverData?.forEach(item => {
          if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach(tag => allTags.add(tag))
          }
        })

        return Array.from(allTags).sort()
      } catch (serverError) {
        console.error('Server client fallback failed:', serverError)
        return []
      }
    }

    const allTags = new Set<string>()
    data?.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => allTags.add(tag))
      }
    })

    return Array.from(allTags).sort()
  } catch (error) {
    console.error('Error in getAllNewsTags:', error)
    
    // Try with server client as final fallback
    try {
      const serverClient = await createServerClient()
      const { data: serverData, error: serverError } = await serverClient
        .from('news')
        .select('tags')
      
      if (serverError) {
        console.error('Final fallback failed:', serverError)
        return []
      }
      
      const allTags = new Set<string>()
      serverData?.forEach(item => {
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach(tag => allTags.add(tag))
        }
      })

      return Array.from(allTags).sort()
    } catch (finalError) {
      console.error('All fallbacks failed:', finalError)
      return []
    }
  }
} 