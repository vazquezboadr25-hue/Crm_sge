-- Las oportunidades vinculadas a un empleado muestran siempre su nombre y correo actuales.

create or replace function public.personas_sync_oportunidades()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.nombre is distinct from old.nombre or new.email is distinct from old.email then
    update public.oportunidades
    set nombre = new.nombre,
        correo = coalesce(new.email, correo)
    where persona_id = new.id
      and (nombre is distinct from new.nombre or correo is distinct from coalesce(new.email, correo));
  end if;
  return new;
end;
$$;

drop trigger if exists personas_sync_oportunidades on public.personas;
create trigger personas_sync_oportunidades
  after update of nombre, email on public.personas
  for each row execute function public.personas_sync_oportunidades();

-- Al vincular (o re-vincular) una oportunidad a un empleado, copia sus datos actuales.
create or replace function public.oportunidades_sync_desde_persona()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  p record;
begin
  if new.persona_id is not null then
    select nombre, email into p from public.personas where id = new.persona_id;
    if found then
      new.nombre := p.nombre;
      new.correo := coalesce(p.email, new.correo);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists oportunidades_sync_desde_persona on public.oportunidades;
create trigger oportunidades_sync_desde_persona
  before insert or update of persona_id, nombre, correo on public.oportunidades
  for each row execute function public.oportunidades_sync_desde_persona();

-- Backfill de las oportunidades ya desincronizadas.
update public.oportunidades o
set nombre = p.nombre,
    correo = coalesce(p.email, o.correo)
from public.personas p
where p.id = o.persona_id
  and (o.nombre is distinct from p.nombre or o.correo is distinct from coalesce(p.email, o.correo));
