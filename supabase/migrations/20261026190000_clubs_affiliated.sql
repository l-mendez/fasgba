-- Guest clubs (invited to a tournament, not FASGBA members) still need a row so
-- their teams and players can be linked, but are hidden from public listings.

alter table public.clubs add column if not exists affiliated boolean not null default true;

comment on column public.clubs.affiliated is 'False for guest clubs that play FASGBA tournaments but are not members.';
