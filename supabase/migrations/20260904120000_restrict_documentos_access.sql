-- Restrict documentos to authorised viewers, at the DB level as backstop for the
-- API checks in app/api/documentos/*:
--   * escuela       -> alumnos and site admins
--   * everything else -> site admins and club admins (delegados)
-- The storage bucket becomes private; downloads go through signed URLs.

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

-- Table: replace the public read policy.
drop policy if exists "documentos_select_policy" on public.documentos;
create policy "documentos_select_policy" on public.documentos
  for select
  to authenticated
  using (public.can_view_documento(category, auth.uid()));

-- Storage: private bucket + read policy keyed on the category folder prefix
-- (uploads are stored as `<category>/<file>`; anything without a known prefix
-- falls back to the delegado/admin rule).
update storage.buckets set public = false where id = 'documentos';

drop policy if exists "documentos_select_policy" on storage.objects;
create policy "documentos_select_policy" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'documentos'
    and public.can_view_documento(split_part(name, '/', 1), auth.uid())
  );

commit;
