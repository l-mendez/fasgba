# API Usage Guide

This guide provides practical examples for using the Chess Club Management API. All examples assume the API is hosted at `https://api.example.com`.

## Table of Contents
- [Authentication](#authentication)
- [Clubs](#clubs)
- [Tournaments](#tournaments)  
- [Users](#users)
- [Error Handling](#error-handling)

---

## Authentication

Most API endpoints require JWT authentication. Include the token in the Authorization header:

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
  "memberCount": 45,
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

**Description:** Get all members of a specific club.

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/clubs/1/members"
```

**Example Response:**
```json
[
  {
    "id": 101,
    "name": "Juan",
    "surname": "Pérez",
    "email": "juan.perez@email.com",
    "profile_picture": "https://example.com/avatars/juan.jpg",
    "biography": "Jugador de ajedrez desde los 8 años",
    "current_elo": 1650
  },
  {
    "id": 102,
    "name": "María",
    "surname": "González",
    "email": "maria.gonzalez@email.com",
    "profile_picture": null,
    "biography": "Maestra FIDE",
    "current_elo": 2150
  }
]
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
    "created_by_user_id": 101,
    "created_at": "2024-03-01T10:00:00Z",
    "updated_at": "2024-03-01T10:00:00Z",
    "author_name": "Juan Pérez"
  }
]
```

---

## Tournaments

### Get All Tournaments

**Endpoint:** `GET /api/tournaments`

**Description:** Retrieve tournaments with filtering and pagination.

**Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `orderBy` (optional): Order by field ("start_date" | "title")
- `order` (optional): Sort order ("asc" | "desc")
- `status` (optional): Filter by status ("upcoming" | "ongoing" | "past" | "all")
- `search` (optional): Search by title or description
- `format` (optional): Response format ("summary" | "display" | "raw")

**Example Request - Upcoming Tournaments:**
```bash
curl -X GET "https://api.example.com/api/tournaments?status=upcoming&format=summary&limit=5"
```

**Example Request - Search Tournaments:**
```bash
curl -X GET "https://api.example.com/api/tournaments?search=blitz&format=display"
```

**Example Response (format=summary):**
```json
[
  {
    "id": 301,
    "title": "Torneo Blitz Mensual",
    "start_date": "2024-04-15T00:00:00Z",
    "end_date": null,
    "formatted_start_date": "lunes, 15 de abril de 2024",
    "place": "Club Magnus Carlsen",
    "location": "Buenos Aires",
    "cost": "$500",
    "image": "https://example.com/tournaments/blitz-monthly.jpg",
    "is_upcoming": true,
    "is_ongoing": false
  }
]
```

### Get Tournament by ID

**Endpoint:** `GET /api/tournaments/{id}`

**Description:** Retrieve a specific tournament.

**Parameters:**
- `format` (optional): Response format ("display" | "raw")

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/tournaments/301?format=display"
```

**Example Response:**
```json
{
  "id": 301,
  "title": "Torneo Blitz Mensual",
  "description": "Torneo de ajedrez rápido para todos los niveles",
  "time": "10:00",
  "place": "Club Magnus Carlsen",
  "location": "Buenos Aires",
  "rounds": 7,
  "pace": "3+2",
  "inscription_details": "Inscripción hasta el 14 de abril",
  "cost": "$500",
  "prizes": "1º lugar: $5000, 2º lugar: $3000, 3º lugar: $2000",
  "image": "https://example.com/tournaments/blitz-monthly.jpg",
  "start_date": "2024-04-15T00:00:00Z",
  "end_date": null,
  "formatted_start_date": "lunes, 15 de abril de 2024",
  "formatted_end_date": null,
  "duration_days": 1,
  "is_upcoming": true,
  "is_ongoing": false,
  "is_past": false,
  "all_dates": ["2024-04-15T00:00:00Z"],
  "formatted_all_dates": ["lunes, 15 de abril de 2024"]
}
```

---

## Users

### Get Current User Profile

**Endpoint:** `GET /api/users/me/profile`

**Description:** Get the authenticated user's profile information.

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/users/me/profile" \
  -H "Authorization: Bearer your_jwt_token"
```

**Example Response:**
```json
{
  "id": "auth_user_id_123",
  "email": "user@example.com",
  "nombre": "Carlos",
  "apellido": "Rodriguez",
  "telefono": "+54-11-9876-5432",
  "direccion": "Av. Corrientes 1234, CABA",
  "fecha_nacimiento": "1990-05-15",
  "permisos": ["user", "club_admin"],
  "created_at": "2024-01-15T08:30:00Z",
  "updated_at": "2024-03-01T14:22:00Z"
}
```

### Update User Profile

**Endpoint:** `PUT /api/users/me/profile`

**Description:** Update the authenticated user's profile.

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
  "canViewAdmin": true,
  "canManageUsers": false,
  "canManageContent": true,
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

### Upload Avatar

**Endpoint:** `POST /api/users/me/avatar`

**Description:** Upload a new avatar image for the authenticated user.

**Request Body:** Multipart form data with a file field.

**Example Request:**
```bash
curl -X POST "https://api.example.com/api/users/me/avatar" \
  -H "Authorization: Bearer your_jwt_token" \
  -F "file=@/path/to/avatar.jpg"
```

**Example Response:**
```json
{
  "success": true
}
```

### Get Avatar URL

**Endpoint:** `GET /api/users/me/avatar`

**Description:** Get the authenticated user's avatar URL.

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/users/me/avatar" \
  -H "Authorization: Bearer your_jwt_token"
```

**Example Response:**
```json
{
  "avatarUrl": "https://example.com/storage/avatars/user_id_123/avatar.jpg"
}
```

### Update Password

**Endpoint:** `PUT /api/users/me/password`

**Description:** Update the authenticated user's password.

**Request Body:**
```json
{
  "newPassword": "new_secure_password_123"
}
```

**Example Request:**
```bash
curl -X PUT "https://api.example.com/api/users/me/password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "newPassword": "new_secure_password_123"
  }'
```

**Example Response:**
```json
{
  "success": true
}
```

---

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "details": "Additional error details (optional)"
}
```

### Common Error Codes

- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., already following a club)
- **413 Payload Too Large**: File upload too large
- **500 Internal Server Error**: Server error

### Example Error Responses

**401 Unauthorized:**
```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

**404 Not Found:**
```json
{
  "error": "Club not found",
  "code": "CLUB_NOT_FOUND",
  "details": "No club exists with ID 999"
}
```

**400 Bad Request:**
```json
{
  "error": "Invalid request data",
  "code": "VALIDATION_ERROR",
  "details": "Field 'name' is required"
}
```

---

## JavaScript/TypeScript Example

Here's a complete example of using the API with JavaScript:

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
  
  return response.json();
}

// Example usage
async function examples() {
  try {
    // Get all clubs
    const clubs = await apiCall('/api/clubs');
    console.log('Clubs:', clubs);
    
    // Get upcoming tournaments
    const tournaments = await apiCall('/api/tournaments?status=upcoming&format=summary');
    console.log('Upcoming tournaments:', tournaments);
    
    // Get user profile
    const profile = await apiCall('/api/users/me/profile');
    console.log('User profile:', profile);
    
    // Follow a club
    await apiCall(`/api/clubs/1/followers`, { method: 'POST' });
    console.log('Successfully followed club');
    
    // Update profile
    const updatedProfile = await apiCall('/api/users/me/profile', {
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
2. **Use appropriate HTTP methods** - GET for reading, POST for creating, PUT for updating, DELETE for removing
3. **Include authentication** - Most endpoints require a valid JWT token
4. **Validate input** - Check data before sending to the API
5. **Use pagination** - For large datasets, use page and limit parameters
6. **Cache responses** - Where appropriate, cache API responses to improve performance
7. **Respect rate limits** - Implement appropriate delays between requests if needed

---

## Support

For additional help or questions about the API, please contact the development team or refer to the API documentation. 