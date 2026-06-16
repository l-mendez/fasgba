# Email Notification System

Email notifications for news, tournaments, and ranking updates, sent via Zoho SMTP and filtered by each user's notification preferences and club follows.

## Architecture

All broadcasts go through a single library module called from each content-creation handler:

```
lib/notifications/
  types.ts          Shared types (BroadcastInput, NotificationCategory, NotificationPrefs, ...)
  filter.ts         shouldIncludeUser() — follow-aware recipient filter
  templates.ts      buildEmailContent() — three HTML/text templates
  sendBroadcast.ts  Orchestration: build → load followers → paginate users → filter → SMTP → log
```

Call sites:

- `app/api/news/route.ts` → `after(() => sendBroadcast({ type: 'news_created', newsId }))`
- `app/api/tournaments/route.ts` → `after(() => sendBroadcast({ type: 'tournament_created', tournamentId }))`
- `app/api/admin/ranking/confirm/route.ts` → `after(() => sendBroadcast({ type: 'ranking_updated', rankingMonth, rankingYear }))`

`after()` (Next.js post-response continuation) runs the broadcast after the 201 is sent so SMTP latency never blocks the client.

## SMTP

Zoho, hardcoded in `lib/notifications/sendBroadcast.ts`:

```ts
host: 'smtp.zoho.com', port: 465, secure: true
user: 'no-responder@fasgba.com'
pass: process.env.NO_REPLY_PASSWORD
```

Mails are sent `from no-responder@fasgba.com` to itself with all real recipients in BCC (one SMTP transaction per broadcast).

## Recipient filter

`shouldIncludeUser(notif, category, isFollower)` (see `lib/notifications/filter.ts`) implements:

| `notif.type` | FASGBA news / FASGBA tournament | Club news / club tournament | Ranking |
|---|---|---|---|
| missing | yes | yes | yes |
| `todas` | yes | yes | yes |
| `ninguna` | no | no | no |
| `personalizar`, sub-pref `todos` | yes | yes | `notif.ranking` |
| `personalizar`, sub-pref `fasgba` | yes | no | `notif.ranking` |
| `personalizar`, sub-pref `fasgba-y-clubes` | yes | yes if follower | `notif.ranking` |
| `personalizar`, sub-pref `clubes` | no | yes if follower | `notif.ranking` |
| `personalizar`, sub-pref `ninguno` | no | no | `notif.ranking` |

Sub-pref comes from `notif.noticias` for news, `notif.torneos` for tournaments. Followers come from the `user_follows_club` table, loaded once per broadcast.

## Observability

Every `sendBroadcast` invocation writes one row to `notification_log`:

```sql
SELECT created_at, type, target_id, club_id, status, recipients_count, error_message
FROM notification_log
ORDER BY created_at DESC
LIMIT 20;
```

`status` is `sent`, `no_recipients`, or `error`. SMTP failures and `loadFollowerSet` failures both surface here.

## Endpoints

- `POST /api/notifications/email/test` — SMTP health probe. Sends a single test mail to confirm credentials work. Used by `scripts/test-email.js` (`pnpm run test:email`).

The old broadcast endpoint (`POST /api/notifications/email`) was removed once all callers switched to the in-process library.

## Setup

```env
NO_REPLY_PASSWORD=<zoho app password for no-responder@fasgba.com>
NEXT_PUBLIC_SITE_URL=<production origin, used only to build absolute URLs in email bodies>
```

`NO_REPLY_PASSWORD` is required — if missing, SMTP auth fails and every broadcast is logged as `status='error'`.

## Troubleshooting

1. **No emails fire.** Check `notification_log` first — there should be a row per news/tournament/ranking action. No rows → `sendBroadcast` never ran (check server logs for `[sendBroadcast] failed`). Rows with `status='error'` → see `error_message`. Rows with `status='no_recipients'` → preference filter excluded everyone.
2. **Followers not getting club news.** Confirm the user's `user_metadata.notifications.noticias` (or `torneos`) is set to `clubes` or `fasgba-y-clubes`, and they have a row in `user_follows_club` for that club.
3. **SMTP auth fails.** Run `pnpm run test:email`. If it fails, rotate the Zoho app password and update `NO_REPLY_PASSWORD`.
