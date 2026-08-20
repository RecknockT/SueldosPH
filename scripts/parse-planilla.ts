import { parse } from "node-html-parser"

import type { AdicionalesPlanilla, Cargo, Planilla } from "../lib/planillas.ts"

/**
 * Parser de las planillas salariales publicadas por SUTERH.
 *
 * La página de cada período trae dos tablas HTML:
 *   - la escala por función y categoría, más dos filas de jornales al final
 *   - los adicionales por tarea
 *
 * El mapeo es estricto a propósito: si el sitio cambia un nombre de fila o
 * agrega una función, el parser falla en vez de escribir una planilla
 * incompleta. Son sueldos: es preferible un sync roto y visible a un JSON con
 * un campo faltando en silencio.
 */

/** Alícuotas de aportes. No salen de la planilla: son porcentajes de ley. */
export const APORTES_POR_LEY = {
  jubilacion: 11,
  inssjp: 3,
  sindicato: 2,
  obraSocial: 3,
  cajaProteccionFamilia: 1,
  fmvdd: 1,
  seguroVitalicio: 0.75,
} as const

/**
 * Funciones de la escala, en el orden en que las publica SUTERH.
 * La clave es el nombre del sitio normalizado; el valor, nuestro id y nombre
 * canónicos (los que consume lib/liquidacion.ts).
 */
const CARGOS: { fuente: string; id: string; nombre: string }[] = [
  {
    fuente: "encargado permanente con vivienda",
    id: "encargado_permanente_cv",
    nombre: "Encargado Permanente con vivienda",
  },
  {
    fuente: "encargado permanente sin vivienda",
    id: "encargado_permanente_sv",
    nombre: "Encargado Permanente sin vivienda",
  },
  {
    fuente: "ayudante permanente con vivienda",
    id: "ayudante_permanente_cv",
    nombre: "Ayudante Permanente con vivienda",
  },
  {
    fuente: "ayudante permanente sin vivienda",
    id: "ayudante_permanente_sv",
    nombre: "Ayudante Permanente sin vivienda",
  },
  {
    fuente: "ayudante media jornada",
    id: "ayudante_media_jornada",
    nombre: "Ayudante Media jornada",
  },
  {
    fuente: "personal asimilado con vivienda",
    id: "personal_asimilado_cv",
    nombre: "Personal Asimilado con vivienda",
  },
  {
    fuente: "personal asimilado sin vivienda",
    id: "personal_asimilado_sv",
    nombre: "Personal Asimilado sin vivienda",
  },
  {
    fuente: "mayordomo con vivienda",
    id: "mayordomo_cv",
    nombre: "Mayordomo con vivienda",
  },
  {
    fuente: "mayordomo sin vivienda",
    id: "mayordomo_sv",
    nombre: "Mayordomo sin vivienda",
  },
  { fuente: "intendente", id: "intendente", nombre: "Intendente" },
  {
    fuente: "personal con mas 1 funcion con vivienda",
    id: "personal_mas_una_funcion_cv",
    nombre: "Personal con más de 1 función con vivienda",
  },
  {
    fuente: "personal con mas 1 funcion sin vivienda",
    id: "personal_mas_una_funcion_sv",
    nombre: "Personal con más de 1 función sin vivienda",
  },
  {
    fuente: "encargado guardacoches con vivienda",
    id: "encargado_guardacoches_cv",
    nombre: "Encargado Guardacoches con vivienda",
  },
  {
    fuente: "encargado guardacoches sin vivienda",
    id: "encargado_guardacoches_sv",
    nombre: "Encargado Guardacoches sin vivienda",
  },
  {
    fuente: "personal vigilancia nocturna",
    id: "vigilancia_nocturna",
    nombre: "Personal Vigilancia Nocturna",
  },
  {
    fuente: "personal vigilancia diurna",
    id: "vigilancia_diurna",
    nombre: "Personal Vigilancia Diurna",
  },
  {
    fuente: "personal vigilancia media jornada",
    id: "vigilancia_media_jornada",
    nombre: "Personal Vigilancia Media Jornada",
  },
  {
    fuente: "encargado no permanente con vivienda",
    id: "encargado_no_permanente_cv",
    nombre: "Encargado No Permanente con vivienda",
  },
  {
    fuente: "encargado no permanente sin vivienda",
    id: "encargado_no_permanente_sv",
    nombre: "Encargado No Permanente sin vivienda",
  },
  {
    fuente: "ayudante temporario",
    id: "ayudante_temporario",
    nombre: "Ayudante Temporario",
  },
  {
    fuente: "ayudante temporario media jornada",
    id: "ayudante_temporario_media_jornada",
    nombre: "Ayudante Temporario Media Jornada",
  },
]

/** Filas de jornales, al pie de la primera tabla. */
const JORNALES: { fragmento: string; campo: "personalJornalizadoHora" | "suplentePorDia" }[] =
  [
    { fragmento: "personal jornalizado", campo: "personalJornalizadoHora" },
    { fragmento: "suplente con horario por dia", campo: "suplentePorDia" },
  ]

