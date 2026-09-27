-- Permite eliminar empresas desde el CRM y mantiene updated_at al día.
-- Personas y oportunidades vinculadas quedan con empresa_id = null (on delete set null).

create policy "Anyone can delete companies"
  on public.empresas
  for delete
  to anon, authenticated
  using (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists empresas_set_updated_at on public.empresas;
create trigger empresas_set_updated_at
  before update on public.empresas
  for each row
  execute function public.set_updated_at();
