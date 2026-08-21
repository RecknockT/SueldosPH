-- SueldosPH · ajustes recurrentes del legajo
--
-- Los ajustes que se repiten todos los meses ahora viven en el legajo, igual
-- que las horas fijas: al elegir al empleado se cargan solos y se pueden
-- editar o borrar en esa liquidación sin tocar el legajo.
--
-- Esto reemplaza a adic_rem y adic_no_rem, que hacían lo mismo pero sin
-- concepto: eran un monto suelto. La migración los convierte en ajustes con
-- nombre, así que no hay que recargar nada a mano.
--
-- Cada ajuste es { id, concepto, columna, monto, remunerativo }, donde columna
-- es "haber" o "descuento".
--
-- Las columnas viejas quedan en la tabla pero sin uso. Recién conviene
-- borrarlas cuando hayas confirmado que los legajos migraron bien:
--
--   alter table public.legajos drop column adic_rem, drop column adic_no_rem;
--
-- Ejecutar en Supabase → SQL Editor. Es idempotente.

alter table public.legajos
  add column if not exists ajustes jsonb not null default '[]'::jsonb;

comment on column public.legajos.ajustes is
  'Ajustes que se repiten todos los meses: se precargan al liquidar.';

-- Migra los adicionales a ajustes, sólo en los legajos que todavía no tienen
-- ninguno. Correrla dos veces no duplica nada.
update public.legajos
set ajustes = (
  select coalesce(jsonb_agg(item), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id', 'adic-rem',
      'concepto', 'Suma remunerativa',
      'columna', 'haber',
      'monto', adic_rem,
      'remunerativo', true
    ) as item
    where adic_rem > 0

    union all

    select jsonb_build_object(
      'id', 'adic-no-rem',
      'concepto', 'Adicional no remunerativo',
      'columna', 'haber',
      'monto', adic_no_rem,
      'remunerativo', false
    )
    where adic_no_rem > 0
  ) as items
)
where ajustes = '[]'::jsonb
  and (adic_rem > 0 or adic_no_rem > 0);
