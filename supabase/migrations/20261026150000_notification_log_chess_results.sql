-- The weekly chess-results cron emails site admins about newly discovered
-- tournaments and logs it in notification_log like the user broadcasts.

begin;

alter table public.notification_log drop constraint if exists notification_log_type_check;
alter table public.notification_log add constraint notification_log_type_check
  check (type in ('news_created', 'tournament_created', 'ranking_updated', 'chess_results_candidates'));

commit;
