import { NextRequest } from 'next/server'
import { apiError } from '@/lib/utils/apiResponse'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean old entries every 5 minutes
if (typeof globalThis !== 'undefined') {
  const interval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key)
    }
  }, 5 * 60 * 1000)
  // Don't prevent process from exiting
  if (interval.unref) interval.unref()
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Rate limit by IP + path. Returns error response if limit exceeded, null if ok.
 * @param request - The incoming request
 * @param maxRequests - Max requests per window (default 30)
 * @param windowMs - Window size in ms (default 60000 = 1 min)
 */
export function rateLimit(
  request: NextRequest,
  maxRequests: number = 30,
  windowMs: number = 60_000
): Response | null {
  const ip = getClientIp(request)
  const key = `${ip}:${request.nextUrl.pathname}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  entry.count++

  if (entry.count > maxRequests) {
    return apiError('Demasiadas solicitudes. Intente de nuevo más tarde.', 429, 'RATE_LIMITED')
  }

  return null
}
