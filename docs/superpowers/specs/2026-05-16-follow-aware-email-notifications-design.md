# Follow-aware email notifications

**Date:** 2026-05-16
**Status:** Approved (design)
**Scope:** bundled — fix the silent-failure broadcast pipeline AND make club follows actually drive who receives club news/tournament emails.

## Problem

Two intertwined problems make the current notifications system non-functional:

1. **Silent pipeline failure.** News/tournament/ranking handlers fire a server-to-server `fetch()` to `/api/notifications/email`. The endpoint requires the *requester* to be a site admin (`app/api/notifications/email/route.ts:293-303`). Any content created by a club admin (most club news, club tournaments) triggers a 401 that callers swallow with `console.error`. The fetch also depends on `NEXT_PUBLIC_SITE_URL`; if missing it falls back to a relative URL that Node's server-side `fetch` rejects. All failure modes are invisible — the handler still returns 201 and the user sees success.
2. **Follow relationship is ignored.** The settings UI offers preference values *"FASGBA y Clubes que sigo"* and *"Clubes que sigo"* (`components/settings-form.tsx:232-234, 248-250`). The backend filter (`shouldIncludeUser`, route.ts:240-266) does not consult the `user_follows_club` table at all — it treats those values as "all clubs". The UI lies.

## Goals

- Email notifications actually leave the server for every `news_created`, `tournament_created`, and `ranking_updated` event.
- Recipients for club-scoped content (news with `club_id`, tournament with `created_by_club_id`) are filtered by their follow relationship when their preference says so.
- Failures are visible and queryable, not lost to `console.error`.

## Non-goals

- In-app notifications, bell icon, push channels.
- New preference values or settings-form UI changes. The existing UI labels become accurate; no copy changes needed.
- Backfilling `user_metadata.notifications` for legacy users.
- Reworking the ranking trigger flow (already wired at `app/api/admin/ranking/confirm/route.ts:111`).

## Design

### Architecture

Replace the HTTP round-trip with a direct library call.

```
lib/notifications/sendBroadcast.ts        (NEW)
  └─ sendBroadcast({ type, newsId? , tournamentId? , rankingMonth? , rankingYear? })
        ├─ buildEmailContent()           — templates moved verbatim from the deleted route
        ├─ loadFollowerAuthIds(clubId)   — single query when clubId is set
        ├─ paginate supabase.auth.admin.listUsers()
        ├─ shouldIncludeUser(notif, category, clubId, isFollower)
        ├─ transporter.sendMail(...)
        └─ persistNotificationLog(...)

app/api/news/route.ts                      → await sendBroadcast(...) inside the existing try/catch
app/api/tournaments/route.ts               → same
app/api/admin/ranking/confirm/route.ts     → same
app/api/notifications/email/route.ts       → DELETED (no callers remain)
app/api/notifications/email/test/route.ts  → KEPT (SMTP health probe)
```

`sendBroadcast` swallows its own errors after logging to the new `notification_log` table; callers do `await sendBroadcast(...).catch(err => console.error(err))` so a broadcast failure never blocks the 201 to the user.

### Recipient filter

The new `shouldIncludeUser(notif, category, clubId, isFollower)` returns the truth table below. `isFollower` is `false` when `clubId` is null (FASGBA content). The sub-pref column comes from `notif.noticias` for news categories and `notif.torneos` for tournament categories.

| `notif.type` | `news_fasgba` / FASGBA tournament | `news_club` / club tournament | `ranking` |
|---|---|---|---|
| missing | yes | yes | yes |
| `todas` | yes | yes | yes |
| `ninguna` | no | no | no |
| `personalizar`, sub-pref = `todos` | yes | yes | based on `notif.ranking` |
| `personalizar`, sub-pref = `fasgba` | yes | no | based on `notif.ranking` |
| `personalizar`, sub-pref = `fasgba-y-clubes` | yes | yes **only if `isFollower`** | based on `notif.ranking` |
| `personalizar`, sub-pref = `clubes` | no | yes **only if `isFollower`** | based on `notif.ranking` |
| `personalizar`, sub-pref = `ninguno` | no | no | based on `notif.ranking` |

