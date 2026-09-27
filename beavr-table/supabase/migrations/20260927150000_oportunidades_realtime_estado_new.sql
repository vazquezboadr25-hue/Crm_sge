-- El CRM trabaja con estados en inglés ('new', 'contacted', ...); alinear el default.
alter table public.oportunidades alter column estado set default 'new';

-- Publicar cambios de oportunidades para que el CRM se actualice en tiempo real.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'oportunidades'
  ) then
    alter publication supabase_realtime add table public.oportunidades;
  end if;
end $$;
