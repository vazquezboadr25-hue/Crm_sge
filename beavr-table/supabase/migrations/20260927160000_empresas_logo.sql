-- Logo de empresa: columna logo_url + bucket público "logos-empresas".

alter table public.empresas add column if not exists logo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos-empresas',
  'logos-empresas',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- El CRM no usa autenticación: mismo criterio que las tablas (acceso anon).
drop policy if exists "logos_empresas_select" on storage.objects;
create policy "logos_empresas_select" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'logos-empresas');

drop policy if exists "logos_empresas_insert" on storage.objects;
create policy "logos_empresas_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'logos-empresas');

drop policy if exists "logos_empresas_update" on storage.objects;
create policy "logos_empresas_update" on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'logos-empresas')
  with check (bucket_id = 'logos-empresas');

drop policy if exists "logos_empresas_delete" on storage.objects;
create policy "logos_empresas_delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'logos-empresas');
