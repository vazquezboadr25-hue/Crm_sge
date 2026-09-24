-- Permitir lecturas y cambios desde la app local usando la anon key
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
