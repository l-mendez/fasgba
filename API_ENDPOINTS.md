# API Endpoint Design

## Overview
This document outlines the RESTful API endpoints designed based on the TypeScript utility functions in `clubUtils.ts`, `tournamentUtils.ts`, and `userUtils.ts`.

## Authentication
- Most endpoints require JWT-based authentication
- User-specific endpoints use `/api/users/me/...` pattern
- Admin-only endpoints are noted in descriptions

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
**Description:** Get all members of a club
**Path Parameters:**
- `clubId: number` - Club identifier

**Response:**
- **Success:** 200 OK
- **Body:** `ClubMember[]`
- **Error:** 404 Not Found, 500 Internal Server Error

#### GET /api/clubs/{clubId}/members/count
**Description:** Get member count for a club
**Path Parameters:**
- `clubId: number` - Club identifier

**Response:**
- **Success:** 200 OK
- **Body:** `{ "count": number }`
- **Error:** 404 Not Found, 500 Internal Server Error

### 1.3 Club Admins

#### GET /api/clubs/{clubId}/admins
**Description:** Get all admins of a club
**Path Parameters:**
- `clubId: number` - Club identifier

**Response:**
- **Success:** 200 OK
- **Body:** `ClubAdmin[]`
- **Error:** 404 Not Found, 500 Internal Server Error

#### GET /api/clubs/{clubId}/admins/count
**Description:** Get admin count for a club
**Path Parameters:**
- `clubId: number` - Club identifier

**Response:**
- **Success:** 200 OK
- **Body:** `{ "count": number }`
- **Error:** 404 Not Found, 500 Internal Server Error

#### GET /api/clubs/{clubId}/admins/{userId}
**Description:** Check if a user is an admin of a club
**Path Parameters:**
- `clubId: number` - Club identifier
- `userId: number` - User identifier

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

#### GET /api/clubs/{clubId}/followers/{userId}
**Description:** Check if a user is following a club
**Path Parameters:**
- `clubId: number` - Club identifier
- `userId: number` - User identifier

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

## 3. User Management Endpoints

### 3.1 User Profile

#### GET /api/users/me
**Description:** Get current authenticated user information
**Path Parameters:** None

**Response:**
- **Success:** 200 OK
- **Body:** `User` (Supabase User type)
- **Error:** 401 Unauthorized

#### GET /api/users/me/profile
**Description:** Get current user's profile information
**Path Parameters:** None

**Response:**
- **Success:** 200 OK
- **Body:** `UserProfile`
- **Error:** 401 Unauthorized, 404 Not Found

#### PUT /api/users/me/profile
**Description:** Update current user's profile
**Path Parameters:** None
**Request Body:** `Partial<UserProfile>`
```json
{
  "nombre": "string",
  "apellido": "string",
  "telefono": "string",
  "direccion": "string",
  "fecha_nacimiento": "string"
}
```

**Response:**
- **Success:** 200 OK
- **Body:** `{ "success": true }`
- **Error:** 400 Bad Request, 401 Unauthorized

#### GET /api/users/me/name
**Description:** Get current user's full name
**Path Parameters:** None

**Response:**
- **Success:** 200 OK
- **Body:** `{ "fullName": string }`
- **Error:** 401 Unauthorized

### 3.2 User Permissions

#### GET /api/users/me/permissions
**Description:** Get current user's permissions
**Path Parameters:** None

**Response:**
- **Success:** 200 OK
- **Body:** `UserPermissions`
- **Error:** 401 Unauthorized

#### GET /api/users/me/permissions/{permission}
**Description:** Check if user has a specific permission
**Path Parameters:**
- `permission: string` - Permission name

**Response:**
- **Success:** 200 OK
- **Body:** `{ "hasPermission": boolean }`
- **Error:** 401 Unauthorized, 400 Bad Request

### 3.3 User Clubs

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

### 3.4 User Avatar

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

### 3.5 User Security

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

## 4. Authentication Endpoints

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

1. **Authentication**: Most endpoints require valid JWT authentication
2. **Admin Routes**: Routes marked as "admin only" require admin permissions
3. **Rate Limiting**: Consider implementing rate limiting for public endpoints
4. **Pagination**: Large datasets should use pagination with `page` and `limit` parameters
5. **CORS**: Configure CORS appropriately for web clients
6. **Content-Type**: Most requests expect `application/json` content type
7. **File Uploads**: Avatar uploads use `multipart/form-data` 