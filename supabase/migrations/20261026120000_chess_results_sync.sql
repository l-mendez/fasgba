-- Chess-results.com sync: link tournaments to their chess-results id and keep
-- a queue of discovered chess-results tournaments for admin approval.

begin;

alter table public.tournaments
  add column if not exists chess_results_tnr integer unique check (chess_results_tnr > 0),
  add column if not exists chess_results_synced_at timestamptz;

-- Tournaments discovered on chess-results by the weekly job. Admins import,
-- link or ignore them. Service-role only (RLS on, no policies), mirroring
-- notification_log: admin API routes check permissions before reading.
create table if not exists public.chess_results_candidates (
  tnr integer primary key check (tnr > 0),
  name text not null,
  start_date date,
  end_date date,
  organizer text,
  place text,
  time_control text,
  rounds integer,
  players integer,
  status text not null default 'pending' check (status in ('pending', 'imported', 'ignored')),
  tournament_id integer references public.tournaments (id) on delete set null,
  suggested_tournament_id integer references public.tournaments (id) on delete set null,
  discovered_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chess_results_candidates_status_start_idx
  on public.chess_results_candidates (status, start_date desc);

alter table public.chess_results_candidates enable row level security;

commit;
