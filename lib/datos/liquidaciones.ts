import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { LiquidacionGuardada } from "@/lib/tipos"

import { traducirError } from "./errores"

const COLUMNAS =
  "id, legajo_id, periodo, snapshot, empleado_nombre, bruto, descuentos, neto, created_at"

export async function listarLiquidaciones(limite = 100): Promise<LiquidacionGuardada[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("liquidaciones")
    .select(COLUMNAS)
    .order("created_at", { ascending: false })
    .limit(limite)

  if (error) throw traducirError(error)

  return (data ?? []) as LiquidacionGuardada[]
}

export async function obtenerLiquidacion(
  id: string
): Promise<LiquidacionGuardada | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("liquidaciones")
    .select(COLUMNAS)
    .eq("id", id)
    .maybeSingle()

  if (error) throw traducirError(error)

  return (data as LiquidacionGuardada) ?? null
}
