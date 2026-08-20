/**
 * Sincroniza las planillas salariales publicadas por SUTERH.
 *
 *   npm run sync:planillas              -> año corriente
 *   npm run sync:planillas -- 2025 2026 -> años puntuales
 *
 * Escribe un JSON por período en data/planillas y regenera el manifiesto.
 * No pisa nada en silencio: al final informa qué creó, qué cambió y qué quedó
 * igual, para que el diff de git sea la revisión antes de liquidar con datos
 * nuevos.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { parsearPlanilla } from "./parse-planilla.ts"

const INDICE = "https://suterh.org.ar/planillas-salariales/"
const DESTINO = join(process.cwd(), "data", "planillas")
const MANIFIESTO = join(DESTINO, "index.ts")

/** Pausa entre pedidos: son 8 páginas, no hay por qué apurar su servidor. */
const PAUSA_MS = 700

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

const capitalizar = (texto: string) => texto[0].toUpperCase() + texto.slice(1)
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Periodo = { mes: string; anio: number; indiceMes: number; url: string }

async function bajar(url: string) {
  const respuesta = await fetch(url, {
    headers: { "user-agent": "SueldosPH/1.0 (sync de planillas salariales)" },
  })

  if (!respuesta.ok) {
    throw new Error(`${url} respondió ${respuesta.status} ${respuesta.statusText}`)
  }

  return respuesta.text()
}

/** Saca del índice los períodos de los años pedidos. */
async function listarPeriodos(anios: number[]): Promise<Periodo[]> {
  const html = await bajar(INDICE)
  const encontrados = new Map<string, Periodo>()

  const patron = /planilla-salarial-([a-zñáéíóú]+)-(\d{4})\/?/gi
  for (const [, mesCrudo, anioCrudo] of html.matchAll(patron)) {
    const mes = mesCrudo.toLowerCase()
    const anio = Number(anioCrudo)
    const indiceMes = MESES.indexOf(mes)

    if (indiceMes < 0 || !anios.includes(anio)) continue

    const clave = `${mes}-${anio}`
    if (encontrados.has(clave)) continue

    encontrados.set(clave, {
      mes,
      anio,
      indiceMes,
      url: `https://suterh.org.ar/planilla-salarial-${mes}-${anio}/`,
    })
  }

  // Más reciente primero: es el que se usa para liquidar.
  return [...encontrados.values()].sort(
    (a, b) => b.anio - a.anio || b.indiceMes - a.indiceMes
  )
}

function leerSiExiste(ruta: string) {
  try {
    return readFileSync(ruta, "utf8")
  } catch {
    return null
  }
}

function escribirManifiesto(periodos: Periodo[]) {
  const entradas = periodos.map((p) => ({
    variable: `${p.mes}${p.anio}`,
    archivo: `./${p.mes}${p.anio}.json`,
    clave: `${capitalizar(p.mes)} ${p.anio}`,
  }))

  const contenido = [
    "// Archivo generado por scripts/sync-planillas.ts — no editar a mano.",
    "// Para actualizarlo: npm run sync:planillas",
    "",
    ...entradas.map((e) => `import ${e.variable} from "${e.archivo}"`),
    "",
    "/** Planillas disponibles, de la más reciente a la más antigua. */",
    "export const PLANILLAS_JSON = {",
    ...entradas.map((e) => `  ${JSON.stringify(e.clave)}: ${e.variable},`),
    "}",
    "",
  ].join("\n")

  const previo = leerSiExiste(MANIFIESTO)
  if (previo === contenido) return false

  writeFileSync(MANIFIESTO, contenido, "utf8")
  return true
}

async function main() {
  const pedidos = process.argv
    .slice(2)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 1990)

  const anios = pedidos.length > 0 ? pedidos : [new Date().getFullYear()]

  console.log(`Buscando planillas de ${anios.join(", ")} en ${INDICE}`)

  const periodos = await listarPeriodos(anios)
  if (periodos.length === 0) {
    console.error(`No se encontraron planillas para ${anios.join(", ")}.`)
    process.exitCode = 1
    return
  }

  console.log(`Encontradas ${periodos.length}.`)
  mkdirSync(DESTINO, { recursive: true })

  const nuevas: string[] = []
  const cambiadas: string[] = []
  const iguales: string[] = []
  const fallidas: { periodo: string; motivo: string }[] = []

  for (const [i, periodo] of periodos.entries()) {
    const etiqueta = `${capitalizar(periodo.mes)} ${periodo.anio}`
    const ruta = join(DESTINO, `${periodo.mes}${periodo.anio}.json`)

    try {
      if (i > 0) await dormir(PAUSA_MS)

      const html = await bajar(periodo.url)
      const { planilla, avisos } = parsearPlanilla(
        html,
        `Planilla Salarial ${etiqueta}`
      )

      for (const aviso of avisos) console.warn(`  aviso · ${etiqueta}: ${aviso}`)

      const contenido = `${JSON.stringify(planilla, null, 2)}\n`
      const previo = leerSiExiste(ruta)

      if (previo === null) {
        writeFileSync(ruta, contenido, "utf8")
        nuevas.push(etiqueta)
      } else if (previo !== contenido) {
        writeFileSync(ruta, contenido, "utf8")
        cambiadas.push(etiqueta)
      } else {
        iguales.push(etiqueta)
      }
    } catch (error) {
      fallidas.push({
        periodo: etiqueta,
        motivo: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const conArchivo = periodos.filter(
    (p) => leerSiExiste(join(DESTINO, `${p.mes}${p.anio}.json`)) !== null
  )
  const manifiestoTocado = escribirManifiesto(conArchivo)

  console.log("")
  if (nuevas.length) console.log(`Nuevas (${nuevas.length}): ${nuevas.join(", ")}`)
  if (cambiadas.length) {
    console.log(`Actualizadas (${cambiadas.length}): ${cambiadas.join(", ")}`)
    console.log("  Revisá el diff antes de commitear: cambian montos de liquidación.")
  }
  if (iguales.length) console.log(`Sin cambios (${iguales.length}).`)
  if (manifiestoTocado) console.log("Manifiesto data/planillas/index.ts regenerado.")

  if (fallidas.length) {
    console.error("")
    console.error(`Fallaron ${fallidas.length}:`)
    for (const f of fallidas) console.error(`  · ${f.periodo}: ${f.motivo}`)
    process.exitCode = 1
  }
}

await main()
