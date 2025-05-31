# API Endpoint Design

## Overview
This document outlines the RESTful API endpoints designed based on the simplified authentication system using Supabase Auth directly without a separate users table.

## Authentication
- All endpoints require JWT-based authentication via Supabase Auth
- User-specific endpoints use `/api/users/me/...` pattern
- Admin-only endpoints check the `admins` table for site-wide permissions
- Club admin permissions are managed via the `club_admins` table

---

## 1. Club Management Endpoints

### 1.1 Club CRUD Operations

#### GET /api/clubs
**Description:** Retrieve all clubs with optional filtering and search
**Path Parameters:** None
**Query Parameters:**
- `search?: string` - Search clubs by name
- `hasContact?: boolean` - Filter clubs with contact information
- `include?: string` - Include additional data ("stats")

**Response:**
- **Success:** 200 OK
- **Body:** `Club[]` or `ClubWithStats[]` (if include=stats)
- **Error:** 500 Internal Server Error

#### GET /api/clubs/{clubId}
**Description:** Retrieve a specific club by ID
**Path Parameters:**
- `clubId: number` - Club identifier

**Query Parameters:**
- `include?: string` - Include additional data ("stats")

**Response:**
- **Success:** 200 OK
- **Body:** `Club` or `ClubWithStats`
- **Error:** 404 Not Found, 500 Internal Server Error

#### POST /api/clubs
**Description:** Create a new club (admin only)
**Path Parameters:** None
**Request Body:** `Omit<Club, 'id'>`
```json
{
  "name": "string",
  "address": "string | null",
  "telephone": "string | null", 
  "mail": "string | null",
  "schedule": "string | null"
}
```

**Response:**
- **Success:** 201 Created
- **Body:** `Club`
- **Error:** 400 Bad Request, 401 Unauthorized, 403 Forbidden

#### PUT /api/clubs/{clubId}
**Description:** Update a club (admin only)
**Path Parameters:**
- `clubId: number` - Club identifier

**Request Body:** `Partial<Omit<Club, 'id'>>`
**Response:**
- **Success:** 200 OK
- **Body:** `{ "success": true }`
- **Error:** 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

#### DELETE /api/clubs/{clubId}
**Description:** Delete a club (admin only)
**Path Parameters:**
- `clubId: number` - Club identifier

**Response:**
- **Success:** 204 No Content
- **Error:** 401 Unauthorized, 403 Forbidden, 404 Not Found

### 1.2 Club Members

#### GET /api/clubs/{clubId}/members
**Description:** Get all members of a club (currently returns empty as no membership system is implemented)
**Path Parameters:**
- `clubId: number` - Club identifier

**Response:**
- **Success:** 200 OK
- **Body:** `[]` (empty array)
- **Error:** 404 Not Found, 500 Internal Server Error

#### GET /api/clubs/{clubId}/members/count
**Description:** Get member count for a club (currently returns 0)
**Path Parameters:**
- `clubId: number` - Club identifier

**Response:**
- **Success:** 200 OK
- **Body:** `{ "count": 0 }`
- **Error:** 404 Not Found, 500 Internal Server Error

### 1.3 Club Admins

#### GET /api/clubs/{clubId}/admins
**Description:** Get all admins of a club
**Path Parameters:**
- `clubId: number` - Club identifier

**Response:**
- **Success:** 200 OK
- **Body:** `ClubAdmin[]` (contains auth_id and email)
- **Error:** 404 Not Found, 500 Internal Server Error

#### GET /api/clubs/{clubId}/admins/count
**Description:** Get admin count for a club
**Path Parameters:**
- `clubId: number` - Club identifier

**Response:**
- **Success:** 200 OK
- **Body:** `{ "count": number }`
- **Error:** 404 Not Found, 500 Internal Server Error

#### GET /api/clubs/{clubId}/admins/{authId}
**Description:** Check if a user is an admin of a club
**Path Parameters:**
- `clubId: number` - Club identifier
- `authId: string` - User's Supabase Auth UUID

**Response:**
- **Success:** 200 OK
- **Body:** `{ "isAdmin": boolean }`
- **Error:** 404 Not Found, 500 Internal Server Error

### 1.4 Club Followers

#### GET /api/clubs/{clubId}/followers/count
**Description:** Get follower count for a club
**Path Parameters:**
- `clubId: number` - Club identifier

**Response:**
- **Success:** 200 OK
- **Body:** `{ "count": number }`
- **Error:** 404 Not Found, 500 Internal Server Error

#### GET /api/clubs/{clubId}/followers/{authId}
**Description:** Check if a user is following a club
**Path Parameters:**
- `clubId: number` - Club identifier
- `authId: string` - User's Supabase Auth UUID

