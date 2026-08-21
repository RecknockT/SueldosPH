import { NOMBRES_DIA, cuantosDias, pluralDia, type DiaSemana } from "./calendario.ts"

/**
 * Horas que el empleado hace todas las semanas.
 *
 * Se guardan en el legajo y se resuelven al liquidar: "4 horas los sábados" son
 * 16 o 20 horas según cuántos sábados tenga el mes. Así no hay que recontar
 * cada período ni acordarse de ajustar el número.
 */

/** Además de los siete días, se puede fijar horas por feriado. */
export const FERIADOS = "feriados"

export type DiaFijo = DiaSemana | typeof FERIADOS

export type HoraFija = {
  id: string
  dia: DiaFijo
  horas: number
  tramo: "horas50" | "horas100"
}

export const HORA_FIJA_VACIA: Omit<HoraFija, "id"> = {
  dia: 6,
  horas: 0,
  tramo: "horas100",
}

export function nombreDia(dia: DiaFijo): string {
  return dia === FERIADOS ? "feriado" : NOMBRES_DIA[dia]
}

export function nombreDiaPlural(dia: DiaFijo, veces: number): string {
  return pluralDia(veces, nombreDia(dia))
}

/**
 * Cuántas veces cae ese día en el período.
 *
 * Los feriados llegan de afuera —viven en lib/feriados, que importa JSON— para
 * que este módulo no dependa de datos y se pueda testear solo.
 */
export function vecesEnElPeriodo(
  dia: DiaFijo,
  periodo: string,
  cantidadFeriados = 0
): number {
  return dia === FERIADOS ? cantidadFeriados : cuantosDias(periodo, dia)
}

export type HorasResueltas = {
  horas50: number
  horas100: number
  /** Una línea por regla, para poder mostrar de dónde sale cada total. */
  detalle: { id: string; texto: string; horas: number; tramo: "horas50" | "horas100" }[]
}

/**
 * Convierte las reglas del legajo en horas concretas del período.
 *
 * Devuelve también el detalle para que la app pueda explicar el número en vez
 * de que aparezca solo.
 */
export function resolverHorasFijas(
  reglas: HoraFija[],
  periodo: string,
  cantidadFeriados = 0
): HorasResueltas {
  const resultado: HorasResueltas = { horas50: 0, horas100: 0, detalle: [] }

  for (const regla of reglas) {
    const horas = Math.max(0, Number(regla.horas) || 0)
    if (horas <= 0) continue

    const veces = vecesEnElPeriodo(regla.dia, periodo, cantidadFeriados)
    const total = veces * horas
    if (total <= 0) continue

    resultado[regla.tramo] += total

    resultado.detalle.push({
      id: regla.id,
      texto: `${veces} ${nombreDiaPlural(regla.dia, veces)} × ${horas} hs`,
      horas: total,
      tramo: regla.tramo,
    })
  }

  return resultado
}

const TRAMOS = ["horas50", "horas100"] as const

const diaValido = (valor: unknown): valor is DiaFijo =>
  valor === FERIADOS ||
  (typeof valor === "number" && Number.isInteger(valor) && valor >= 0 && valor <= 6)

/**
 * Reglas confiables a partir de algo que no lo es.
 *
 * Entra el JSON del formulario y lo que devuelve la base: ninguno de los dos
 * está tipado de verdad, así que todo lo que no encaje se descarta en vez de
 * llegar al cálculo.
 */
export function parsearHorasFijas(valor: unknown): HoraFija[] {
  const crudo = typeof valor === "string" ? intentarJSON(valor) : valor
  if (!Array.isArray(crudo)) return []

  const reglas: HoraFija[] = []

  for (const [i, item] of crudo.entries()) {
    if (typeof item !== "object" || item === null) continue

    const { dia, horas, tramo, id } = item as Record<string, unknown>
    if (!diaValido(dia)) continue

    const cantidad = Number(horas)
    if (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad > 24) continue

    reglas.push({
      id: typeof id === "string" && id !== "" ? id : `regla-${i}`,
      dia,
      horas: cantidad,
      tramo: TRAMOS.includes(tramo as (typeof TRAMOS)[number])
        ? (tramo as HoraFija["tramo"])
        : "horas100",
    })
  }

  return reglas
}

function intentarJSON(texto: string): unknown {
  try {
    return JSON.parse(texto)
  } catch {
    return null
  }
}

/** Nada cargado: el estado inicial del panel y el de un legajo sin reglas. */
export const SIN_HORAS_FIJAS: HorasResueltas = { horas50: 0, horas100: 0, detalle: [] }

/** Lo que se cargó a mano en los campos de horas extras. */
export type HorasCargadas = { horas50: number | ""; horas100: number | "" }

/**
 * Junta las horas cargadas a mano con las fijas del legajo.
 *
 * Son independientes a propósito: el campo es del usuario y las fijas salen
 * del legajo, así que escribir en el campo no puede borrarlas. Se suman recién
 * acá, al liquidar. Una vez sumadas son horas extras como cualquier otra: se
 * pagan al valor hora con su recargo y el monto es remunerativo.
 */
export function totalHoras(
  cargadas: HorasCargadas,
  fijas: HorasResueltas
): { horas50: number; horas100: number } {
  const cargada = (valor: number | "") =>
    valor === "" || !Number.isFinite(Number(valor)) ? 0 : Math.max(0, Number(valor))

  return {
    horas50: cargada(cargadas.horas50) + fijas.horas50,
    horas100: cargada(cargadas.horas100) + fijas.horas100,
  }
}
