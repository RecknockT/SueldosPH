import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Legajo } from "@/lib/tipos"

import { traducirError } from "./errores"

const COLUMNAS =
  "id, nombre, cuil, cargo_id, categoria, fecha_ingreso, consorcio_nombre, consorcio_cuit, uf, adic_rem, adic_no_rem, adicionales, aportes, activo, notas, art_alicuota, art_monto_fijo, seguro_vida, created_at, updated_at"

/** Legajos del usuario, activos primero y alfabéticos dentro de cada consorcio. */
export async function listarLegajos(): Promise<Legajo[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("legajos")
    .select(COLUMNAS)
    .order("activo", { ascending: false })
    .order("consorcio_nombre", { ascending: true, nullsFirst: false })
    .order("nombre", { ascending: true })

  if (error) throw traducirError(error)

  return (data ?? []) as Legajo[]
}

export async function obtenerLegajo(id: string): Promise<Legajo | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("legajos")
    .select(COLUMNAS)
    .eq("id", id)
    .maybeSingle()

  if (error) throw traducirError(error)

  return (data as Legajo) ?? null
}
