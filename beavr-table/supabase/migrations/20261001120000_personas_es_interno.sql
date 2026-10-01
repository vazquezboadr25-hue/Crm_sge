-- Distinguir equipo interno de beavr vs empleados/contactos de clientes
alter table public.personas
  add column if not exists es_interno boolean not null default false;

create index if not exists personas_es_interno_idx
  on public.personas (es_interno);

create or replace function public.personas_validar_interno()
returns trigger
language plpgsql
as $$
begin
  if new.es_interno is true then
    new.empresa_id := null;
  end if;
  return new;
end;
$$;

drop trigger if exists personas_validar_interno on public.personas;
create trigger personas_validar_interno
  before insert or update of es_interno, empresa_id on public.personas
  for each row execute function public.personas_validar_interno();
