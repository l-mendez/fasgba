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

## Tournaments

### Get All Tournaments

**Endpoint:** `GET /api/tournaments`

**Description:** Retrieve tournaments with filtering, pagination, and multiple response formats.

**Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `orderBy` (optional): Order by field ("start_date" | "title", default: "start_date")
- `order` (optional): Sort order ("asc" | "desc", default: "asc")
- `status` (optional): Filter by status ("upcoming" | "ongoing" | "past" | "all", default: "all")
- `search` (optional): Search by title or description
- `format` (optional): Response format ("raw" | "display" | "summary", default: "raw")

**Example Request - Basic:**
```bash
curl -X GET "https://api.example.com/api/tournaments"
```

**Example Request - With Filtering:**
```bash
curl -X GET "https://api.example.com/api/tournaments?status=upcoming&format=display&limit=5"
```

**Example Request - Search:**
```bash
curl -X GET "https://api.example.com/api/tournaments?search=Gran%20Prix&format=summary"
```

**Example Response (format=display):**
```json
[
  {
    "id": 1,
    "title": "Gran Prix FASGBA 2025",
    "description": "Torneo válido para el ranking FIDE con importantes premios en efectivo y trofeos.",
    "time": "10:00 AM",
    "place": "Club de Ajedrez Bahía Blanca",
    "location": "Av. Colón 123, Bahía Blanca",
    "rounds": 7,
    "pace": "90 min + 30 seg",
    "inscription_details": "Inscripción abierta hasta el 14 de Abril. Contactar: torneos@fasgba.com.ar",
    "cost": "$5000 general, $3000 sub-18",
    "prizes": "Premios en efectivo para los primeros 5 puestos y trofeos para los 3 primeros.",
    "image": "tournament1.jpg",
    "start_date": "2025-04-15T00:00:00.000Z",
    "end_date": null,
    "formatted_start_date": "martes, 15 de abril de 2025",
    "formatted_end_date": null,
    "duration_days": 1,
    "is_upcoming": true,
    "is_ongoing": false,
    "is_past": false,
    "all_dates": ["2025-04-15T00:00:00.000Z"],
    "formatted_all_dates": ["martes, 15 de abril de 2025"]
  }
]
```

### Get Tournament by ID

**Endpoint:** `GET /api/tournaments/{id}`

**Description:** Retrieve a specific tournament.

**Parameters:**
- `id` (required): Tournament identifier
- `format` (optional): Response format ("raw" | "display", default: "raw")

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/tournaments/1?format=display"
```

**Example Response:**
```json
{
  "id": 1,
  "title": "Gran Prix FASGBA 2025",
  "description": "Torneo válido para el ranking FIDE con importantes premios en efectivo y trofeos.",
  "time": "10:00 AM",
  "place": "Club de Ajedrez Bahía Blanca",
  "location": "Av. Colón 123, Bahía Blanca",
  "rounds": 7,
  "pace": "90 min + 30 seg",
  "inscription_details": "Inscripción abierta hasta el 14 de Abril. Contactar: torneos@fasgba.com.ar",
  "cost": "$5000 general, $3000 sub-18",
  "prizes": "Premios en efectivo para los primeros 5 puestos y trofeos para los 3 primeros.",
  "image": "tournament1.jpg",
  "start_date": "2025-04-15T00:00:00.000Z",
  "end_date": null,
  "formatted_start_date": "martes, 15 de abril de 2025",
  "formatted_end_date": null,
  "duration_days": 1,
  "is_upcoming": true,
  "is_ongoing": false,
  "is_past": false,
  "all_dates": ["2025-04-15T00:00:00.000Z"],
  "formatted_all_dates": ["martes, 15 de abril de 2025"]
}
```

### Create a Tournament

**Endpoint:** `POST /api/tournaments`

**Description:** Create a new tournament (admin only).

**Request Body:**
```json
{
  "title": "Nuevo Torneo de Ajedrez",
  "description": "Descripción detallada del torneo",
  "time": "14:00 hs",
  "place": "Club de Ajedrez Local",
  "location": "Calle Falsa 123, Ciudad",
  "rounds": 6,
  "pace": "60 min + 30 seg",
  "inscription_details": "Inscripción abierta hasta el 20 de junio",
  "cost": "$3000 general, $2000 sub-18",
  "prizes": "Trofeos para los primeros 3 puestos",
  "image": "https://example.com/tournament-image.jpg",
  "dates": ["2025-06-25", "2025-06-26", "2025-06-27"]
}
```

**Example Request:**
```bash
curl -X POST "https://api.example.com/api/tournaments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "title": "Nuevo Torneo de Ajedrez",
    "description": "Descripción detallada del torneo",
    "time": "14:00 hs",
    "place": "Club de Ajedrez Local",
    "location": "Calle Falsa 123, Ciudad",
    "rounds": 6,
    "pace": "60 min + 30 seg",
    "inscription_details": "Inscripción abierta hasta el 20 de junio",
    "cost": "$3000 general, $2000 sub-18",
    "prizes": "Trofeos para los primeros 3 puestos",
    "image": "https://example.com/tournament-image.jpg",
    "dates": ["2025-06-25", "2025-06-26", "2025-06-27"]
  }'