/** Adicionales por tarea. Se busca por fragmento porque los textos son largos. */
const ADICIONALES: { fragmento: string; campo: keyof AdicionalesPlanilla }[] = [
  { fragmento: "retiro de residuos", campo: "retiroResiduos" },
  { fragmento: "clasificacion de residuos", campo: "clasificacionResiduos" },
  { fragmento: "valor vivienda", campo: "valorVivienda" },
  { fragmento: "inc. d, e, h, n y p", campo: "plusAntiguedad1" },
  { fragmento: "art. 11", campo: "plusAntiguedad2" },
  { fragmento: "limpieza de cocheras", campo: "limpiezaCocheras" },
  { fragmento: "moviemiento de coches", campo: "movimientoCoches" },
  { fragmento: "plus jardin", campo: "jardin" },
  { fragmento: "zona desfavorable", campo: "zonaDesfavorable" },
  { fragmento: "titulo de encargado integral", campo: "tituloEncargadoIntegral" },
  { fragmento: "limpieza de piletas", campo: "limpiezaPileta" },
  { fragmento: "viaticos", campo: "viaticos" },
]

/** Minúsculas, sin tildes y con espacios colapsados, para comparar sin sorpresas. */
export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .split("")
    .filter((c) => { const n = c.codePointAt(0) ?? 0; return n < 768 || n > 879 })
    .join("")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * "1.348.432" -> 1348432 · "2.090,70" -> 2090.7 · "50 %" -> 50
 * El punto es separador de miles y la coma, decimal (formato es-AR).
 */
export function parsearMonto(texto: string): number {
  const limpio = texto.replace(/\s|%|\$/g, "").trim()
  if (limpio === "") return Number.NaN

  const valor = Number(limpio.replace(/\./g, "").replace(",", "."))
  return Number.isFinite(valor) ? valor : Number.NaN
}

function filasDe(html: string): string[][][] {
  const raiz = parse(html)

  return raiz.querySelectorAll("table").map((tabla) =>
    tabla
      .querySelectorAll("tr")
      .map((fila) =>
        fila
          .querySelectorAll("td, th")
          .map((celda) => celda.structuredText.replace(/\s+/g, " ").trim())
      )
  )
}

export type ResultadoParseo = { planilla: Planilla; avisos: string[] }

export function parsearPlanilla(html: string, nombre: string): ResultadoParseo {
  const tablas = filasDe(html)
  const avisos: string[] = []

  if (tablas.length < 2) {
    throw new Error(
      `${nombre}: se esperaban 2 tablas (escala y adicionales) y se encontraron ${tablas.length}. ` +
        "Probablemente cambió la estructura de la página."
    )
  }

  const [escala, tablaAdicionales] = tablas

  // --- Escala por función y categoría ---
  const porNombre = new Map<string, string[]>()
  for (const fila of escala) {
    if (fila.length < 2) continue
    porNombre.set(normalizar(fila[0]), fila)
  }

  const cargos: Cargo[] = CARGOS.map(({ fuente, id, nombre: canonico }) => {
    const fila = porNombre.get(fuente)
    if (!fila) {
      throw new Error(`${nombre}: no se encontró la función "${fuente}" en la escala.`)
    }

    const categorias: Record<string, number> = {}
    for (let i = 1; i <= 4; i += 1) {
      const monto = parsearMonto(fila[i] ?? "")
      if (!Number.isFinite(monto) || monto <= 0) {
        throw new Error(
          `${nombre}: categoría ${i} de "${canonico}" ilegible (recibí "${fila[i] ?? ""}").`
        )
      }
      categorias[String(i)] = monto
    }

    return { id, nombre: canonico, categorias }
  })

  // --- Jornales ---
  const jornales = {} as Planilla["jornales"]
  for (const { fragmento, campo } of JORNALES) {
    const fila = escala.find((f) => normalizar(f[0] ?? "").includes(fragmento))
    if (!fila) {
      throw new Error(`${nombre}: no se encontró la fila de jornales "${fragmento}".`)
    }

    // El valor puede caer en cualquier columna: se toma la primera numérica.
    const monto = fila.slice(1).map(parsearMonto).find((v) => Number.isFinite(v) && v > 0)
    if (monto === undefined) {
      throw new Error(`${nombre}: la fila "${fragmento}" no trae un importe legible.`)
    }
    jornales[campo] = monto
  }

  // --- Adicionales ---
  const adicionales = {} as AdicionalesPlanilla
  for (const { fragmento, campo } of ADICIONALES) {
    const fila = tablaAdicionales.find((f) => normalizar(f[0] ?? "").includes(fragmento))
    if (!fila) {
      throw new Error(`${nombre}: no se encontró el adicional "${fragmento}".`)
    }

    const monto = parsearMonto(fila[1] ?? "")
    if (!Number.isFinite(monto) || monto <= 0) {
      throw new Error(
        `${nombre}: el adicional "${fragmento}" es ilegible (recibí "${fila[1] ?? ""}").`
      )
    }
    adicionales[campo] = monto
  }

  if (tablaAdicionales.length !== ADICIONALES.length) {
    avisos.push(
      `la tabla de adicionales trae ${tablaAdicionales.length} filas y se mapearon ${ADICIONALES.length}: ` +
        "puede haber un concepto nuevo sin contemplar."
    )
  }

  return {
    planilla: {
      nombre,
      cargos,
      jornales,
      adicionales,
      aportes: { ...APORTES_POR_LEY },
    },
    avisos,
  }
}
