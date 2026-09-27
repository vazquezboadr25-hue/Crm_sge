-- Responsable de comunicación con beavr: un empleado (persona) de la propia empresa.

alter table public.empresas
  add column if not exists responsable_id uuid references public.personas(id) on delete set null;

create index if not exists empresas_responsable_id_idx on public.empresas (responsable_id);

-- El responsable debe pertenecer a la empresa.
create or replace function public.empresas_validar_responsable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.responsable_id is not null and not exists (
    select 1 from public.personas p
    where p.id = new.responsable_id and p.empresa_id = new.id
  ) then
    raise exception 'El responsable debe ser un empleado de la empresa'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists empresas_validar_responsable on public.empresas;
create trigger empresas_validar_responsable
  before insert or update of responsable_id on public.empresas
  for each row execute function public.empresas_validar_responsable();

-- Si el responsable cambia de empresa, deja de ser responsable de la anterior.
create or replace function public.personas_limpiar_responsable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.empresa_id is distinct from old.empresa_id then
    update public.empresas
    set responsable_id = null
    where responsable_id = new.id
      and id is distinct from new.empresa_id;
  end if;
  return new;
end;
$$;

drop trigger if exists personas_limpiar_responsable on public.personas;
create trigger personas_limpiar_responsable
  after update of empresa_id on public.personas
  for each row execute function public.personas_limpiar_responsable();
