-- SueldosPH · horas fijas por legajo
--
-- Las horas que el empleado hace todas las semanas: "4 horas los sábados".
-- Al liquidar se resuelven contra el calendario del período, así que 4 horas
-- los sábados son 16 o 20 según cuántos sábados tenga el mes.
--
-- Cada regla es { id, dia, horas, tramo }, donde dia es 0-6 (domingo a sábado)
-- o "feriados", y tramo es "horas50" u "horas100".
--
-- Ejecutar en Supabase → SQL Editor. Es idempotente.

alter table public.legajos
  add column if not exists horas_fijas jsonb not null default '[]'::jsonb;

comment on column public.legajos.horas_fijas is
  'Horas semanales fijas: se multiplican por la cantidad de días del período.';
