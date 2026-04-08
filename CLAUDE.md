# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FASGBA - Chess club management platform for Federación de Ajedrez del Sur del Gran Buenos Aires. Full-stack Next.js app with Supabase backend managing clubs, tournaments, users, rankings, and news.

## Commands

```bash
npm run dev              # Development server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npm run type-check       # TypeScript validation
npm run setup:storage    # Initialize Supabase storage buckets
npm run migrate:ranking  # Migrate ranking data
npm run send:admin-update # Send admin update emails
npm run test:email       # Test email configuration
```

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components by default, Turbopack)
- **Database**: Supabase (PostgreSQL) with RLS policies
- **Auth**: Supabase Auth (JWT tokens)
- **UI**: Tailwind CSS + Shadcn UI (Radix UI primitives) + lucide-react icons + cmdk (command palette)
- **Forms**: React Hook Form + Zod validation (hookform resolvers connect Zod schemas to RHF)
- **Rich Text**: Tiptap editor with image, link, text-align, and list extensions
- **Chess**: chess.js + react-chessboard + pgn-parser (PGN format parsing for game import)
- **Email**: Nodemailer with Zoho SMTP
- **Notifications**: sonner (toast library)
- **Exports**: xlsx-js-style (Excel file generation with cell styling)
- **Theming**: next-themes (dark and light mode)

## Architecture

### Directory Structure

- `/app` - Next.js pages and 60+ API routes
- `/lib` - Shared utilities, auth middleware, database operations
- `/components` - React components (feature + Shadcn UI)
- `/hooks` - Custom React hooks (useAuth, use-toast)
- `/scripts` - CLI utilities for migrations and emails

### API Route Pattern

All API routes follow this structure:
```typescript
import { requireAuth, requireAdmin } from '@/lib/middleware/auth'
import { apiSuccess, handleError, validationError } from '@/lib/utils/apiResponse'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)  // or requireAdmin()
    const data = await fetchData()
    return apiSuccess({ data })
  } catch (error) {
    return handleError(error)
  }
}
```

### Auth Middleware (`lib/middleware/auth.ts`)

- `getAuthenticatedUser(request)` - Extract user from JWT
- `requireAuth(request)` - Enforce authentication
- `requireAdmin(request)` - Enforce admin role
- `hasPermission(permission, userId)` - Check specific permission
- `withAuth()`, `withAdminAuth()` - HOF decorators

**Permission levels** (stored in `admins` table): `canEditProfile`, `canViewAdmin`, `canManageUsers`, `canManageContent`, `isAdmin`

### Supabase Clients (`lib/supabase/`)

- `client.ts` - Browser client
- `server.ts` - Server-side client
- `admin.ts` - Admin operations (uses service role key)

### Validation Schemas (`lib/schemas/`)

Zod schemas for clubs, users, news, tournaments. Used for request body validation.

### API Response Utilities (`lib/utils/apiResponse.ts`)

- `apiSuccess({ data })` - Success response
- `validationError()`, `unauthorizedError()`, `forbiddenError()`, `notFoundError()` - Error responses
- `handleError(error)` - Generic error handler

### Database Types

`lib/database.types.ts` - Auto-generated Supabase TypeScript types

## Key Conventions

- **UX is the priority on all features** — minimize steps, avoid requiring users to copy/paste between pages, provide search by multiple fields (name, email, club), and keep workflows intuitive
- Server Components by default; use `'use client'` only for interactivity
- Spanish localization in UI and email templates
- Custom theme colors: amber (#daa056), terracotta (#8f3f12)
- Storage buckets: `images` (news/content), `avatars` (user profiles) - 5MB limit

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY  # Server-only, never expose to client
NEXT_PUBLIC_SITE_URL
NO_REPLY_PASSWORD          # Zoho SMTP password
```
