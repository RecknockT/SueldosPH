/**
 * Sincroniza los feriados nacionales.
 *
 *   npm run sync:feriados            -> año corriente
 *   npm run sync:feriados -- 2026 2027
 *
 * Escribe un JSON por año en data/feriados.
 *
 * La fuente oficial es https://www.argentina.gob.ar/feriados, pero publica la
 * lista sólo como HTML armado con JavaScript, así que no se puede leer desde un
 * script. Se usa api.argentinadatos.com, que expone lo mismo en JSON.
 *
 * Esa equivalencia está verificada: para 2026, las 19 fechas que cuentan como
 * feriado en la página oficial —inamovibles, trasladables y turísticos— son
 * exactamente las 19 que devuelve la API, con los mismos tipos. Los "días no
 * laborables" religiosos no entran: son optativos para el empleador y, si se
 * trabajan, se pagan como día normal.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const DESTINO = join(process.cwd(), "data", "feriados")
const PAUSA_MS = 500

/** Los tipos que devuelve la API. "puente" es el turístico de la página oficial. */
const TIPOS = ["inamovible", "trasladable", "puente"] as const
type TipoFeriado = (typeof TIPOS)[number]

type Feriado = { fecha: string; tipo: TipoFeriado; nombre: string }

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms))

function leerSiExiste(ruta: string) {
  try {
    return readFileSync(ruta, "utf8")
  } catch {
    return null
  }
}

/**
 * Valida con dureza: mejor un sync que falla y se ve que un JSON con feriados
 * inventados, que después marcan mal un día en el calendario de liquidación.
 */
function validar(datos: unknown, anio: number): Feriado[] {
  if (!Array.isArray(datos)) {
    throw new Error(`${anio}: la API no devolvió una lista.`)
  }

  if (datos.length < 12 || datos.length > 30) {
    throw new Error(
      `${anio}: llegaron ${datos.length} feriados, y un año tiene entre 12 y 30. ` +
        "Probablemente cambió la API."
    )
  }

  const feriados: Feriado[] = []

  for (const fila of datos) {
    const { fecha, tipo, nombre } = fila as Record<string, unknown>

    if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new Error(`${anio}: fecha ilegible "${String(fecha)}".`)
    }
    if (!fecha.startsWith(`${anio}-`)) {
      throw new Error(`${anio}: llegó ${fecha}, que es de otro año.`)
    }
    if (typeof tipo !== "string" || !TIPOS.includes(tipo as TipoFeriado)) {
      throw new Error(`${anio}: tipo desconocido "${String(tipo)}" en ${fecha}.`)
    }
    if (typeof nombre !== "string" || nombre.trim() === "") {
      throw new Error(`${anio}: el feriado del ${fecha} vino sin nombre.`)
    }

    feriados.push({ fecha, tipo: tipo as TipoFeriado, nombre: nombre.trim() })
  }

  // Año nuevo y Navidad son inamovibles: si faltan, algo salió mal.
  for (const dia of [`${anio}-01-01`, `${anio}-12-25`]) {
    if (!feriados.some((f) => f.fecha === dia)) {
      throw new Error(`${anio}: falta el feriado del ${dia}.`)
    }
  }

  return feriados.sort((a, b) => a.fecha.localeCompare(b.fecha))
}

function escribirManifiesto(anios: number[]) {
  const ordenados = [...anios].sort((a, b) => b - a)

  const contenido = [
    "// Archivo generado por scripts/sync-feriados.ts — no editar a mano.",
    "// Para actualizarlo: npm run sync:feriados",
    "",
    ...ordenados.map((a) => `import a${a} from "./${a}.json"`),
    "",
    "/** Feriados por año, del más reciente al más antiguo. */",
    "export const FERIADOS_POR_ANIO = {",
    ...ordenados.map((a) => `  ${a}: a${a},`),
    "}",
    "",
  ].join("\n")

  writeFileSync(join(DESTINO, "index.ts"), contenido, "utf8")
}

async function main() {
  const pedidos = process.argv
    .slice(2)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 1990)

  const anios = pedidos.length > 0 ? pedidos : [new Date().getFullYear()]

  mkdirSync(DESTINO, { recursive: true })

  const nuevos: number[] = []
  const cambiados: number[] = []
  const iguales: number[] = []

  for (const [i, anio] of anios.entries()) {
    if (i > 0) await dormir(PAUSA_MS)

    const url = `https://api.argentinadatos.com/v1/feriados/${anio}`
    const respuesta = await fetch(url, {
      headers: { "user-agent": "SueldosPH/1.0 (sync de feriados)" },
    })

    if (!respuesta.ok) {
      throw new Error(`${url} respondió ${respuesta.status} ${respuesta.statusText}`)
    }

    const feriados = validar(await respuesta.json(), anio)
    const contenido = `${JSON.stringify({ anio, feriados }, null, 2)}\n`
    const ruta = join(DESTINO, `${anio}.json`)
    const previo = leerSiExiste(ruta)

    if (previo === null) {
      writeFileSync(ruta, contenido, "utf8")
      nuevos.push(anio)
    } else if (previo !== contenido) {
      writeFileSync(ruta, contenido, "utf8")
      cambiados.push(anio)
    } else {
      iguales.push(anio)
    }

    console.log(`${anio}: ${feriados.length} feriados`)
  }

  // El manifiesto lista todos los años que tengan archivo, no sólo los pedidos.
  const conArchivo = anios.filter(
    (a) => leerSiExiste(join(DESTINO, `${a}.json`)) !== null
  )
  escribirManifiesto(conArchivo)

  console.log("")
  if (nuevos.length) console.log(`Nuevos: ${nuevos.join(", ")}`)
  if (cambiados.length) {
    console.log(`Actualizados: ${cambiados.join(", ")}`)
    console.log("  Revisá el diff: cambian días marcados en el calendario.")
  }
  if (iguales.length) console.log(`Sin cambios: ${iguales.join(", ")}`)
}

await main()
