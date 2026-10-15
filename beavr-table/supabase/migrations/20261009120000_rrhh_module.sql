-- RRHH: campos HR en personas + tablas de gestión interna + storage

alter table public.personas
  add column if not exists foto_url text,
  add column if not exists estado_laboral text not null default 'activo',
  add column if not exists fecha_alta date;

alter table public.personas
  drop constraint if exists personas_estado_laboral_check;

alter table public.personas
  add constraint personas_estado_laboral_check
  check (estado_laboral in ('activo', 'baja'));

create table if not exists public.rrhh_fichajes (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  entrada_en timestamptz not null default now(),
  salida_en timestamptz,
  notas text,
  created_at timestamptz not null default now()
);

create index if not exists rrhh_fichajes_persona_idx on public.rrhh_fichajes (persona_id, entrada_en desc);

create table if not exists public.rrhh_vacaciones (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  fecha_inicio date not null,
  fecha_fin date not null,
  estado text not null default 'pendiente',
  motivo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rrhh_vacaciones_estado_check check (estado in ('pendiente', 'aprobada', 'rechazada')),
  constraint rrhh_vacaciones_rango_check check (fecha_fin >= fecha_inicio)
);

create index if not exists rrhh_vacaciones_persona_idx on public.rrhh_vacaciones (persona_id, fecha_inicio desc);

create table if not exists public.rrhh_onboarding (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  titulo text not null,
  completado boolean not null default false,
  completado_en timestamptz,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists rrhh_onboarding_persona_idx on public.rrhh_onboarding (persona_id, orden);

create table if not exists public.rrhh_admisiones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text,
  telefono text,
  puesto text,
  cv_url text,
  estado text not null default 'en_proceso',
  notas text,
  persona_id uuid references public.personas(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rrhh_admisiones_estado_check check (estado in ('en_proceso', 'contratado', 'descartado'))
);

create index if not exists rrhh_admisiones_estado_idx on public.rrhh_admisiones (estado, created_at desc);

create table if not exists public.rrhh_evaluaciones (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  periodo text not null,
  nota int not null,
  comentario text,
  evaluador text,
  created_at timestamptz not null default now(),
  constraint rrhh_evaluaciones_nota_check check (nota between 1 and 5)
);

create index if not exists rrhh_evaluaciones_persona_idx on public.rrhh_evaluaciones (persona_id, created_at desc);

create table if not exists public.rrhh_nominas (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  periodo text not null,
  archivo_url text not null,
  archivo_nombre text,
  firmado boolean not null default false,
  firmado_en timestamptz,
  firmado_por text,
  created_at timestamptz not null default now()
);

create index if not exists rrhh_nominas_persona_idx on public.rrhh_nominas (persona_id, created_at desc);

alter table public.rrhh_fichajes enable row level security;
alter table public.rrhh_vacaciones enable row level security;
alter table public.rrhh_onboarding enable row level security;
alter table public.rrhh_admisiones enable row level security;
alter table public.rrhh_evaluaciones enable row level security;
alter table public.rrhh_nominas enable row level security;

drop policy if exists "rrhh_fichajes_all" on public.rrhh_fichajes;
create policy "rrhh_fichajes_all" on public.rrhh_fichajes for all to anon, authenticated using (true) with check (true);

drop policy if exists "rrhh_vacaciones_all" on public.rrhh_vacaciones;
create policy "rrhh_vacaciones_all" on public.rrhh_vacaciones for all to anon, authenticated using (true) with check (true);

drop policy if exists "rrhh_onboarding_all" on public.rrhh_onboarding;
create policy "rrhh_onboarding_all" on public.rrhh_onboarding for all to anon, authenticated using (true) with check (true);

drop policy if exists "rrhh_admisiones_all" on public.rrhh_admisiones;
create policy "rrhh_admisiones_all" on public.rrhh_admisiones for all to anon, authenticated using (true) with check (true);

drop policy if exists "rrhh_evaluaciones_all" on public.rrhh_evaluaciones;
create policy "rrhh_evaluaciones_all" on public.rrhh_evaluaciones for all to anon, authenticated using (true) with check (true);

drop policy if exists "rrhh_nominas_all" on public.rrhh_nominas;
create policy "rrhh_nominas_all" on public.rrhh_nominas for all to anon, authenticated using (true) with check (true);

drop trigger if exists rrhh_vacaciones_set_updated_at on public.rrhh_vacaciones;
create trigger rrhh_vacaciones_set_updated_at
  before update on public.rrhh_vacaciones
  for each row execute function public.set_updated_at();

drop trigger if exists rrhh_admisiones_set_updated_at on public.rrhh_admisiones;
create trigger rrhh_admisiones_set_updated_at
  before update on public.rrhh_admisiones
  for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rrhh-archivos',
  'rrhh-archivos',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "rrhh_archivos_select" on storage.objects;
create policy "rrhh_archivos_select" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'rrhh-archivos');

drop policy if exists "rrhh_archivos_insert" on storage.objects;
create policy "rrhh_archivos_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'rrhh-archivos');

drop policy if exists "rrhh_archivos_update" on storage.objects;
create policy "rrhh_archivos_update" on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'rrhh-archivos')
  with check (bucket_id = 'rrhh-archivos');

drop policy if exists "rrhh_archivos_delete" on storage.objects;
create policy "rrhh_archivos_delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'rrhh-archivos');
