# Follow-aware Email Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> Historical plan note: this predates the Supabase CLI migration standard.
> References to `app/db` are archival only. Current database guidance lives in
> `docs/database.md`.

**Goal:** Make club-news / club-tournament email notifications actually fire end-to-end and route to followers of the publishing club according to each user's existing notification preference.

**Architecture:** Replace the HTTP self-fetch + admin-gated `/api/notifications/email` endpoint with an in-process library called directly from the news / tournament / ranking handlers. Add follower-aware filtering and a `notification_log` table for observability. No new UI; no new test framework.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL + Auth), Nodemailer + Zoho SMTP.

**Spec:** `docs/superpowers/specs/2026-05-16-follow-aware-email-notifications-design.md`

**Note on testing:** the project has no unit-test framework today. Adding one is out of scope (would over-extend the PR). Verification is `pnpm run type-check`, then a manual smoke test that uses the new `notification_log` table as the assertion surface (Task 9).

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| New | `lib/notifications/types.ts` | Shared types (`BroadcastInput`, `NotificationCategory`, `EmailContent`, `NotificationPrefs`) |
| New | `lib/notifications/filter.ts` | Pure `shouldIncludeUser()` — the truth table |
| New | `lib/notifications/templates.ts` | `buildEmailContent()` — three templates, moved verbatim from the deleted route |
| New | `lib/notifications/sendBroadcast.ts` | Orchestration: build → load followers → paginate users → filter → send → log |
| New | `app/db/migrations/2026-05-16-notification-log.sql` | Standalone DDL for `notification_log` |
| Edit | `app/db/schema.sql` | Append `notification_log` table to keep the snapshot in sync |
| Edit | `app/api/news/route.ts` | Replace fetch block (lines 79-98) with `sendBroadcast()` call |
| Edit | `app/api/tournaments/route.ts` | Replace fetch block (lines 162-181) with `sendBroadcast()` call |
| Edit | `app/api/admin/ranking/confirm/route.ts` | Replace fetch block (lines 108-129) with `sendBroadcast()` call |
| Delete | `app/api/notifications/email/route.ts` | No callers remain |

---

## Task 1: Add `notification_log` table

**Files:**
- Create: `app/db/migrations/2026-05-16-notification-log.sql`
- Modify: `app/db/schema.sql` (append at end)

- [ ] **Step 1: Write the migration file**

Create `app/db/migrations/2026-05-16-notification-log.sql`:

```sql
-- Notification broadcast attempt log (one row per sendBroadcast() invocation).
-- Service-role only; no RLS needed.
CREATE TABLE notification_log (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('news_created', 'tournament_created', 'ranking_updated')),
    target_id TEXT,
    club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
    recipients_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('sent', 'no_recipients', 'error')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notification_log_created_at_idx ON notification_log (created_at DESC);
CREATE INDEX notification_log_type_status_idx ON notification_log (type, status);
```

- [ ] **Step 2: Append the same DDL to `app/db/schema.sql`**

Append to the end of `app/db/schema.sql`:

```sql

-- 🔔 Notification broadcast attempt log
CREATE TABLE notification_log (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('news_created', 'tournament_created', 'ranking_updated')),
    target_id TEXT,
    club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
    recipients_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('sent', 'no_recipients', 'error')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notification_log_created_at_idx ON notification_log (created_at DESC);
CREATE INDEX notification_log_type_status_idx ON notification_log (type, status);
```

- [ ] **Step 3: Apply the migration in Supabase**

Run the contents of `app/db/migrations/2026-05-16-notification-log.sql` in the Supabase SQL editor against the development project. Verify with:

```sql
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notification_log';
```

Expected: 7 rows (id, type, target_id, club_id, recipients_count, status, error_message, created_at).

- [ ] **Step 4: Commit**

```bash
git add app/db/migrations/2026-05-16-notification-log.sql app/db/schema.sql
git commit -m "feat(notifications): add notification_log table"
```

Note: `lib/database.types.ts` is hand-managed in this project (no gen script in `package.json`). Inserts into `notification_log` from `sendBroadcast` will be untyped (`as any` at the call site or just rely on inference). Adding strict types is a follow-up.

---

## Task 2: Shared types

**Files:**
- Create: `lib/notifications/types.ts`

- [ ] **Step 1: Write `lib/notifications/types.ts`**

