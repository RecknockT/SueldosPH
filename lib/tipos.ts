import type { CostoLaboral } from "./costo-laboral"
import type {
  Categoria,
  Entradas,
  EstadoAdicionales,
  EstadoAportes,
  Liquidacion,
} from "./liquidacion"

/** Fila de public.legajos. */
export type Legajo = {
  id: string
  nombre: string
  cuil: string | null
  cargo_id: string
  categoria: Categoria
  fecha_ingreso: string | null
  consorcio_nombre: string | null
  consorcio_cuit: string | null
  uf: number
  adic_rem: number
  adic_no_rem: number
  adicionales: Partial<EstadoAdicionales>
  aportes: Partial<EstadoAportes>
  activo: boolean
  notas: string | null
  /** Póliza de ART y seguro de vida del consorcio, para el costo laboral. */
  art_alicuota: number
  art_monto_fijo: number
  seguro_vida: number
  detraccion: number
  contribucion_solidaria: number
  created_at: string
  updated_at: string
}

/** Lo que se manda al guardar o editar un legajo. */
export type EntradaLegajo = Omit<Legajo, "id" | "created_at" | "updated_at">

/**
 * Foto de una liquidación en el momento en que se guardó.
 *
 * Se persiste completa —incluidos los datos del empleado y el resultado ya
 * calculado— para que el recibo emitido sea siempre reproducible. Si mañana se
 * corrige una planilla o cambia una regla de cálculo, esto no se mueve.
 */
export type SnapshotLiquidacion = {
  version: 1
  periodo: string
  empleado: {
    nombre: string
    cuil: string | null
    cargoId: string
    cargoNombre: string
    categoria: Categoria
    fechaIngreso: string | null
    antiguedadAnios: number
  }
  empleador: {
    nombre: string | null
    cuit: string | null
  }
  entradas: Entradas
  adicionales: EstadoAdicionales
  aportes: EstadoAportes
  resultado: Liquidacion
  /**
   * Contribuciones patronales y costo total (Ley 27.802 / Dto. 407/2026).
   * Opcional: los recibos emitidos antes de incorporarlo no lo tienen.
   */
  costoLaboral?: CostoLaboral
}

/** Fila de public.liquidaciones. */
export type LiquidacionGuardada = {
  id: string
  legajo_id: string | null
  periodo: string
  snapshot: SnapshotLiquidacion
  empleado_nombre: string
  bruto: number
  descuentos: number
  neto: number
  created_at: string
}
