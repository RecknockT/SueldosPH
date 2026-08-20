/**
 * Importes en letras para el recibo de haberes: el monto tiene que ir escrito
 * además de en números.
 */

const UNIDADES = [
  "",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte",
  "veintiuno",
  "veintidós",
  "veintitrés",
  "veinticuatro",
  "veinticinco",
  "veintiséis",
  "veintisiete",
  "veintiocho",
  "veintinueve",
]

const DECENAS = [
  "",
  "",
  "veinte",
  "treinta",
  "cuarenta",
  "cincuenta",
  "sesenta",
  "setenta",
  "ochenta",
  "noventa",
]

const CENTENAS = [
  "",
  "ciento",
  "doscientos",
  "trescientos",
  "cuatrocientos",
  "quinientos",
  "seiscientos",
  "setecientos",
  "ochocientos",
  "novecientos",
]

/** 0 a 999. `apocope` convierte "uno" en "un" (un mil, veintiún mil). */
function menorAMil(n: number, apocope: boolean): string {
  if (n === 0) return ""
  if (n === 100) return "cien"

  const centena = Math.floor(n / 100)
  const resto = n % 100

  const partes: string[] = []
  if (centena > 0) partes.push(CENTENAS[centena])

  if (resto > 0) {
    if (resto < 30) {
      partes.push(UNIDADES[resto])
    } else {
      const decena = Math.floor(resto / 10)
      const unidad = resto % 10
      partes.push(unidad > 0 ? `${DECENAS[decena]} y ${UNIDADES[unidad]}` : DECENAS[decena])
    }
  }

  const texto = partes.join(" ")

  if (!apocope) return texto

  // "veintiuno" -> "veintiún", "uno" -> "un"
  return texto.replace(/veintiuno$/, "veintiún").replace(/(^|\s)uno$/, "$1un")
}

/** Parte entera en letras. 0 -> "cero". */
export function enteroEnLetras(valor: number): string {
  const n = Math.floor(Math.abs(valor))
  if (n === 0) return "cero"

  const millones = Math.floor(n / 1_000_000)
  const miles = Math.floor((n % 1_000_000) / 1000)
  const resto = n % 1000

  const partes: string[] = []

  if (millones === 1) partes.push("un millón")
  else if (millones > 1) partes.push(`${menorAMil(millones, true)} millones`)

  if (miles === 1) partes.push("mil")
  else if (miles > 1) partes.push(`${menorAMil(miles, true)} mil`)

  if (resto > 0) partes.push(menorAMil(resto, false))

  return partes.join(" ").replace(/\s+/g, " ").trim()
}

/**
 * "Pesos un millón doscientos treinta y cuatro mil quinientos con 67/100"
 * Es la forma en que se escribe el importe en un recibo de sueldo.
 */
export function pesosEnLetras(valor: number): string {
  const seguro = Number.isFinite(valor) ? valor : 0
  const absoluto = Math.abs(seguro)

  const entero = Math.floor(absoluto)
  const centavos = Math.round((absoluto - entero) * 100)

  // Redondeo hacia arriba: 1234.999 -> 1235 con 00/100, no 1234 con 100/100.
  const enteroFinal = centavos === 100 ? entero + 1 : entero
  const centavosFinal = centavos === 100 ? 0 : centavos

  const signo = seguro < 0 ? "menos " : ""
  const letras = enteroEnLetras(enteroFinal)

  return `${signo}Pesos ${letras} con ${String(centavosFinal).padStart(2, "0")}/100`
}
