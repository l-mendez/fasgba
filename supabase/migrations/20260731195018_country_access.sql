-- Country access allowlist managed from the admin panel, replacing the
-- hardcoded list in proxy.ts. Missing row = blocked. Argentina is locked on.

begin;

-- Allowlist read by the edge proxy with the anon key.
create table if not exists public.country_access (
  country_code text primary key check (country_code ~ '^[A-Z]{2}$'),
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by_email text
);

alter table public.country_access enable row level security;

drop policy if exists "country_access_public_select" on public.country_access;
create policy "country_access_public_select"
  on public.country_access
  for select
  to anon, authenticated
  using (true);

grant select on public.country_access to anon, authenticated;

-- Audit trail. Service-role only (RLS on, no policies), mirroring notification_log.
-- The latest row per country is also the toggle-cooldown source of truth.
create table if not exists public.country_access_log (
  id bigserial primary key,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  action text not null check (action in ('enabled', 'disabled')),
  changed_by_email text,
  created_at timestamptz not null default now()
);

create index if not exists country_access_log_country_created_idx
  on public.country_access_log (country_code, created_at desc);

alter table public.country_access_log enable row level security;

-- Per-country daily request counters. Service-role only for reads.
create table if not exists public.country_traffic_daily (
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  day date not null default current_date,
  allowed_count integer not null default 0,
  blocked_count integer not null default 0,
  primary key (country_code, day)
);

alter table public.country_traffic_daily enable row level security;

-- Argentina can never be disabled or removed, not even by the service role.
create or replace function public.protect_argentina_access()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.country_code = 'AR' then
      raise exception 'Argentina no puede deshabilitarse';
    end if;
    return old;
  end if;

  if new.country_code = 'AR' and new.enabled is not true then
    raise exception 'Argentina no puede deshabilitarse';
  end if;

  if tg_op = 'UPDATE' and old.country_code = 'AR' and new.country_code <> 'AR' then
    raise exception 'Argentina no puede deshabilitarse';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_argentina on public.country_access;
create trigger protect_argentina
  before insert or update or delete on public.country_access
  for each row execute function public.protect_argentina_access();

-- Called fire-and-forget from the edge proxy with the anon key.
create or replace function public.increment_country_traffic(p_country text, p_blocked boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_country is null or p_country !~ '^[A-Z]{2}$' then
    return;
  end if;

  insert into public.country_traffic_daily as t (country_code, day, allowed_count, blocked_count)
  values (
    p_country,
    current_date,
    case when p_blocked then 0 else 1 end,
    case when p_blocked then 1 else 0 end
  )
  on conflict (country_code, day) do update
    set allowed_count = t.allowed_count + excluded.allowed_count,
        blocked_count = t.blocked_count + excluded.blocked_count;
end;
$$;

grant execute on function public.increment_country_traffic(text, boolean) to anon, authenticated;

-- Seed the countries currently hardcoded in proxy.ts.
insert into public.country_access (country_code, enabled)
values ('AR', true), ('BR', true), ('CO', true)
on conflict (country_code) do nothing;

commit;
