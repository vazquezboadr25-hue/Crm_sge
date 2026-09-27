-- NIF opcional en empresas y gestión completa de personas (empleados) desde el CRM.
-- Las oportunidades vinculadas a una persona eliminada quedan con persona_id = null (on delete set null).

alter table public.empresas add column if not exists nif text;

create policy "Anyone can delete people"
  on public.personas
  for delete
  to anon, authenticated
  using (true);

drop trigger if exists personas_set_updated_at on public.personas;
create trigger personas_set_updated_at
  before update on public.personas
  for each row
  execute function public.set_updated_at();
