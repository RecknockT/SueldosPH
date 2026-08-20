const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
]

export type Periodo = { mes: number; anio: number }

/** "Agosto 2026" -> { mes: 7, anio: 2026 }. mes es 0-indexado, como en Date. */
export function parsearPeriodo(clave: string): Periodo | null {
  const [mesTexto, anioTexto] = clave.trim().split(/\s+/)
  if (!mesTexto || !anioTexto) return null

  const mes = MESES.indexOf(mesTexto.toLowerCase())
  const anio = Number(anioTexto)

  if (mes < 0 || !Number.isInteger(anio)) return null

  return { mes, anio }
}

/** Último día del período: es la fecha contra la que se mide la antigüedad. */
export function finDePeriodo(clave: string): Date | null {
  const periodo = parsearPeriodo(clave)
  if (!periodo) return null

  return new Date(periodo.anio, periodo.mes + 1, 0)
}

/**
 * Años cumplidos entre el ingreso y el cierre del período.
 *
 * Se cuentan años completos: alguien que entró el 15/09/2020 tiene 5 años
 * recién en septiembre de 2025, no en enero.
 */
export function aniosDeAntiguedad(
  fechaIngreso: string | null | undefined,
  periodo: string
): number {
  if (!fechaIngreso) return 0

  const corte = finDePeriodo(periodo)
  if (!corte) return 0

  // "2020-09-15" se parsea como fecha local para no correrse por zona horaria.
  const [anio, mes, dia] = fechaIngreso.split("-").map(Number)
  if (!anio || !mes || !dia) return 0

  const ingreso = new Date(anio, mes - 1, dia)
  if (ingreso > corte) return 0

  let anios = corte.getFullYear() - ingreso.getFullYear()

  const cumpleEsteAnio = new Date(corte.getFullYear(), ingreso.getMonth(), ingreso.getDate())
  if (corte < cumpleEsteAnio) anios -= 1

  return Math.max(0, anios)
}

/** "2026-08-20" -> "20/08/2026" */
export function formatFecha(fecha: string | null | undefined): string {
  if (!fecha) return "—"

  const [anio, mes, dia] = fecha.split("T")[0].split("-")
  if (!anio || !mes || !dia) return "—"

  return `${dia}/${mes}/${anio}`
}

export function formatFechaHora(iso: string): string {
  const d = new Date(iso)
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d)
}
