import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/seo'

const PRIVATE_PATHS = [
  '/admin',
  '/club-admin',
  '/api/',
  '/auth',
  '/ajustes',
  '/login',
  '/registro',
  '/recuperar-contrasena',
  '/confirmar-email',
  '/documentos',
  '/jugadores/',
  '/*/editar',
  '/*/nueva',
  // Filtered/paginated news listings loop crawlers; articles stay crawlable.
  '/noticias?*',
]

// AI search and assistant crawlers are explicitly welcome: being cited by
// ChatGPT, Perplexity, Claude, Gemini and Google AI Overviews is a goal.
const AI_CRAWLERS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'GPTBot',
  'PerplexityBot',
  'Perplexity-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: PRIVATE_PATHS },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
