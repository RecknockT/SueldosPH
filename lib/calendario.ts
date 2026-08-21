import { parsearPeriodo } from "./periodos.ts"

/**
 * Calendario del período que se está liquidando.
 *
 * Sirve para no contar días a mano: si alguien trabaja cuatro horas los
 * sábados, la cantidad de sábados del mes sale de acá.
 */

export const NOMBRES_DIA = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
] as const

/** 0 domingo … 6 sábado, igual que Date.getDay(). */
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type DiaDelMes = {
  /** Día del mes, de 1 en adelante. */
  numero: number
  diaSemana: DiaSemana
  esFinDeSemana: boolean
}

export type CalendarioMes = {
  mes: number
  anio: number
  dias: DiaDelMes[]
  /** Cuántos días de la semana hay, indexado por DiaSemana. */
  porDiaSemana: number[]
  /** Posición del día 1 en la grilla: cuántas celdas vacías van antes. */
  huecoInicial: number
}

const plural = (n: number, singular: string) =>
  n === 1 ? singular : singular === "sábado" ? "sábados" : `${singular}s`

/** "Junio 2026" -> el calendario de ese mes. */
export function calendarioDe(periodo: string): CalendarioMes | null {
  const parsed = parsearPeriodo(periodo)
  if (!parsed) return null

  const { mes, anio } = parsed

  // Día 0 del mes siguiente es el último del actual.
  const cantidadDias = new Date(anio, mes + 1, 0).getDate()

  const dias: DiaDelMes[] = []
  const porDiaSemana = [0, 0, 0, 0, 0, 0, 0]

  for (let numero = 1; numero <= cantidadDias; numero += 1) {
    const diaSemana = new Date(anio, mes, numero).getDay() as DiaSemana

    dias.push({
      numero,
      diaSemana,
      esFinDeSemana: diaSemana === 0 || diaSemana === 6,
    })

    porDiaSemana[diaSemana] += 1
  }

  return {
    mes,
    anio,
    dias,
    porDiaSemana,
    // La grilla arranca en domingo, como el getDay() de Date.
    huecoInicial: dias[0].diaSemana,
  }
}

/** Cuántos días de la semana pedido tiene el período. */
export function cuantosDias(periodo: string, diaSemana: DiaSemana): number {
  return calendarioDe(periodo)?.porDiaSemana[diaSemana] ?? 0
}

/** "4 sábados × 4 hs = 16 hs", para explicar de dónde sale el total. */
export function explicarHoras(
  periodo: string,
  diaSemana: DiaSemana,
  horasPorDia: number
): { cantidad: number; total: number; texto: string } {
  const cantidad = cuantosDias(periodo, diaSemana)
  const total = cantidad * Math.max(0, horasPorDia)

  return {
    cantidad,
    total,
    texto: `${cantidad} ${plural(cantidad, NOMBRES_DIA[diaSemana])} × ${horasPorDia} hs`,
  }
}
