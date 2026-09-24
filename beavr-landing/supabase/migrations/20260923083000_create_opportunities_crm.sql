-- CRM de oportunidades / leads desde la landing
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  project_type text not null,
  details text not null,
  source text not null default 'landing-beavr',
  stage text not null default 'new',
  created_at timestamptz not null default now()
);

create index opportunities_created_at_idx on public.opportunities (created_at desc);
create index opportunities_stage_idx on public.opportunities (stage);
create index opportunities_email_idx on public.opportunities (email);

alter table public.opportunities enable row level security;

create policy "Anyone can insert opportunities"
  on public.opportunities
  for insert
  to anon, authenticated
  with check (true);

create policy "Authenticated users can read opportunities"
  on public.opportunities
  for select
  to authenticated
  using (true);

create policy "Authenticated users can update opportunities"
  on public.opportunities
  for update
  to authenticated
  using (true)
  with check (true);

comment on table public.opportunities is 'Oportunidades CRM capturadas desde la landing de beavr';
