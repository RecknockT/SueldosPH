import { FERIADOS_POR_ANIO } from "@/data/feriados/index"

import { parsearPeriodo } from "./periodos"

/**
 * Feriados nacionales.
 *
 * Los datos salen de data/feriados, que sincroniza scripts/sync-feriados.ts.
 * Sólo entran los que cuentan como feriado para liquidar —inamovibles,
 * trasladables y turísticos—, no los días no laborables religiosos: esos son
 * optativos para el empleador y, si se trabajan, se pagan como día normal.
 */

export type TipoFeriado = "inamovible" | "trasladable" | "puente"

export type Feriado = {
  fecha: string
  tipo: TipoFeriado
  nombre: string
}

type ArchivoFeriados = { anio: number; feriados: Feriado[] }

const PorAnio = FERIADOS_POR_ANIO as unknown as Record<number, ArchivoFeriados>

export const ANIOS_CON_FERIADOS = Object.keys(PorAnio)
  .map(Number)
  .sort((a, b) => b - a)

export function feriadosDelAnio(anio: number): Feriado[] {
  return PorAnio[anio]?.feriados ?? []
}

/** "Junio 2026" -> los feriados de ese mes, ordenados por día. */
export function feriadosDelPeriodo(periodo: string): Feriado[] {
  const parsed = parsearPeriodo(periodo)
  if (!parsed) return []

  const prefijo = `${parsed.anio}-${String(parsed.mes + 1).padStart(2, "0")}-`

  return feriadosDelAnio(parsed.anio)
    .filter((f) => f.fecha.startsWith(prefijo))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

/** Día del mes de cada feriado del período, para marcarlos en la grilla. */
export function diasFeriadosDelPeriodo(periodo: string): Map<number, Feriado> {
  const mapa = new Map<number, Feriado>()

  for (const feriado of feriadosDelPeriodo(periodo)) {
    mapa.set(Number(feriado.fecha.slice(8, 10)), feriado)
  }

  return mapa
}

/** Si no hay datos del año, conviene decirlo en vez de mostrar cero feriados. */
export function hayDatosDelPeriodo(periodo: string): boolean {
  const parsed = parsearPeriodo(periodo)
  return parsed ? PorAnio[parsed.anio] !== undefined : false
}
