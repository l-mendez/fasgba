# Chess Club Management API

A comprehensive RESTful API for managing chess clubs, tournaments, and users built with Next.js 14 and Supabase.

## Features

- **Club Management**: CRUD operations for clubs, members, admins, and followers
- **Tournament Management**: Tournament listings with filtering, search, and multiple response formats
- **User Management**: User profiles, permissions, authentication, and avatar management
- **News Management**: News articles with rich content including text, images, and chess games
- **Image Storage**: File upload and management with Supabase Storage
- **Authentication**: JWT-based authentication with role-based access control
- **Validation**: Request validation using Zod schemas
- **Type Safety**: Full TypeScript implementation with strict typing

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage for images and files
- **Authentication**: Supabase Auth (JWT)
- **Validation**: Zod
- **Language**: TypeScript

## Quick Start

### Prerequisites

- Node.js 18 or higher
- A Supabase project with the required database schema
- Service Role Key for admin operations (storage setup, etc.)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chess-club-api
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local file
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Important**: The `SUPABASE_SERVICE_ROLE_KEY` is required for:
- Setting up storage buckets
- Admin operations that bypass RLS (Row Level Security)
- File uploads and management

4. Set up Supabase Storage buckets:
```bash
npm run setup:storage
```

This will create the necessary storage buckets for:
- `images` - News images and content images
- `avatars` - User profile pictures

5. Run the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`

## Storage Configuration

The application uses Supabase Storage for file management with the following buckets:

- **images**: For news articles, featured images, and content blocks
  - Public access enabled
  - 5MB file size limit
  - Supports: JPEG, PNG, GIF, WebP
  
- **avatars**: For user profile pictures
  - Public access enabled
  - 5MB file size limit
  - Supports: JPEG, PNG, GIF

### Setting Up Storage Manually

If you prefer to set up storage buckets manually in the Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to Storage section
3. Create buckets with these settings:

**Images Bucket**:
- Name: `images`
- Public: `true`
- File size limit: `5242880` (5MB)
- Allowed MIME types: `image/jpeg,image/jpg,image/png,image/gif,image/webp`

**Avatars Bucket**:
- Name: `avatars`
- Public: `true`
- File size limit: `5242880` (5MB)
- Allowed MIME types: `image/jpeg,image/jpg,image/png,image/gif`

## API Endpoints Overview

### Authentication
- `GET /api/auth/session` - Get current session
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/logout` - Sign out user

### Clubs (15 endpoints)
- `GET/POST /api/clubs` - List/Create clubs
- `GET/PUT/DELETE /api/clubs/[id]` - Club operations
- Member, admin, follower, and news management

### News Management
- `GET/POST /api/news` - List/Create news articles
- `GET/PATCH/DELETE /api/news/[id]` - News operations
- `POST /api/news/[id]/upload-image` - Upload images for news editing
- `DELETE /api/news/[id]/upload-image` - Remove uploaded images

### Tournaments (4 endpoints)
- `GET /api/tournaments` - List tournaments with filtering
- `GET /api/tournaments/[id]` - Get tournament details
- Health and schema endpoints for admin users

### Users (11 endpoints)
- Profile management under `/api/users/me/`
- Permissions, clubs, avatar, and security endpoints

## Documentation

📖 **For detailed API usage, examples, and testing instructions, see [API_USAGE_GUIDE.md](./API_USAGE_GUIDE.md)**

📋 **For complete endpoint specifications, see [API_ENDPOINTS.md](./API_ENDPOINTS.md)**

## Project Structure

```
app/api/                    # API routes
├── auth/                   # Authentication endpoints
├── clubs/                  # Club management endpoints
├── tournaments/            # Tournament endpoints
└── users/                  # User management endpoints

lib/
├── middleware/             # Authentication & validation middleware
├── schemas/                # Zod validation schemas
├── utils/                  # API utilities and constants
├── clubUtils.ts           # Club-related database operations
├── tournamentUtils.ts     # Tournament-related operations
└── userUtils.ts           # User-related operations
```

## Development

### Available Scripts

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
npm run type-check    # TypeScript type checking
npm run setup:storage # Set up Supabase Storage buckets
```

### Key Implementation Notes

- All endpoints use proper authentication middleware
- Request validation with Zod ensures data integrity
- Consistent error handling and response formatting
- Existing utility functions are reused from the lib directory
- TypeScript strict mode enabled for maximum type safety

## Authentication

Most endpoints require JWT authentication. Include the token in requests:

```
Authorization: Bearer your_jwt_token_here
```

Admin endpoints require additional permissions verification.

## Error Handling

All errors follow a consistent format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details (optional)"
}
```

## Contributing

1. Follow TypeScript strict typing
2. Add proper validation for all inputs
3. Include error handling for all operations
4. Update documentation for new endpoints
5. Test all endpoints thoroughly

## License

[Your License Here] 