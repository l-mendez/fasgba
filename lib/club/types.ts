// Basic club information
export interface Club {
  id: number
  name: string
  address: string | null
  telephone: string | null
  mail: string | null
  schedule: string | null
  image: string | null
}

// Club with additional statistics
export interface ClubWithStats extends Club {
  memberCount: number
  adminCount: number
  followersCount: number
  newsCount: number
}

// Club with follow state for UI
export interface ClubWithFollowState extends Club {
  isFollowing: boolean
}

// Club member information (now just from auth.users)
export interface ClubMember {
  id: string // auth UUID
  email: string
  // Additional profile info would come from user_metadata if needed
}

// Club admin information (now just from auth.users)
export interface ClubAdmin {
  id: string // auth UUID
  email: string
}

// Club news information
export interface ClubNews {
  id: number
  title: string
  date: string
  image: string | null
  extract: string | null
  text: string
  tags: string[]
  created_by_auth_id: string | null
  created_at: string
  updated_at: string
  author_name?: string
  author_email?: string
}

// Interface for date filtering options
export interface DateFilterOptions {
  startDate?: string  // YYYY-MM-DD format
  endDate?: string    // YYYY-MM-DD format
}
