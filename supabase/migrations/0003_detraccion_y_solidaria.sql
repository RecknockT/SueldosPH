-- SueldosPH · detracción y contribución solidaria
--
-- Dos valores que faltaban para que las contribuciones patronales cierren
-- contra un recibo real:
--
--   detraccion             art. 4 del Decreto 814/2001. Se resta de la base de
--                          SIPA, INSSJP y asignaciones familiares. Se reduce en
--                          contratos a tiempo parcial, por eso es por legajo.
--   contribucion_solidaria importe fijo del convenio, para los trabajadores que
--                          no aportan cuota sindical.
--
-- Ejecutar en Supabase → SQL Editor. Es idempotente.

alter table public.legajos
  add column if not exists detraccion numeric not null default 7003.68,
  add column if not exists contribucion_solidaria numeric not null default 0;

comment on column public.legajos.detraccion is
  'Detracción del art. 4 Dto. 814/2001 sobre la base de contribuciones nacionales.';
comment on column public.legajos.contribucion_solidaria is
  'Contribución solidaria del convenio, para quienes no aportan cuota sindical.';