**Response:**
- **Success:** 200 OK
- **Body:** `{ "isFollowing": boolean }`
- **Error:** 404 Not Found, 500 Internal Server Error

#### POST /api/clubs/{clubId}/followers
**Description:** Follow a club (authenticated user)
**Path Parameters:**
- `clubId: number` - Club identifier

**Response:**
- **Success:** 201 Created
- **Body:** `{ "success": true }`
- **Error:** 400 Bad Request, 401 Unauthorized, 409 Conflict

#### DELETE /api/clubs/{clubId}/followers
**Description:** Unfollow a club (authenticated user)
**Path Parameters:**
- `clubId: number` - Club identifier

**Response:**
- **Success:** 204 No Content
- **Error:** 401 Unauthorized, 404 Not Found

### 1.5 Club News

#### GET /api/clubs/{clubId}/news
**Description:** Get news from a specific club
**Path Parameters:**
- `clubId: number` - Club identifier

**Query Parameters:**
- `limit?: number` - Maximum number of news items to return

**Response:**
- **Success:** 200 OK
- **Body:** `ClubNews[]`
- **Error:** 404 Not Found, 500 Internal Server Error

#### GET /api/clubs/{clubId}/news/count
**Description:** Get news count for a club
**Path Parameters:**
- `clubId: number` - Club identifier

**Response:**
- **Success:** 200 OK
- **Body:** `{ "count": number }`
- **Error:** 404 Not Found, 500 Internal Server Error

---

## 2. Tournament Management Endpoints

#### GET /api/tournaments
**Description:** Retrieve tournaments with various filtering options
**Path Parameters:** None
**Query Parameters:**
- `page?: number` - Page number for pagination (default: 1)
- `limit?: number` - Items per page (default: 10)
- `orderBy?: string` - Order by field ("start_date" | "title", default: "start_date")
- `order?: string` - Sort order ("asc" | "desc", default: "asc")
- `status?: string` - Filter by status ("upcoming" | "ongoing" | "past" | "all", default: "all")
- `search?: string` - Search tournaments by title or description
- `format?: string` - Response format ("summary" | "display" | "raw", default: "raw")

**Response:**
- **Success:** 200 OK
- **Body:** 
  - If format=summary: `TournamentSummary[]`
  - If format=display: `TournamentDisplay[]`
  - Default: `TournamentWithDates[]`
- **Error:** 400 Bad Request, 500 Internal Server Error

#### GET /api/tournaments/{id}
**Description:** Retrieve a specific tournament by ID
**Path Parameters:**
- `id: number` - Tournament identifier

**Query Parameters:**
- `format?: string` - Response format ("display" | "raw", default: "raw")

**Response:**
- **Success:** 200 OK
- **Body:** `Tournament` or `TournamentDisplay` (if format=display)
- **Error:** 404 Not Found, 500 Internal Server Error

#### GET /api/tournaments/health
**Description:** Check tournaments table status (admin only)
**Path Parameters:** None

**Response:**
- **Success:** 200 OK
- **Body:** 
```json
{
  "tableExists": boolean,
  "rowCount": number,
  "sampleData": any[],
  "error": "string | undefined"
}
```
- **Error:** 401 Unauthorized, 403 Forbidden, 500 Internal Server Error

#### GET /api/tournaments/schema
**Description:** Check tournaments table structure (admin only)
**Path Parameters:** None

**Response:**
- **Success:** 200 OK
- **Body:** `{ "columns": string[], "sampleRow": any }`
- **Error:** 401 Unauthorized, 403 Forbidden, 500 Internal Server Error

---

## 3. News Management Endpoints

### 3.1 News CRUD Operations

#### GET /api/news
**Description:** Retrieve all news with filtering, search, and pagination
**Path Parameters:** None
**Query Parameters:**
- `page?: number` - Page number for pagination (default: 1)
- `limit?: number` - Items per page (default: 10, max: 100)
- `orderBy?: string` - Order by field ("date" | "title" | "created_at" | "updated_at", default: "date")
- `order?: string` - Sort order ("asc" | "desc", default: "desc")
- `search?: string` - Search news by title, extract, or content
- `clubId?: number` - Filter by club ID
- `authorId?: string` - Filter by author's Supabase Auth UUID
- `tags?: string` - Filter by tags (JSON array or comma-separated)
- `include?: string` - Include additional data ("author" | "club", default: "author,club")

**Response:**
- **Success:** 200 OK
- **Body:** 
```json
{
  "news": "NewsDisplay[]",
  "pagination": {
    "page": "number",
    "limit": "number", 
    "total": "number",
    "totalPages": "number"
  }
}
```
- **Error:** 400 Bad Request, 500 Internal Server Error