```

**Example Response:**
```json
{
  "id": 6,
  "title": "Nuevo Torneo de Ajedrez",
  "description": "Descripción detallada del torneo",
  "time": "14:00 hs",
  "place": "Club de Ajedrez Local",
  "location": "Calle Falsa 123, Ciudad",
  "rounds": 6,
  "pace": "60 min + 30 seg",
  "inscription_details": "Inscripción abierta hasta el 20 de junio",
  "cost": "$3000 general, $2000 sub-18",
  "prizes": "Trofeos para los primeros 3 puestos",
  "image": "https://example.com/tournament-image.jpg"
}
```

### Update a Tournament

**Endpoint:** `PUT /api/tournaments/{id}` or `PATCH /api/tournaments/{id}`

**Description:** Update an existing tournament (admin only). Both methods support partial updates.

**Request Body (all fields optional):**
```json
{
  "title": "Título Actualizado",
  "description": "Nueva descripción",
  "cost": "$4000 general, $2500 sub-18",
  "dates": ["2025-06-28", "2025-06-29"]
}
```

**Example Request (using PUT):**
```bash
curl -X PUT "https://api.example.com/api/tournaments/6" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "title": "Título Actualizado",
    "cost": "$4000 general, $2500 sub-18"
  }'
```

**Example Request (using PATCH):**
```bash
curl -X PATCH "https://api.example.com/api/tournaments/6" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "cost": "$4000 general, $2500 sub-18",
    "prizes": "Trofeos y medallas para los primeros 3 puestos"
  }'
```

**Example Response:**
```json
{
  "success": true
}
```

### Delete a Tournament

**Endpoint:** `DELETE /api/tournaments/{id}`

**Description:** Delete a tournament and all its associated dates (admin only).

**Example Request:**
```bash
curl -X DELETE "https://api.example.com/api/tournaments/6" \
  -H "Authorization: Bearer your_jwt_token"
```

**Example Response:**
```
Status: 204 No Content
```

### Tournament Health Check

**Endpoint:** `GET /api/tournaments/health`

**Description:** Check tournaments table status (admin only).

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/tournaments/health" \
  -H "Authorization: Bearer your_jwt_token"
```

**Example Response:**
```json
{
  "tableExists": true,
  "rowCount": 5,
  "sampleData": [
    {
      "id": 1,
      "title": "Gran Prix FASGBA 2025"
    }
  ]
}
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
    
    // Get tournaments with display format
    const tournaments = await apiCall('/api/tournaments?format=display&status=upcoming&limit=5');
    console.log('Upcoming tournaments:', tournaments);
    
    // Get specific tournament
    const tournament = await apiCall('/api/tournaments/1?format=display');
    console.log('Tournament details:', tournament);
    
    // Create a new tournament (admin only)
    const newTournament = await apiCall('/api/tournaments', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Torneo de Prueba API',
        description: 'Un torneo creado usando la API',
        time: '15:00 hs',
        place: 'Club de Ajedrez API',
        location: 'Calle de la API 123',
        rounds: 5,
        pace: '90 min + 30 seg',
        inscription_details: 'Inscripción por API solamente',
        cost: '$2000 general',
        prizes: 'Trofeo API al ganador',
        dates: ['2025-12-15', '2025-12-16']
      })
    });
    console.log('Created tournament:', newTournament);
    
    // Update the tournament
    await apiCall(`/api/tournaments/${newTournament.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        cost: '$2500 general, $1500 sub-18',
        prizes: 'Trofeos y medallas para los primeros 3 puestos'
      })
    });
    console.log('Tournament updated');
    
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
    
    // Clean up: delete the test tournament
    await apiCall(`/api/tournaments/${newTournament.id}`, {
      method: 'DELETE'
    });
    console.log('Test tournament deleted');
    
  } catch (error) {
    console.error('API Error:', error.message);
  }
}
```