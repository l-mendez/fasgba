// Emails site admins when the weekly cron queues new chess-results tournaments
// for review. Reuses the broadcast shell, sender and notification_log.
// Server-only: needs the service-role client (admins table + auth users).

import type { SupabaseClient } from '@supabase/supabase-js'
import { formatArgentinaDateOnly } from '@/lib/dateUtils'
import { FROM, NO_REPLY_ADDRESS, SITE_URL, transporter } from '@/lib/notifications/mailer'
import { escapeHtml, plainText, shellHtml } from '@/lib/notifications/templates'
import { fail } from './db'
import type { NewCandidate } from './discover'
import { chessResultsUrl } from './url'

const MAX_LISTED = 15
const LOG_TYPE = 'chess_results_candidates'
const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }

export type NotifyResult = { sent: number } | { error: string }

function details(c: NewCandidate): string[] {
  return [
    c.startDate ? `Inicio: ${formatArgentinaDateOnly(c.startDate, DATE_FORMAT)}` : '',
    c.suggestedTournamentTitle ? `Coincide con: ${c.suggestedTournamentTitle}` : '',
  ].filter(Boolean)
}

function itemHtml(c: NewCandidate, i: number): string {
  const border = i ? 'border-top:1px solid #f0d9bd;' : ''
  const lines = details(c).map((d) => `<div style="font-size:13px;color:#666;">${escapeHtml(d)}</div>`).join('')
  return `<div style="padding:10px 0;${border}"><a href="${chessResultsUrl(c.tnr)}" style="color:#8f3f12;font-weight:600;text-decoration:none;">${escapeHtml(c.name)}</a>${lines}</div>`
}

export function buildNewCandidatesEmail(candidates: NewCandidate[], siteUrl = SITE_URL) {
  const count = candidates.length
  const noun = count === 1 ? 'torneo nuevo' : 'torneos nuevos'
  const reviewUrl = `${siteUrl}/admin/chess-results`
  const listed = candidates.slice(0, MAX_LISTED)
  const more = count > listed.length ? `y ${count - listed.length} más` : ''
  const lo = count === 1 ? 'lo' : 'los'
  const intro = `La búsqueda semanal ${lo} encontró en chess-results. Importa${lo}, vincula${lo} con un torneo del sitio o ignora${lo}.`

  const textContent = plainText([
    `${count} ${noun} para revisar`,
    intro,
    ...listed.map((c) => [c.name, ...details(c)].join('\n')),
    more,
    `Revisar torneos: ${reviewUrl}`,
  ])
  const htmlContent = shellHtml({
    eyebrow: 'Chess-results',
    heading: `${count} ${noun} para revisar`,
    byline: intro,
    meta: [],
    body: listed.map(itemHtml).join('') +
      (more ? `<div style="padding-top:10px;border-top:1px solid #f0d9bd;color:#888;font-style:italic;">${more}</div>` : ''),
    ctaLabel: 'Revisar torneos',
    ctaUrl: reviewUrl,
  })
  return { subject: `${count} ${noun} en chess-results para revisar`, textContent, htmlContent }
}

/** Confirmed emails of every site admin (`admins` table). */
export async function loadAdminEmails(db: SupabaseClient): Promise<string[]> {
  const { data, error } = await db.from('admins').select('auth_id')
  fail('leer administradores', error)
  const users = await Promise.all((data ?? []).map((a) => db.auth.admin.getUserById(a.auth_id)))
  return [...new Set(users.flatMap(({ data: { user } }) => (user?.email && user.email_confirmed_at ? [user.email] : [])))]
}

/** Sends one email to all site admins. Never throws: failures come back as `{ error }`. */
export async function notifyNewCandidates(db: SupabaseClient, candidates: NewCandidate[]): Promise<NotifyResult> {
  let recipients: string[] = []
  const log = async (status: 'sent' | 'no_recipients' | 'error', errorMessage: string | null = null) => {
    try {
      fail('registrar notificación', (await db.from('notification_log').insert({
        type: LOG_TYPE,
        target_id: candidates.map((c) => c.tnr).join(','),
        club_id: null,
        recipients_count: recipients.length,
        status,
        error_message: errorMessage,
      })).error)
    } catch (err) {
      console.error('[chess-results/notify] notification_log insert failed', err)
    }
  }

  try {
    recipients = await loadAdminEmails(db)
    if (!recipients.length) {
      await log('no_recipients')
      return { sent: 0 }
    }
    const { subject, textContent, htmlContent } = buildNewCandidatesEmail(candidates)
    await transporter.sendMail({ from: FROM, to: NO_REPLY_ADDRESS, bcc: recipients, subject, text: textContent, html: htmlContent })
    await log('sent')
    return { sent: recipients.length }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[chess-results/notify] failed', message)
    await log('error', message)
    return { error: message }
  }
}