Default-when-no-metadata: missing `notif` is treated as `type: 'todas'` (legacy users keep receiving everything). For ranking under `personalizar`, `notif.ranking` defaults to `false` if absent.

This also fixes the inverted logic in the current tournament branch (route.ts:253-260), which mistakenly maps `fasgba-y-clubes` to FASGBA-only tournaments.

### Follower lookup

When `clubId` is set:

```ts
const { data } = await supabaseAdmin
  .from('user_follows_club')
  .select('auth_id')
  .eq('club_id', clubId)
const followerSet = new Set((data ?? []).map(r => r.auth_id))
```

One query per broadcast. `followerSet.has(user.id)` inside the user-pagination loop is O(1).

### Observability

New table:

```sql
create table notification_log (
  id bigserial primary key,
  type text not null,            -- 'news_created' | 'tournament_created' | 'ranking_updated'
  target_id text,                -- newsId | tournamentId | 'YYYY-MM' for ranking
  club_id integer,
  recipients_count integer not null default 0,
  status text not null,          -- 'sent' | 'no_recipients' | 'error'
  error_message text,
  created_at timestamptz not null default now()
);
```

`sendBroadcast` writes exactly one row per invocation, in all three outcomes (sent, no_recipients, error). No RLS needed — service-role only.

### Data flow

```
POST /api/news (or /api/tournaments, or /api/admin/ranking/confirm)
   │
   ├─ create row in DB                          ← unchanged
   ├─ return 201 to client                      ← happens before email completes
   └─ await sendBroadcast({...}).catch(log)     ← NEW
          │
          ├─ buildEmailContent(supabaseAdmin, body) → { subject, html, text, category, clubId }
          ├─ if (clubId) followerSet = loadFollowerAuthIds(clubId)
          ├─ for each page of auth.admin.listUsers():
          │     for each user u:
          │        if (u.email && shouldIncludeUser(u.user_metadata?.notifications, category, clubId, followerSet.has(u.id)))
          │           recipients.push(u.email)
          ├─ if recipients.length === 0 → log {status: 'no_recipients'}; return
          ├─ try transporter.sendMail({ from, to: from, bcc: recipients, subject, text, html })
          │     on success → log {status: 'sent', recipients_count}
          │     on failure → log {status: 'error', error_message}; rethrow for caller's .catch
          └─ done
```

### Error handling

- Build failure (missing news/tournament row): log `error`, return.
- `listUsers` page error: log error for the page and break the loop; whatever was collected gets sent.
- SMTP failure: caught, logged to `notification_log` with the error message; caller's `.catch` also `console.error`s.
- The content-creation route never fails a 201 because of a broadcast problem.

### Testing

- Unit-test `shouldIncludeUser` for every row of the truth table above (parameterized).
- Unit-test `buildEmailContent` for each of the three types (the templates are unchanged so this is mostly a regression net).
- Manual smoke test: create one FASGBA news, one club news (as club admin), one tournament, confirm a `notification_log` row appears for each with `status='sent'` and a plausible `recipients_count`; verify the no-responder mailbox Sent folder shows the messages.

## Files touched

| Action | Path |
|---|---|
| New | `lib/notifications/sendBroadcast.ts` |
| New | `lib/notifications/types.ts` (request/category types) |
| New | SQL migration for `notification_log` |
| Edit | `app/api/news/route.ts` — swap fetch for `await sendBroadcast(...)` |
| Edit | `app/api/tournaments/route.ts` — same |
| Edit | `app/api/admin/ranking/confirm/route.ts` — same |
| Delete | `app/api/notifications/email/route.ts` |
| Keep | `app/api/notifications/email/test/route.ts` |

Rough budget: ~250 net LOC, most of it the templates moved unchanged.

## Open / deferred

- Whether to also expose `notification_log` in an admin dashboard (deferred — query the table directly for now).
- Whether followers should override a `ninguna` global preference (deferred — current design says no, `ninguna` always wins).
- Whether to switch from BCC to per-recipient sends (deferred — BCC is fine at current volume).
