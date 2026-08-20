import junio2026 from "@/data/planillas/junio2026.json"
import mayo2026 from "@/data/planillas/mayo2026.json"

export type Cargo = {
  id: string
  nombre: string
  /** Sueldo básico por categoría, indexado por "1" | "2" | "3" | "4". */
  categorias: Record<string, number>
}

export type AdicionalesPlanilla = {
  retiroResiduos: number
  clasificacionResiduos: number
  valorVivienda: number
  plusAntiguedad1: number
  plusAntiguedad2: number
  limpiezaCocheras: number
  movimientoCoches: number
  jardin: number
  zonaDesfavorable: number
  /** Porcentaje sobre el sueldo básico. */
  tituloEncargadoIntegral: number
  limpiezaPileta: number
  viaticos: number
}

export type AportesPlanilla = {
  jubilacion: number
  inssjp: number
  sindicato: number
  obraSocial: number
  cajaProteccionFamilia: number
  fmvdd: number
  seguroVitalicio: number
}

export type Planilla = {
  nombre: string
  cargos: Cargo[]
  jornales: {
    personalJornalizadoHora: number
    suplentePorDia: number
  }
  adicionales: AdicionalesPlanilla
  aportes: AportesPlanilla
}

/**
 * Planillas disponibles, de la más reciente a la más vieja.
 * Para sumar un período: agregar el JSON en data/planillas y una entrada acá.
 */
export const PLANILLAS = {
  "Junio 2026": junio2026 as Planilla,
  "Mayo 2026": mayo2026 as Planilla,
} satisfies Record<string, Planilla>

export type PlanillaKey = keyof typeof PLANILLAS

export const PLANILLA_KEYS = Object.keys(PLANILLAS) as PlanillaKey[]

export const PLANILLA_POR_DEFECTO: PlanillaKey = PLANILLA_KEYS[0]

export function getPlanilla(key: PlanillaKey): Planilla {
  return PLANILLAS[key]
}
