import { PLANILLAS_JSON } from "@/data/planillas/index"

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
 * Las planillas salen de data/planillas, que sincroniza scripts/sync-planillas.ts
 * desde suterh.org.ar. No se editan a mano: `npm run sync:planillas` las baja,
 * y el diff de git es la revisión antes de liquidar con montos nuevos.
 */
export const PLANILLAS = PLANILLAS_JSON as unknown as Record<string, Planilla>

export type PlanillaKey = keyof typeof PLANILLAS_JSON

/** En orden: la más reciente primero, tal como las deja el manifiesto. */
export const PLANILLA_KEYS = Object.keys(PLANILLAS_JSON) as PlanillaKey[]

export const PLANILLA_POR_DEFECTO: PlanillaKey = PLANILLA_KEYS[0]

export function getPlanilla(key: PlanillaKey): Planilla {
  return PLANILLAS[key]
}
