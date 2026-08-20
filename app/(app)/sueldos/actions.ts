"use server"

import { revalidatePath } from "next/cache"

import {
  CONFIG_COSTO_LABORAL_POR_DEFECTO,
  calcularCostoLaboral,
  type ConfigCostoLaboral,
} from "@/lib/costo-laboral"
import { traducirError } from "@/lib/datos/errores"
import {
  ADICIONALES_INICIALES,
  APORTES_INICIALES,
  ENTRADAS_INICIALES,
  calcularLiquidacion,
  type Categoria,
  type Entradas,
  type EstadoAdicionales,
  type EstadoAportes,
} from "@/lib/liquidacion"
import { aniosDeAntiguedad } from "@/lib/periodos"
import { PLANILLAS } from "@/lib/planillas"
import { createClient } from "@/lib/supabase/server"
import type { SnapshotLiquidacion } from "@/lib/tipos"

export type DatosLiquidacion = {
  legajoId: string | null
  periodo: string
  cargoId: string
  categoria: Categoria
  entradas: Entradas
  adicionales: EstadoAdicionales
  aportes: EstadoAportes
  empleado: { nombre: string; cuil: string | null; fechaIngreso: string | null }
  empleador: { nombre: string | null; cuit: string | null }
  /** Póliza de ART y seguro de vida; si falta se usan los valores por defecto. */
  costoLaboral?: Partial<ConfigCostoLaboral>
}

export type EstadoGuardado = { error?: string; id?: string }

/**
 * Guarda una liquidación y devuelve su id.
 *
 * El resultado se recalcula acá con los mismos datos de entrada en vez de
 * aceptar los totales que manda el navegador: el recibo que queda emitido tiene
 * que ser siempre lo que produce el motor de cálculo, no lo que dijo el cliente.
 */
export async function guardarLiquidacion(
  datos: DatosLiquidacion
): Promise<EstadoGuardado> {
  const planilla = PLANILLAS[datos.periodo]
  if (!planilla) return { error: `El período "${datos.periodo}" no existe.` }

  const cargo = planilla.cargos.find((c) => c.id === datos.cargoId)
  if (!cargo) return { error: "El cargo elegido no existe en esa planilla." }

  const nombre = datos.empleado.nombre.trim()
  if (!nombre) {
    return { error: "Poné un nombre de empleado para poder guardar la liquidación." }
  }

  const entradas: Entradas = { ...ENTRADAS_INICIALES, ...datos.entradas }
  const adicionales: EstadoAdicionales = { ...ADICIONALES_INICIALES, ...datos.adicionales }
  const aportes: EstadoAportes = { ...APORTES_INICIALES, ...datos.aportes }

  const resultado = calcularLiquidacion({
    planilla,
    cargo,
    categoria: datos.categoria,
    entradas,
    adicionales,
    aportes,
  })

  const costoLaboral = calcularCostoLaboral(
    resultado.bruto,
    { ...CONFIG_COSTO_LABORAL_POR_DEFECTO, ...datos.costoLaboral },
    resultado.noRemunerativo
  )

  const snapshot: SnapshotLiquidacion = {
    version: 1,
    periodo: datos.periodo,
    empleado: {
      nombre,
      cuil: datos.empleado.cuil,
      cargoId: cargo.id,
      cargoNombre: cargo.nombre,
      categoria: datos.categoria,
      fechaIngreso: datos.empleado.fechaIngreso,
      antiguedadAnios: aniosDeAntiguedad(datos.empleado.fechaIngreso, datos.periodo),
    },
    empleador: datos.empleador,
    entradas,
    adicionales,
    aportes,
    resultado,
    costoLaboral,
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Sesión vencida. Volvé a ingresar." }

  const { data, error } = await supabase
    .from("liquidaciones")
    .insert({
      user_id: user.id,
      legajo_id: datos.legajoId,
      periodo: datos.periodo,
      snapshot,
      empleado_nombre: nombre,
      bruto: resultado.bruto,
      descuentos: resultado.descuentos,
      neto: resultado.neto,
    })
    .select("id")
    .single()

  if (error) return { error: traducirError(error).message }

  revalidatePath("/historial")

  return { id: data.id as string }
}

export async function borrarLiquidacion(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("liquidaciones").delete().eq("id", id)

  if (error) return { error: traducirError(error).message }

  revalidatePath("/historial")

  return {}
}
