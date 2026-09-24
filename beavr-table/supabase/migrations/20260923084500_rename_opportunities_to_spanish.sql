-- Renombrar tabla y columnas a español
alter table public.opportunities rename to oportunidades;

alter table public.oportunidades rename column name to nombre;
alter table public.oportunidades rename column email to correo;
alter table public.oportunidades rename column company to empresa;
alter table public.oportunidades rename column project_type to proyecto;
alter table public.oportunidades rename column details to detalles;
alter table public.oportunidades rename column source to origen;
alter table public.oportunidades rename column stage to estado;
alter table public.oportunidades rename column created_at to creado_en;

alter index if exists opportunities_created_at_idx rename to oportunidades_creado_en_idx;
alter index if exists opportunities_stage_idx rename to oportunidades_estado_idx;
alter index if exists opportunities_email_idx rename to oportunidades_correo_idx;

comment on table public.oportunidades is 'Oportunidades CRM capturadas desde la landing de beavr';