#### GET /api/news/{id}
**Description:** Retrieve a specific news item by ID
**Path Parameters:**
- `id: number` - News identifier

**Query Parameters:**
- `include?: string` - Include additional data ("author" | "club", default: "author,club")

**Response:**
- **Success:** 200 OK
- **Body:** `NewsDisplay`
- **Error:** 404 Not Found, 500 Internal Server Error

#### POST /api/news
**Description:** Create a new news item (authenticated users)
**Path Parameters:** None
**Request Body:**
```json
{
  "title": "string",
  "extract": "string (optional)",
  "text": "string",
  "image": "string (optional)",
  "tags": "string[] (optional)",
  "club_id": "number (optional)"
}
```

**Response:**
- **Success:** 201 Created
- **Body:** `News`
- **Error:** 400 Bad Request, 401 Unauthorized, 500 Internal Server Error

#### PATCH /api/news/{id}
**Description:** Update a news item (author or admin only)
**Path Parameters:**
- `id: number` - News identifier

**Request Body:** `Partial<UpdateNewsInput>`
```json
{
  "title": "string (optional)",
  "extract": "string (optional)",
  "text": "string (optional)",
  "image": "string (optional)",
  "tags": "string[] (optional)",
  "club_id": "number (optional)"
}
```

**Response:**
- **Success:** 200 OK
- **Body:** `{ "success": true }`
- **Error:** 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

#### DELETE /api/news/{id}
**Description:** Delete a news item (author or admin only)
**Path Parameters:**
- `id: number` - News identifier

**Response:**
- **Success:** 204 No Content
- **Error:** 401 Unauthorized, 403 Forbidden, 404 Not Found

### 3.2 News Utility Endpoints

#### GET /api/news/count
**Description:** Get total news count with optional filtering
**Path Parameters:** None
**Query Parameters:**
- `clubId?: number` - Filter by club ID
- `authorId?: string` - Filter by author's Supabase Auth UUID
- `tags?: string` - Filter by tags (JSON array or comma-separated)

**Response:**
- **Success:** 200 OK
- **Body:** `{ "count": number }`
- **Error:** 500 Internal Server Error

#### GET /api/news/tags
**Description:** Get all available news tags
**Path Parameters:** None

**Response:**
- **Success:** 200 OK
- **Body:** `{ "tags": string[] }`
- **Error:** 500 Internal Server Error

#### GET /api/news/{id}/related
**Description:** Get related news based on tags
**Path Parameters:**
- `id: number` - News identifier

**Query Parameters:**
- `limit?: number` - Maximum number of related items (default: 4, max: 20)

**Response:**
- **Success:** 200 OK
- **Body:** `{ "related": NewsDisplay[] }`
- **Error:** 404 Not Found, 500 Internal Server Error

---

## 4. User Management Endpoints

### 4.1 User Profile

#### GET /api/users/me
**Description:** Get current authenticated user information from Supabase Auth
**Path Parameters:** None

**Response:**
- **Success:** 200 OK
- **Body:** `User` (Supabase User type)
- **Error:** 401 Unauthorized

#### GET /api/users/me/profile
**Description:** Get current user's profile information from Supabase Auth user_metadata
**Path Parameters:** None

**Response:**
- **Success:** 200 OK
- **Body:** 
```json
{
  "id": "string (UUID)",
  "email": "string",
  "nombre": "string",
  "apellido": "string",
  "telefono": "string",
  "direccion": "string",
  "fecha_nacimiento": "string",
  "created_at": "string",
  "updated_at": "string"
}
```
- **Error:** 401 Unauthorized

#### PUT /api/users/me/profile
**Description:** Update current user's profile in Supabase Auth user_metadata
**Path Parameters:** None
**Request Body:**
```json
{
  "nombre": "string (optional)",
  "apellido": "string (optional)",
  "telefono": "string (optional)",
  "direccion": "string (optional)",
  "fecha_nacimiento": "string (optional)"
}
```

**Response:**
- **Success:** 200 OK
- **Body:** `{ "success": true }`
- **Error:** 400 Bad Request, 401 Unauthorized

### 4.2 User Permissions

#### GET /api/users/me/permissions
**Description:** Get current user's permissions (checks admins table)
**Path Parameters:** None

**Response:**
- **Success:** 200 OK
- **Body:** 
```json
{
  "canEditProfile": true,
  "canViewAdmin": "boolean (if is admin)",
  "canManageUsers": "boolean (if is admin)",
  "canManageContent": "boolean (if is admin)",
  "isAdmin": "boolean"
}
```
- **Error:** 401 Unauthorized

