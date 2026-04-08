// API Configuration Constants

export const API_CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  
  // File Upload
  MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_AVATAR_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  ALLOWED_AVATAR_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif'],
  
  // Tournaments
  TOURNAMENT_FORMATS: ['summary', 'display', 'raw'] as const,
  TOURNAMENT_STATUSES: ['upcoming', 'ongoing', 'past', 'all'] as const,
  TOURNAMENT_ORDER_BY: ['start_date', 'title'] as const,
  SORT_ORDERS: ['asc', 'desc'] as const,
  
  // Permissions
  USER_PERMISSIONS: [
    'canEditProfile',
    'canViewAdmin', 
    'canManageUsers',
    'canManageContent',
    'isAdmin'
  ] as const,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  
  // Cache
  CACHE_TTL: {
    CLUBS: 5 * 60 * 1000, // 5 minutes
    TOURNAMENTS: 10 * 60 * 1000, // 10 minutes
    USER_PROFILE: 2 * 60 * 1000, // 2 minutes
    PERMISSIONS: 5 * 60 * 1000, // 5 minutes
  }
} as const

export type TournamentFormat = typeof API_CONSTANTS.TOURNAMENT_FORMATS[number]
export type TournamentStatus = typeof API_CONSTANTS.TOURNAMENT_STATUSES[number] 
export type TournamentOrderBy = typeof API_CONSTANTS.TOURNAMENT_ORDER_BY[number]
export type SortOrder = typeof API_CONSTANTS.SORT_ORDERS[number]
export type UserPermission = typeof API_CONSTANTS.USER_PERMISSIONS[number]

// Error Messages
export const ERROR_MESSAGES = {
  // Authentication
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  INVALID_TOKEN: 'Invalid or expired token',
  
  // Validation
  VALIDATION_FAILED: 'Request validation failed',
  INVALID_ID: 'Invalid ID parameter',
  MISSING_REQUIRED_FIELD: 'Missing required field',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_TOO_LARGE: 'File size exceeds limit',
  
  // Resources
  ARBITRO_NOT_FOUND: 'Arbitro not found',
  CLUB_NOT_FOUND: 'Club not found',
  TOURNAMENT_NOT_FOUND: 'Tournament not found',
  USER_NOT_FOUND: 'User not found',
  NEWS_NOT_FOUND: 'News not found',
  
  // Password
  INVALID_CURRENT_PASSWORD: 'La contraseña actual es incorrecta',

  // Operations
  CREATION_FAILED: 'Failed to create resource',
  UPDATE_FAILED: 'Failed to update resource',
  DELETION_FAILED: 'Failed to delete resource',
  ALREADY_EXISTS: 'Resource already exists',
  ALREADY_FOLLOWING: 'Already following this club',
  NOT_FOLLOWING: 'Not following this club',
  
  // Server
  INTERNAL_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database operation failed',
  EXTERNAL_SERVICE_ERROR: 'External service unavailable',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully', 
  DELETED: 'Resource deleted successfully',
  FOLLOWED: 'Successfully followed club',
  UNFOLLOWED: 'Successfully unfollowed club',
  AVATAR_UPLOADED: 'Avatar uploaded successfully',
  AVATAR_DELETED: 'Avatar deleted successfully',
  PASSWORD_UPDATED: 'Password updated successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
} as const

// HTTP Headers
export const HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  CACHE_CONTROL: 'Cache-Control',
  ETAG: 'ETag',
  LAST_MODIFIED: 'Last-Modified',
} as const

// Content Types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  MULTIPART: 'multipart/form-data',
  TEXT: 'text/plain',
  HTML: 'text/html',
} as const 