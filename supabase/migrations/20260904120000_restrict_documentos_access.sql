-- Restrict documentos rows to authorised viewers (DB backstop for the checks in
-- app/api/documentos/*):
--   * escuela         -> alumnos and site admins
--   * everything else -> site admins and club admins (delegados)

begin;

create or replace function public.can_view_documento(doc_category text, user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_site_admin(user_id)
    or case
      when doc_category = 'escuela' then exists (
        select 1 from public.alumnos where auth_id = user_id
      )
      else public.is_any_club_admin(user_id)
    end;
$$;

revoke all on function public.can_view_documento(text, uuid) from public;
grant execute on function public.can_view_documento(text, uuid) to authenticated;

alter table public.documentos enable row level security;

-- Drop every existing SELECT policy (names were created by hand and may differ
-- from the legacy SQL) before installing the restricted one.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'documentos' and cmd = 'SELECT'
  loop
    execute format('drop policy %I on public.documentos', p.policyname);
  end loop;
end $$;

create policy "documentos_select_policy" on public.documentos
  for select
  to authenticated
  using (public.can_view_documento(category, auth.uid()));

commit;