### 4.3 User Clubs

#### GET /api/users/me/following
**Description:** Get clubs that the current user is following
**Path Parameters:** None

**Response:**
- **Success:** 200 OK
- **Body:** `Club[]`
- **Error:** 401 Unauthorized

#### GET /api/users/me/admin-clubs
**Description:** Get clubs that the current user administers
**Path Parameters:** None

**Response:**
- **Success:** 200 OK
- **Body:** `Club[]`
- **Error:** 401 Unauthorized

### 4.4 User Avatar

#### GET /api/users/me/avatar
**Description:** Get current user's avatar URL
**Path Parameters:** None

**Response:**
- **Success:** 200 OK
- **Body:** `{ "avatarUrl": string | null }`
- **Error:** 401 Unauthorized

#### POST /api/users/me/avatar
**Description:** Upload a new avatar for the current user
**Path Parameters:** None
**Request Body:** Multipart form data with file

**Response:**
- **Success:** 201 Created
- **Body:** `{ "success": true }`
- **Error:** 400 Bad Request, 401 Unauthorized, 413 Payload Too Large

#### DELETE /api/users/me/avatar
**Description:** Remove current user's avatar
**Path Parameters:** None

**Response:**
- **Success:** 204 No Content
- **Error:** 401 Unauthorized

### 4.5 User Security

#### PUT /api/users/me/password
**Description:** Update current user's password
**Path Parameters:** None
**Request Body:**
```json
{
  "newPassword": "string"
}
```

**Response:**
- **Success:** 200 OK
- **Body:** `{ "success": true }`
- **Error:** 400 Bad Request, 401 Unauthorized

#### GET /api/users/me/email-verification
**Description:** Check if current user's email is verified
**Path Parameters:** None

**Response:**
- **Success:** 200 OK
- **Body:** `{ "isVerified": boolean }`
- **Error:** 401 Unauthorized

---

## 5. Authentication Endpoints

#### GET /api/auth/session
**Description:** Get current session information
**Path Parameters:** None

**Response:**
- **Success:** 200 OK
- **Body:** `Session | null`
- **Error:** 500 Internal Server Error

#### GET /api/auth/status
**Description:** Check if user is authenticated
**Path Parameters:** None

**Response:**
- **Success:** 200 OK
- **Body:** `{ "isAuthenticated": boolean }`
- **Error:** 500 Internal Server Error

#### POST /api/auth/logout
**Description:** Sign out the current user
**Path Parameters:** None

**Response:**
- **Success:** 200 OK
- **Body:** `{ "success": true }`
- **Error:** 500 Internal Server Error

#### GET /api/auth/debug
**Description:** Debug endpoint to check authentication status and related data
**Path Parameters:** None

**Response:**
- **Success:** 200 OK
- **Body:** 
```json
{
  "hasAuthHeader": "boolean",
  "authHeader": "string (truncated)",
  "tokenValid": "boolean",
  "userId": "string | null",
  "userEmail": "string | null",
  "isAdmin": "boolean",
  "followedClubsCount": "number",
  "adminClubsCount": "number",
  "timestamp": "string"
}
```
- **Error:** 500 Internal Server Error

---

## Database Schema Changes

### New Tables:
1. **admins**: Contains auth_id (UUID) for site-wide administrators
2. **club_admins**: Many-to-many relationship between auth_id (UUID) and club_id
3. **user_follows_club**: Many-to-many relationship between auth_id (UUID) and club_id

### Modified Tables:
1. **news**: Now uses `created_by_auth_id` (UUID) instead of `created_by_user_id`
2. **elohistory**: Now uses `auth_id` (UUID) instead of `user_id`

### Removed Tables:
1. **users**: No longer needed as all user data is stored in Supabase Auth

---

## Error Response Format

All error responses follow this structure:
```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "details": "Additional details (optional)"
}
```

## Notes

1. **Authentication**: All endpoints use Supabase Auth UUIDs directly
2. **Admin Permissions**: Site admins are managed via the `admins` table
3. **Club Permissions**: Club-specific permissions via `club_admins` table  
4. **User Data**: All user profile data is stored in Supabase Auth user_metadata
5. **Simplified Architecture**: No more sync issues between auth and database users
6. **RLS Policies**: Updated to work with auth.uid() directly
7. **Performance**: Reduced joins and complexity in most queries
8. **Scalability**: Better suited for large numbers of users
9. **Migration**: Existing data needs to be migrated to use auth UUIDs
10. **Testing**: Use `/api/auth/debug` to verify authentication setup 