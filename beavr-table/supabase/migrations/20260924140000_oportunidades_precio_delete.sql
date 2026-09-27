-- Precio en oportunidades y permiso de borrado desde el CRM.

alter table public.oportunidades
  add column if not exists precio numeric(12, 2);

create policy "Anyone can delete opportunities"
  on public.oportunidades
  for delete
  to anon, authenticated
  using (true);

-- Precios de ejemplo para las negociaciones actuales (solo si estánían a null).
update public.oportunidades set precio = 4500 where proyecto = 'ui-design' and precio is null;
update public.oportunidades set precio = 8200 where proyecto = 'website' and precio is null;
update public.oportunidades set precio = 12000 where proyecto = 'frontend' and precio is null;
update public.oportunidades set precio = 3500 where precio is null;