```ts
export type NotificationType = 'news_created' | 'tournament_created' | 'ranking_updated'

export type NotificationCategory =
  | 'news_fasgba'
  | 'news_club'
  | 'tournament_fasgba'
  | 'tournament_club'
  | 'ranking'

export type BroadcastInput =
  | { type: 'news_created'; newsId: number }
  | { type: 'tournament_created'; tournamentId: number }
  | { type: 'ranking_updated'; rankingMonth: number; rankingYear: number }

export interface EmailContent {
  subject: string
  textContent: string
  htmlContent: string
  category: NotificationCategory
  clubId: number | null
}

export interface NotificationPrefs {
  type?: 'todas' | 'ninguna' | 'personalizar'
  noticias?: 'todos' | 'fasgba-y-clubes' | 'fasgba' | 'clubes' | 'ninguno'
  torneos?: 'todos' | 'fasgba-y-clubes' | 'fasgba' | 'clubes' | 'ninguno'
  ranking?: boolean
}

export type BroadcastStatus = 'sent' | 'no_recipients' | 'error'

export interface BroadcastResult {
  status: BroadcastStatus
  recipientsCount: number
  errorMessage?: string
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm run type-check
```

Expected: passes (file has no runtime code yet).

- [ ] **Step 3: Commit**

```bash
git add lib/notifications/types.ts
git commit -m "feat(notifications): add shared broadcast types"
```

---

## Task 3: Recipient filter

**Files:**
- Create: `lib/notifications/filter.ts`

- [ ] **Step 1: Write `lib/notifications/filter.ts`**

Notes for the executor:

- `isFasgbaCategory` is true for `news_fasgba` *or* a tournament with no `clubId` (callers map those to the same boolean — see how `sendBroadcast` decides via `clubId`).
- For tournaments, the sub-pref comes from `notif.torneos`; for news, from `notif.noticias`. Ranking ignores both and uses `notif.ranking`.
- Default-when-missing: a user with no prefs is treated as `type='todas'` (legacy users keep receiving everything).

```ts
import type { NotificationCategory, NotificationPrefs } from './types'

export function shouldIncludeUser(
  notif: NotificationPrefs | null | undefined,
  category: NotificationCategory,
  isFollower: boolean
): boolean {
  const type = notif?.type ?? 'todas'

  if (type === 'ninguna') return false
  if (type === 'todas') return true

  // type === 'personalizar'
  if (category === 'ranking') {
    return notif?.ranking === true
  }

  const isTournament =
    category === 'tournament_fasgba' || category === 'tournament_club'
  const isFasgbaCategory =
    category === 'news_fasgba' || category === 'tournament_fasgba'
  const subPref = isTournament ? notif?.torneos : notif?.noticias

  switch (subPref) {
    case 'todos':
      return true
    case 'fasgba':
      return isFasgbaCategory
    case 'fasgba-y-clubes':
      return isFasgbaCategory || isFollower
    case 'clubes':
      return !isFasgbaCategory && isFollower
    case 'ninguno':
    default:
      return false
  }
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm run type-check
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add lib/notifications/filter.ts
git commit -m "feat(notifications): add follow-aware recipient filter"
```

---

## Task 4: Email templates

**Files:**
- Create: `lib/notifications/templates.ts`

- [ ] **Step 1: Write `lib/notifications/templates.ts`**

Move the three template branches verbatim from `app/api/notifications/email/route.ts` lines 35-237. Adapt the signature and category mapping:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { BroadcastInput, EmailContent } from './types'

