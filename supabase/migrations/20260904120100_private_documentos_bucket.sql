-- Make the documentos bucket private (downloads use signed URLs from the API)
-- and gate direct object reads on the owning documentos row, so the storage
-- backstop follows the table's category even after an admin re-categorises.

begin;

update storage.buckets set public = false where id = 'documentos';

do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and cmd = 'SELECT'
      and (qual ilike '%documentos%' or policyname ilike '%documentos%')
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

create policy "documentos_select_policy" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'documentos'
    and exists (
      select 1
      from public.documentos d
      where d.file_path = storage.objects.name
        and public.can_view_documento(d.category, auth.uid())
    )
  );

commit;
