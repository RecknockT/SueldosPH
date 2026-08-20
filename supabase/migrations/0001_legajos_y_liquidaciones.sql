-- SueldosPH · legajos de empleados e historial de liquidaciones
--
-- Ejecutar una sola vez en Supabase → SQL Editor.
-- Es idempotente: se puede volver a correr sin romper nada.

-- ---------------------------------------------------------------------------
-- Legajos
-- ---------------------------------------------------------------------------

create table if not exists public.legajos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- Empleado
  nombre text not null,
  cuil text,
  cargo_id text not null,
  categoria smallint not null default 1 check (categoria between 1 and 4),
  fecha_ingreso date,

  -- Empleador: van impresos en el recibo
  consorcio_nombre text,
  consorcio_cuit text,

  -- Valores habituales, para precargar la liquidación
  uf numeric not null default 0,
  adic_rem numeric not null default 0,
  adic_no_rem numeric not null default 0,
  adicionales jsonb not null default '{}'::jsonb,
  aportes jsonb not null default '{}'::jsonb,

  activo boolean not null default true,
  notas text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists legajos_user_id_idx on public.legajos (user_id);
create index if not exists legajos_consorcio_idx on public.legajos (user_id, consorcio_nombre);

-- ---------------------------------------------------------------------------
-- Liquidaciones
-- ---------------------------------------------------------------------------

create table if not exists public.liquidaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- Si se borra el legajo, la liquidación sobrevive: es un registro de lo pagado.
  legajo_id uuid references public.legajos (id) on delete set null,

  periodo text not null,

  -- Foto completa del momento: empleado, entradas, planilla y resultado.
  -- No se recalcula nunca. Si mañana se corrige una planilla, esto no cambia.
  snapshot jsonb not null,

  -- Desnormalizados para poder listar y ordenar sin abrir el jsonb.
  empleado_nombre text not null,
  bruto numeric not null,
  descuentos numeric not null,
  neto numeric not null,

  created_at timestamptz not null default now()
);

create index if not exists liquidaciones_user_id_idx on public.liquidaciones (user_id, created_at desc);
create index if not exists liquidaciones_legajo_idx on public.liquidaciones (legajo_id);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------

create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists legajos_updated_at on public.legajos;
create trigger legajos_updated_at
  before update on public.legajos
  for each row execute function public.tocar_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: cada usuario ve y toca únicamente lo suyo.
-- ---------------------------------------------------------------------------

alter table public.legajos enable row level security;
alter table public.liquidaciones enable row level security;

drop policy if exists "legajos propios" on public.legajos;
create policy "legajos propios" on public.legajos
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "liquidaciones propias" on public.liquidaciones;
create policy "liquidaciones propias" on public.liquidaciones
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
