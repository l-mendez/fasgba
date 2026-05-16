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
  // Throw on error so the outer catch logs status='error' to notification_log.
  // Swallowing here would hide under-delivery to club followers.
  if (error) throw new Error(`loadFollowerSet failed for club ${clubId}: ${error.message}`)
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
