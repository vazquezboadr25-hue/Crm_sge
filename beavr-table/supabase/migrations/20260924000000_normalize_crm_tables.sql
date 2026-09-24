-- CRM real: empresas, personas y oportunidades separadas
create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  sitio_web text,
  sector text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text,
  empresa_id uuid references public.empresas(id) on delete set null,
  cargo text,
  telefono text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.oportunidades (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  correo text not null,
  empresa_id uuid references public.empresas(id) on delete set null,
  persona_id uuid references public.personas(id) on delete set null,
  proyecto text not null,
  detalles text not null,
  origen text not null default 'landing-beavr',
  estado text not null default 'nueva',
  creado_en timestamptz not null default now()
);

create index if not exists empresas_nombre_idx
  on public.empresas (lower(nombre));

create index if not exists personas_email_idx
  on public.personas (lower(email))
  where email is not null;

create index if not exists oportunidades_estado_idx
  on public.oportunidades (estado);

create index if not exists oportunidades_creado_en_idx
  on public.oportunidades (creado_en desc);

alter table public.empresas enable row level security;
alter table public.personas enable row level security;
alter table public.oportunidades enable row level security;

create policy "Anyone can insert companies"
  on public.empresas
  for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can read companies"
  on public.empresas
  for select
  to anon, authenticated
  using (true);

create policy "Anyone can update companies"
  on public.empresas
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "Anyone can insert people"
  on public.personas
  for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can read people"
  on public.personas
  for select
  to anon, authenticated
  using (true);

create policy "Anyone can update people"
  on public.personas
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "Anyone can insert opportunities"
  on public.oportunidades
  for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can read opportunities"
  on public.oportunidades
  for select
  to anon, authenticated
  using (true);

create policy "Anyone can update opportunities"
  on public.oportunidades
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- El esquema actual usa solo las tablas public.empresas, public.personas y public.oportunidades.
-- La migración legacy queda descartada para evitar duplicidades.
