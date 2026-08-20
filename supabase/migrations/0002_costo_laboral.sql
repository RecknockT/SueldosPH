-- SueldosPH · datos para las contribuciones a cargo del empleador
--
-- Ley 27.802 / Decreto 407/2026: el recibo debe informar las contribuciones
-- patronales y el costo laboral total por trabajador.
--
-- Sólo se guardan los valores que cambian de un consorcio a otro. El resto de
-- las alícuotas son de ley o de convenio y viven en lib/costo-laboral.ts.
--
-- Ejecutar en Supabase → SQL Editor. Es idempotente.

alter table public.legajos
  add column if not exists art_alicuota numeric not null default 4.71,
  add column if not exists art_monto_fijo numeric not null default 1765,
  add column if not exists seguro_vida numeric not null default 424.62;

comment on column public.legajos.art_alicuota is
  'Porcentaje de la póliza de ART del consorcio.';
comment on column public.legajos.art_monto_fijo is
  'Suma fija mensual por trabajador de la póliza de ART.';
comment on column public.legajos.seguro_vida is
  'Seguro colectivo de vida obligatorio, importe fijo por trabajador.';
