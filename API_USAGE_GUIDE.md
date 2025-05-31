# API Usage Guide

This guide provides practical examples for using the Chess Club Management API with simplified Supabase Auth integration. All examples assume the API is hosted at `https://api.example.com`.

## Table of Contents
- [Authentication](#authentication)
- [Clubs](#clubs)
- [Tournaments](#tournaments)  
- [News](#news)
- [Users](#users)
- [Error Handling](#error-handling)

---

## Authentication

All API endpoints require JWT authentication via Supabase Auth. Include the token in the Authorization header:

```http
Authorization: Bearer your_jwt_token_here
```

### Check Authentication Status

**Endpoint:** `GET /api/auth/status`

**Description:** Verify if the current session is authenticated.

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/auth/status" \
  -H "Authorization: Bearer your_jwt_token"
```

**Example Response:**
```json
{
  "isAuthenticated": true
}
```

### Debug Authentication

**Endpoint:** `GET /api/auth/debug`

**Description:** Get detailed authentication information for debugging.

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/auth/debug" \
  -H "Authorization: Bearer your_jwt_token"
```

**Example Response:**
```json
{
  "hasAuthHeader": true,
  "authHeader": "Bearer eyJhbGciOiJIUz...",
  "tokenValid": true,
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "userEmail": "user@example.com",
  "isAdmin": false,
  "followedClubsCount": 2,
  "adminClubsCount": 1,
  "timestamp": "2024-03-20T10:30:00Z"
}
```

### Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Sign out the current user.

**Example Request:**
```bash
curl -X POST "https://api.example.com/api/auth/logout" \
  -H "Authorization: Bearer your_jwt_token"
```

**Example Response:**
```json
{
  "success": true
}
```

---

## Clubs

### Get All Clubs

**Endpoint:** `GET /api/clubs`

**Description:** Retrieve all clubs with optional filtering.

**Parameters:**
- `search` (optional): Search clubs by name
- `hasContact` (optional): Filter clubs with contact information
- `include` (optional): Include additional data ("stats")

**Example Request - Basic:**
```bash
curl -X GET "https://api.example.com/api/clubs"
```

**Example Request - With Search:**
```bash
curl -X GET "https://api.example.com/api/clubs?search=magnus&hasContact=true"
```

**Example Request - With Stats:**
```bash
curl -X GET "https://api.example.com/api/clubs?include=stats"
```

**Example Response:**
```json
[
  {
    "id": 1,
    "name": "Club Magnus Carlsen",
    "address": "123 Chess Street, Buenos Aires",
    "telephone": "+54-11-1234-5678",
    "mail": "contact@clubmagnus.com",
    "schedule": "Lunes a Viernes 18:00-22:00"
  },
  {
    "id": 2,
    "name": "Club Bobby Fischer",
    "address": "456 King Avenue, Córdoba",
    "telephone": "+54-351-9876-5432",
    "mail": "info@clubfischer.com",
    "schedule": "Martes y Jueves 19:00-23:00"
  }
]
```

### Get Club by ID

**Endpoint:** `GET /api/clubs/{clubId}`

**Description:** Retrieve a specific club.

**Parameters:**
- `clubId` (required): Club identifier
- `include` (optional): Include additional data ("stats")

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/clubs/1?include=stats"
```

**Example Response:**
```json
{
  "id": 1,
  "name": "Club Magnus Carlsen",
  "address": "123 Chess Street, Buenos Aires",
  "telephone": "+54-11-1234-5678",
  "mail": "contact@clubmagnus.com",
  "schedule": "Lunes a Viernes 18:00-22:00",
  "memberCount": 0,
  "adminCount": 3,
  "followersCount": 128,
  "newsCount": 12
}
```

### Create a Club

**Endpoint:** `POST /api/clubs`

**Description:** Create a new club (admin only).

**Request Body:**
```json
{
  "name": "New Chess Club",
  "address": "789 New Street, Rosario",
  "telephone": "+54-341-555-0123",
  "mail": "hello@newchessclub.com",
  "schedule": "Miércoles 20:00-22:00"
}
```

**Example Request:**
```bash
curl -X POST "https://api.example.com/api/clubs" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "name": "New Chess Club",
    "address": "789 New Street, Rosario",
    "telephone": "+54-341-555-0123",
    "mail": "hello@newchessclub.com",
    "schedule": "Miércoles 20:00-22:00"
  }'
```

**Example Response:**
```json
{
  "id": 3,
  "name": "New Chess Club",
  "address": "789 New Street, Rosario",
  "telephone": "+54-341-555-0123",
  "mail": "hello@newchessclub.com",
  "schedule": "Miércoles 20:00-22:00"
}
```

### Get Club Members

**Endpoint:** `GET /api/clubs/{clubId}/members`

**Description:** Get all members of a specific club (currently returns empty as no membership system is implemented).

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/clubs/1/members"
```

**Example Response:**
```json
[]
```

### Follow a Club

**Endpoint:** `POST /api/clubs/{clubId}/followers`

**Description:** Follow a club as the authenticated user.

**Example Request:**
```bash
curl -X POST "https://api.example.com/api/clubs/1/followers" \
  -H "Authorization: Bearer your_jwt_token"
```

**Example Response:**
```json
{
  "success": true
}
```

### Unfollow a Club

**Endpoint:** `DELETE /api/clubs/{clubId}/followers`

**Description:** Unfollow a club as the authenticated user.

**Example Request:**
```bash
curl -X DELETE "https://api.example.com/api/clubs/1/followers" \
  -H "Authorization: Bearer your_jwt_token"
```

**Example Response:**
```
Status: 204 No Content
```

### Get Club News

**Endpoint:** `GET /api/clubs/{clubId}/news`

**Description:** Get news from a specific club.

**Parameters:**
- `limit` (optional): Maximum number of news items

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/clubs/1/news?limit=5"
```

**Example Response:**
```json
[
  {
    "id": 201,
    "title": "Torneo de Primavera 2024",
    "date": "2024-03-15",
    "image": "https://example.com/news/spring-tournament.jpg",
    "extract": "Se acerca nuestro torneo anual de primavera...",
    "text": "Contenido completo de la noticia...",
    "tags": ["torneo", "primavera", "2024"],
    "created_by_auth_id": "123e4567-e89b-12d3-a456-426614174000",
    "created_at": "2024-03-01T10:00:00Z",
    "updated_at": "2024-03-01T10:00:00Z"
  }
]
```

---

## News

### Get All News

**Endpoint:** `GET /api/news`

**Description:** Retrieve all news with filtering, search, and pagination.

**Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `orderBy` (optional): Order by field ("date" | "title" | "created_at" | "updated_at")
- `order` (optional): Sort order ("asc" | "desc")
- `search` (optional): Search by title, extract, or content
- `clubId` (optional): Filter by club ID
- `authorId` (optional): Filter by author's Supabase Auth UUID
- `tags` (optional): Filter by tags (JSON array or comma-separated)
- `include` (optional): Include additional data ("author" | "club")

**Example Request - Basic:**
```bash
curl -X GET "https://api.example.com/api/news"
```

**Example Request - With Filtering:**
```bash
curl -X GET "https://api.example.com/api/news?search=torneo&clubId=1&limit=5&orderBy=date&order=desc"
```

**Example Request - Filter by Author UUID:**
```bash
curl -X GET "https://api.example.com/api/news?authorId=123e4567-e89b-12d3-a456-426614174000&include=author,club"
```

**Example Response:**
```json
{
  "news": [
    {
      "id": 201,
      "title": "Torneo de Primavera 2024",
      "date": "2024-03-15T00:00:00Z",
      "image": "https://example.com/news/spring-tournament.jpg",
      "extract": "Se acerca nuestro torneo anual de primavera con importantes premios",
      "text": "Contenido completo de la noticia...",
      "tags": ["torneo", "primavera", "2024"],
      "club_id": 1,
      "created_by_auth_id": "123e4567-e89b-12d3-a456-426614174000",
      "created_at": "2024-03-01T10:00:00Z",
      "updated_at": "2024-03-01T10:00:00Z",
      "club": {
        "id": 1,
        "name": "Club Magnus Carlsen",
        "address": "123 Chess Street, Buenos Aires"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Create News

**Endpoint:** `POST /api/news`

**Description:** Create a new news item (authenticated users).

**Request Body:**
```json
{
  "title": "Nueva Noticia Importante",
  "extract": "Breve descripción de la noticia",
  "text": "Contenido completo de la noticia...",
  "image": "https://example.com/images/news-image.jpg",
  "tags": ["importante", "anuncio"],
  "club_id": 1
}
```

**Example Request:**
```bash
curl -X POST "https://api.example.com/api/news" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "title": "Nueva Noticia Importante",
    "extract": "Breve descripción de la noticia",
    "text": "Contenido completo de la noticia...",
    "image": "https://example.com/images/news-image.jpg",
    "tags": ["importante", "anuncio"],
    "club_id": 1
  }'
```

**Example Response:**
```json
{
  "id": 202,
  "title": "Nueva Noticia Importante",
  "date": "2024-03-20T10:30:00Z",
  "image": "https://example.com/images/news-image.jpg",
  "extract": "Breve descripción de la noticia",
  "text": "Contenido completo de la noticia...",
  "tags": ["importante", "anuncio"],
  "club_id": 1,
  "created_by_auth_id": "123e4567-e89b-12d3-a456-426614174000",
  "created_at": "2024-03-20T10:30:00Z",
  "updated_at": "2024-03-20T10:30:00Z"
}
```

---

## Users

### Get Current User Profile

**Endpoint:** `GET /api/users/me/profile`

**Description:** Get the authenticated user's profile information from Supabase Auth.

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/users/me/profile" \
  -H "Authorization: Bearer your_jwt_token"
```

**Example Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "nombre": "Carlos",
  "apellido": "Rodriguez",
  "telefono": "+54-11-9876-5432",
  "direccion": "Av. Corrientes 1234, CABA",
  "fecha_nacimiento": "1990-05-15",
  "created_at": "2024-01-15T08:30:00Z",
  "updated_at": "2024-03-01T14:22:00Z"
}
```

### Update User Profile

**Endpoint:** `PUT /api/users/me/profile`

**Description:** Update the authenticated user's profile in Supabase Auth user_metadata.

**Request Body:**
```json
{
  "nombre": "Carlos Alberto",
  "telefono": "+54-11-9876-5432",
  "direccion": "Nueva Dirección 567, CABA"
}
```

**Example Request:**
```bash
curl -X PUT "https://api.example.com/api/users/me/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "nombre": "Carlos Alberto",
    "telefono": "+54-11-9876-5432",
    "direccion": "Nueva Dirección 567, CABA"
  }'
```

**Example Response:**
```json
{
  "success": true
}
```

### Get User Permissions

**Endpoint:** `GET /api/users/me/permissions`

**Description:** Get the authenticated user's permissions.

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/users/me/permissions" \
  -H "Authorization: Bearer your_jwt_token"
```

**Example Response:**
```json
{
  "canEditProfile": true,
  "canViewAdmin": false,
  "canManageUsers": false,
  "canManageContent": false,
  "isAdmin": false
}
```

### Get Followed Clubs

**Endpoint:** `GET /api/users/me/following`

**Description:** Get clubs that the authenticated user is following.

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/users/me/following" \
  -H "Authorization: Bearer your_jwt_token"
```

**Example Response:**
```json
[
  {
    "id": 1,
    "name": "Club Magnus Carlsen",
    "address": "123 Chess Street, Buenos Aires",
    "telephone": "+54-11-1234-5678",
    "mail": "contact@clubmagnus.com",
    "schedule": "Lunes a Viernes 18:00-22:00"
  },
  {
    "id": 2,
    "name": "Club Bobby Fischer",
    "address": "456 King Avenue, Córdoba",
    "telephone": "+54-351-9876-5432",
    "mail": "info@clubfischer.com",
    "schedule": "Martes y Jueves 19:00-23:00"
  }
]
```

---

## JavaScript/TypeScript Example

Here's a complete example of using the API with JavaScript, including the new simplified authentication:

```javascript
const API_BASE_URL = 'https://api.example.com';
const token = 'your_jwt_token_here';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    },
    ...options
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  
  if (response.status === 204) {
    return null; // No content
  }
  
  return response.json();
}

// Example usage
async function examples() {
  try {
    // Debug authentication
    const debugInfo = await apiCall('/api/auth/debug');
    console.log('Auth debug info:', debugInfo);
    
    // Get all clubs
    const clubs = await apiCall('/api/clubs');
    console.log('Clubs:', clubs);
    
    // Get user profile
    const profile = await apiCall('/api/users/me/profile');
    console.log('User profile:', profile);
    
    // Get followed clubs
    const followedClubs = await apiCall('/api/users/me/following');
    console.log('Followed clubs:', followedClubs);
    
    // Create news
    const newNews = await apiCall('/api/news', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Mi Primera Noticia',
        extract: 'Una breve descripción',
        text: 'Contenido completo de la noticia...',
        tags: ['prueba', 'primera-noticia'],
        club_id: 1
      })
    });
    console.log('Created news:', newNews);
    
    // Follow a club
    await apiCall(`/api/clubs/1/followers`, { method: 'POST' });
    console.log('Successfully followed club');
    
    // Update profile
    await apiCall('/api/users/me/profile', {
      method: 'PUT',
      body: JSON.stringify({
        nombre: 'New Name',
        telefono: '+54-11-1111-2222'
      })
    });
    console.log('Profile updated');
    
  } catch (error) {
    console.error('API Error:', error.message);
  }
}
```

---

## Best Practices

1. **Always handle errors** - API calls can fail for various reasons
2. **Use appropriate HTTP methods** - GET for reading, POST for creating, PATCH for updating, DELETE for removing
3. **Include authentication** - All endpoints require a valid JWT token from Supabase Auth
4. **Validate input** - Check data before sending to the API
5. **Use pagination** - For large datasets, use page and limit parameters
6. **Cache responses** - Where appropriate, cache API responses to improve performance
7. **Respect rate limits** - Implement appropriate delays between requests if needed
8. **Filter effectively** - Use query parameters to get only the data you need
9. **Handle permissions** - Check user permissions before attempting operations
10. **Use debug endpoint** - Leverage `/api/auth/debug` for troubleshooting authentication issues

---

## Migration Notes

### From Previous Version:
- User IDs are now UUIDs from Supabase Auth instead of integer IDs
- No more separate user database table - all user data is in Supabase Auth
- Admin permissions are managed via the `admins` table
- Club admin permissions are managed via the `club_admins` table
- News creators are referenced by `created_by_auth_id` (UUID)
- User follows and club relationships use auth UUIDs

### Breaking Changes:
- All user ID references changed from `number` to `string` (UUID)
- User profile data structure changed to use Supabase Auth user_metadata
- Authentication endpoints simplified
- Some user utility endpoints removed or simplified

---

## Support

For additional help or questions about the API, please contact the development team or refer to the API documentation. 