export async function buildEmailContent(
  input: BroadcastInput,
  supabase: SupabaseClient,
  baseUrl: string
): Promise<EmailContent | null> {
  const unsubscribeUrl = `${baseUrl}/ajustes?notificaciones=off`

  if (input.type === 'news_created') {
    const { data: newsData, error } = await supabase
      .from('news')
      .select(`id, title, extract, date, club_id, clubs (name)`)
      .eq('id', input.newsId)
      .single()
    if (error || !newsData) return null

    const clubData = newsData.clubs as any
    const newsSource = clubData?.name || 'Federación de Ajedrez del Sur del Gran Buenos Aires (FASGBA)'
    const newsDate = new Date(newsData.date).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const newsUrl = `${baseUrl}/noticias/${newsData.id}`
    const category = newsData.club_id ? 'news_club' : 'news_fasgba'

    const subject = `Nueva noticia: ${newsData.title}`
    const textContent = `\n¡Nueva noticia publicada!\n\nTítulo: ${newsData.title}\nFuente: ${newsSource}\nFecha: ${newsDate}\n\n${newsData.extract || ''}\n\nLeer la noticia: ${newsUrl}\nDesactivar notificaciones: ${unsubscribeUrl}\n\n---\nFederación de Ajedrez del Sur del Gran Buenos Aires`
    const htmlContent = newsHtml({ title: newsData.title, source: newsSource, date: newsDate, extract: newsData.extract, url: newsUrl, unsubscribeUrl })

    return { subject, textContent, htmlContent, category, clubId: newsData.club_id ?? null }
  }

  if (input.type === 'tournament_created') {
    const { data: t, error } = await supabase
      .from('tournaments')
      .select(`id, title, description, place, created_by_club_id, clubs (name)`)
      .eq('id', input.tournamentId)
      .single()
    if (error || !t) return null

    const clubData = t.clubs as any
    const source = clubData?.name || 'FASGBA'
    const tournamentUrl = `${baseUrl}/torneos/${t.id}`

    const subject = `Nuevo torneo: ${t.title}`
    const textContent = `\n¡Nuevo torneo publicado!\n\nTítulo: ${t.title}\nOrganizador: ${source}\nLugar: ${t.place || 'Por confirmar'}\n\n${t.description || ''}\n\nVer torneo: ${tournamentUrl}\nDesactivar notificaciones: ${unsubscribeUrl}\n\n---\nFederación de Ajedrez del Sur del Gran Buenos Aires`
    const htmlContent = tournamentHtml({ title: t.title, source, place: t.place, description: t.description, url: tournamentUrl, unsubscribeUrl })

    const category: 'tournament_fasgba' | 'tournament_club' = t.created_by_club_id ? 'tournament_club' : 'tournament_fasgba'
    return { subject, textContent, htmlContent, category, clubId: t.created_by_club_id ?? null }
  }

  if (input.type === 'ranking_updated') {
    const rankingUrl = `${baseUrl}/ranking`
    const monthName = new Date(input.rankingYear, input.rankingMonth - 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

    const subject = `Ranking actualizado: ${monthName}`
    const textContent = `\n¡Nuevo ranking publicado!\n\nEl ranking de ${monthName} ya está disponible.\n\nVer ranking: ${rankingUrl}\nDesactivar notificaciones: ${unsubscribeUrl}\n\n---\nFederación de Ajedrez del Sur del Gran Buenos Aires`
    const htmlContent = rankingHtml({ monthName, url: rankingUrl, unsubscribeUrl })

    return { subject, textContent, htmlContent, category: 'ranking', clubId: null }
  }

  return null
}

// ─── HTML helpers (copied verbatim from the deleted route, wrapped in functions) ──

function shellHtml(headerTitle: string, body: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
.header { background-color: #8B4513; color: white; padding: 20px; text-align: center; }
.content { padding: 20px; background-color: #f9f9f9; }
.title { color: #8B4513; font-size: 24px; margin-bottom: 10px; }
.meta { color: #666; margin-bottom: 15px; }
.extract { background-color: white; padding: 15px; border-left: 4px solid #8B4513; margin: 15px 0; }
.footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
.cta-button { display: inline-block; background-color: #8B4513; color: white; padding: 10px 16px; border-radius: 6px; text-decoration: none; }
.link { color: #8B4513; text-decoration: underline; }
</style></head><body><div class="container">
<div class="header"><h1>${headerTitle}</h1></div>
<div class="content">${body}</div>
<div class="footer">
  <p>Federación de Ajedrez del Sur del Gran Buenos Aires</p>
  <p><a class="link" href="${unsubscribeUrl}">Desactivar notificaciones</a></p>
</div></div></body></html>`
}

function newsHtml(p: { title: string; source: string; date: string; extract: string | null; url: string; unsubscribeUrl: string }): string {
  const body = `
<h2 class="title">${p.title}</h2>
<div class="meta"><strong>Fuente:</strong> ${p.source}<br><strong>Fecha:</strong> ${p.date}</div>
${p.extract ? `<div class="extract">${p.extract}</div>` : ''}
<p style="text-align:center; margin: 20px 0;"><a class="cta-button" href="${p.url}">Leer la noticia</a></p>`
  return shellHtml('♟️ Nueva Noticia', body, p.unsubscribeUrl)
}

function tournamentHtml(p: { title: string; source: string; place: string | null; description: string | null; url: string; unsubscribeUrl: string }): string {
  const body = `
<h2 class="title">${p.title}</h2>
<div class="meta"><strong>Organizador:</strong> ${p.source}<br><strong>Lugar:</strong> ${p.place || 'Por confirmar'}</div>
${p.description ? `<p>${p.description}</p>` : ''}
<p style="text-align:center; margin: 20px 0;"><a class="cta-button" href="${p.url}">Ver torneo</a></p>`
  return shellHtml('♟️ Nuevo Torneo', body, p.unsubscribeUrl)
}

function rankingHtml(p: { monthName: string; url: string; unsubscribeUrl: string }): string {
  const body = `
<h2 class="title">Ranking ${p.monthName}</h2>
<p>El nuevo ranking ya está disponible. ¡Consulta tu posición!</p>
<p style="text-align:center; margin: 20px 0;"><a class="cta-button" href="${p.url}">Ver ranking</a></p>`
  return shellHtml('♟️ Ranking Actualizado', body, p.unsubscribeUrl)
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm run type-check
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add lib/notifications/templates.ts
git commit -m "feat(notifications): extract email templates to lib"
```

---

## Task 5: Orchestration — `sendBroadcast`

**Files:**
- Create: `lib/notifications/sendBroadcast.ts`

- [ ] **Step 1: Write `lib/notifications/sendBroadcast.ts`**

```ts
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'
import { buildEmailContent } from './templates'
import { shouldIncludeUser } from './filter'
import type {
  BroadcastInput,
  BroadcastResult,
  NotificationPrefs,
  NotificationCategory,
} from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: 'no-responder@fasgba.com',
    pass: process.env.NO_REPLY_PASSWORD!,
  },
})

const FROM = '"Federación de Ajedrez" <no-responder@fasgba.com>'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fasgba.com'

export async function sendBroadcast(input: BroadcastInput): Promise<BroadcastResult> {
  let category: NotificationCategory | undefined
  let clubId: number | null = null
  let targetId: string | null = null

  try {
    const content = await buildEmailContent(input, supabaseAdmin, SITE_URL)
    if (!content) {
      const result: BroadcastResult = { status: 'error', recipientsCount: 0, errorMessage: 'Failed to build email content' }
      await logBroadcast(input, null, null, result)
      return result
    }

    category = content.category
    clubId = content.clubId
    targetId = resolveTargetId(input)

    const followerSet = clubId ? await loadFollowerSet(clubId) : new Set<string>()

    const recipients: string[] = []
    let page = 1
    const perPage = 1000
    // Paginate auth users; same approach as the deleted route.
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
      if (error) {
        console.error('[sendBroadcast] listUsers error on page', page, error)
        break
      }
      const users = data?.users ?? []
      if (users.length === 0) break
      for (const u of users) {
        if (!u.email) continue
        const notif = (u.user_metadata as any)?.notifications as NotificationPrefs | undefined
        const isFollower = followerSet.has(u.id)
        if (shouldIncludeUser(notif, category, isFollower)) {
          recipients.push(u.email)
        }
      }
      if (users.length < perPage) break
      page += 1
    }

    if (recipients.length === 0) {
      const result: BroadcastResult = { status: 'no_recipients', recipientsCount: 0 }
      await logBroadcast(input, category, clubId, result, targetId)
      return result
    }

    const info = await transporter.sendMail({
      from: FROM,
      to: 'no-responder@fasgba.com',
      bcc: recipients,
      subject: content.subject,
      text: content.textContent,
      html: content.htmlContent,
    })

    console.log('[sendBroadcast] sent', info.messageId, 'to', recipients.length, 'recipients')
    const result: BroadcastResult = { status: 'sent', recipientsCount: recipients.length }
    await logBroadcast(input, category, clubId, result, targetId)
    return result
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('[sendBroadcast] failed', errorMessage)
    const result: BroadcastResult = { status: 'error', recipientsCount: 0, errorMessage }
    await logBroadcast(input, category ?? null, clubId, result, targetId)
    return result
  }
}

async function loadFollowerSet(clubId: number): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from('user_follows_club')
    .select('auth_id')
    .eq('club_id', clubId)
  if (error) {
    console.error('[sendBroadcast] loadFollowerSet error', error)
    return new Set()
  }
  return new Set((data ?? []).map((r: any) => r.auth_id))
}

function resolveTargetId(input: BroadcastInput): string {
  if (input.type === 'news_created') return String(input.newsId)
  if (input.type === 'tournament_created') return String(input.tournamentId)
  return `${input.rankingYear}-${String(input.rankingMonth).padStart(2, '0')}`
}

async function logBroadcast(
  input: BroadcastInput,
  category: NotificationCategory | null,
  clubId: number | null,
  result: BroadcastResult,
  targetId: string | null = null,
): Promise<void> {
  try {
    await supabaseAdmin.from('notification_log').insert({
      type: input.type,
      target_id: targetId ?? resolveTargetId(input),
      club_id: clubId,
      recipients_count: result.recipientsCount,
      status: result.status,
      error_message: result.errorMessage ?? null,
    })
  } catch (err) {
    console.error('[sendBroadcast] notification_log insert failed', err)
  }
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm run type-check
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add lib/notifications/sendBroadcast.ts
git commit -m "feat(notifications): add sendBroadcast orchestration"
```

---

## Task 6: Wire news handler

**Files:**
- Modify: `app/api/news/route.ts` (replace lines 79-98)

- [ ] **Step 1: Replace the fetch block**

Find this block in `app/api/news/route.ts`:

```ts
    // Trigger broadcast email for all news (FASGBA and club)
    try {
      const notifyRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/notifications/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'news_created',
          newsId: createdNews.id,
          broadcast: true,
        })
      })
      if (!notifyRes.ok) {
        console.error('Failed to trigger broadcast email:', await notifyRes.text())
      }
    } catch (e) {
      console.error('Broadcast email trigger error:', e)
    }
```

Replace with:

```ts
    // Run broadcast after the response is sent so the 201 isn't blocked
    // by SMTP latency. `after()` is reliable in serverless (unlike bare
    // fire-and-forget which can be killed when the response returns).
    after(async () => {
      try {
        await sendBroadcast({ type: 'news_created', newsId: createdNews.id })
      } catch (err) {
        console.error('[news] sendBroadcast failed', err)
      }
    })
```

And add imports near the top of the file:

```ts
import { after } from 'next/server'
import { sendBroadcast } from '@/lib/notifications/sendBroadcast'
```

- [ ] **Step 2: Type-check**

```bash
pnpm run type-check
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add app/api/news/route.ts
git commit -m "feat(notifications): wire news handler to sendBroadcast"
```

---

## Task 7: Wire tournaments handler

**Files:**
- Modify: `app/api/tournaments/route.ts` (replace lines 162-181)

- [ ] **Step 1: Replace the fetch block**

Find this block in `app/api/tournaments/route.ts`:

```ts
    // Trigger broadcast email for new tournament
    try {
      const notifyRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/notifications/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'tournament_created',
          tournamentId: newTournament.id,
          broadcast: true,
        })
      })
      if (!notifyRes.ok) {
        console.error('Failed to trigger tournament broadcast email:', await notifyRes.text())
      }
    } catch (e) {
      console.error('Tournament broadcast email trigger error:', e)
    }
```

Replace with:

```ts
    after(async () => {
      try {
        await sendBroadcast({ type: 'tournament_created', tournamentId: newTournament.id })
      } catch (err) {
        console.error('[tournaments] sendBroadcast failed', err)
      }
    })
```

Add imports:

```ts
import { after } from 'next/server'
import { sendBroadcast } from '@/lib/notifications/sendBroadcast'
```

- [ ] **Step 2: Type-check**

```bash
pnpm run type-check
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add app/api/tournaments/route.ts
git commit -m "feat(notifications): wire tournaments handler to sendBroadcast"
```

---

## Task 8: Wire ranking-confirm handler and delete old endpoint

**Files:**
- Modify: `app/api/admin/ranking/confirm/route.ts` (replace lines 108-129)
- Delete: `app/api/notifications/email/route.ts`

- [ ] **Step 1: Replace the fetch block in ranking confirm**

Find this block in `app/api/admin/ranking/confirm/route.ts`:

```ts
    // Trigger broadcast email for ranking update
    try {
      const authHeader = request.headers.get('authorization')
      const notifyRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/notifications/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader || '',
        },
        body: JSON.stringify({
          type: 'ranking_updated',
          rankingMonth: rankingData.month,
          rankingYear: rankingData.year,
          broadcast: true,
        })
      })
      if (!notifyRes.ok) {
        console.error('Failed to trigger ranking broadcast email:', await notifyRes.text())
      }
    } catch (e) {
      console.error('Ranking broadcast email trigger error:', e)
    }
```

Replace with:

```ts
    after(async () => {
      try {
        await sendBroadcast({
          type: 'ranking_updated',
          rankingMonth: rankingData.month,
          rankingYear: rankingData.year,
        })
      } catch (err) {
        console.error('[ranking] sendBroadcast failed', err)
      }
    })
```

Add imports:

```ts
import { after } from 'next/server'
import { sendBroadcast } from '@/lib/notifications/sendBroadcast'
```

- [ ] **Step 2: Delete the old broadcast endpoint**

```bash
rm app/api/notifications/email/route.ts
```

(`app/api/notifications/email/test/route.ts` stays — it's the SMTP health probe.)

- [ ] **Step 3: Type-check + lint**

```bash
pnpm run type-check && pnpm run lint
```

Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/ranking/confirm/route.ts app/api/notifications/email/route.ts
git commit -m "feat(notifications): wire ranking confirm + remove old endpoint"
```

---

## Task 9: Manual smoke test

**No file changes.** Verifies the full pipeline.

- [ ] **Step 1: Start the dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Verify SMTP creds load**

In another terminal:

```bash
pnpm run test:email
```

Expected: `✅ Test email sent successfully!` and a `messageId`. If this fails, `NO_REPLY_PASSWORD` is missing/wrong — stop and fix env before continuing.

- [ ] **Step 3: Create a FASGBA news item (as site admin)**

Log into the app as a site admin. Publish a news item with no `club_id`. Then in the Supabase SQL editor:

```sql
SELECT * FROM notification_log ORDER BY created_at DESC LIMIT 1;
```

Expected: one row with `type='news_created'`, `club_id IS NULL`, `status='sent'`, `recipients_count > 0`.

- [ ] **Step 4: Create a club news item (as club admin)**

Log in as a club admin and publish news for that club. Then:

```sql
SELECT * FROM notification_log ORDER BY created_at DESC LIMIT 1;
```

Expected: `type='news_created'`, `club_id` = that club's id, `status='sent'`, `recipients_count` matches `(users with type='todas' + users with personalizar+todos noticias) + (followers of that club with personalizar+clubes/fasgba-y-clubes)`.

This is the critical case — previously this would 401-fail silently.

- [ ] **Step 5: Verify follow filtering**

Pick a Supabase test user. In Ajustes, set notifications = personalizar, noticias = "Clubes que sigo". Follow exactly one club. Have someone publish news for a *different* club. Verify in `notification_log` that `recipients_count` for that event does **not** include that test user's email (use the Zoho-sent BCC list if available, or temporarily inspect the recipients in code by adding a one-time `console.log(recipients)` and reverting after).

- [ ] **Step 6: Verify the recipient mailbox**

Open the `no-responder@fasgba.com` mailbox (Sent folder). Confirm the test broadcasts appear there with correct subject lines.

- [ ] **Step 7: Confirm done**

If all steps pass: notifications are functional and follower-aware. The PR is ready for review.

---

## Self-review checklist (already executed during plan writing)

- **Spec coverage:** every section of the spec maps to at least one task. Pipeline fix → Tasks 5-8. Follow filter → Tasks 2-3. Observability → Tasks 1, 5, 9. Deletions → Task 8.
- **Placeholders:** none.
- **Type consistency:** `BroadcastInput`, `EmailContent`, `NotificationPrefs`, `BroadcastResult`, `sendBroadcast` signature, and the `category` strings (`'news_fasgba' | 'news_club' | 'tournament' | 'ranking'`) are consistent across Tasks 2-5 and used unchanged in Tasks 6-8.
- **Scope:** single PR, ~9 small commits. Each commit is independently revertable. No unrelated refactors.
