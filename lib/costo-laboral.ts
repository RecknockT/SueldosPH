/**
 * Contribuciones a cargo del empleador y costo laboral total.
 *
 * La Ley 27.802 incorporó el inciso j) al art. 140 de la LCT y el Decreto
 * 407/2026 la reglamentó: desde el 1° de junio de 2026 el recibo tiene que
 * detallar, por trabajador, las contribuciones que paga el empleador y el
 * costo total. En el recibo se imprime bajo "ART. 52 BIS LCT".
 *
 * Las alícuotas son las del régimen reducido (Decreto 814/2001) que aplica a
 * los consorcios, más los conceptos del CCT 589/10. Están tomadas de un recibo
 * real de propiedad horizontal del período 06-2026 y reproducidas al centavo en
 * costo-laboral.test.ts.
 */

export type ClaveContribucion =
  | "jubilacionSipa"
  | "inssjp"
  | "asignacionesFamiliares"
  | "obraSocial"
  | "artMontoFijo"
  | "seguroVidaObligatorio"
  | "artAlicuota"
  | "cajaProteccionFamilia"
  | "fateryhFmvdd"
  | "seracarh"

/**
 * Lo que cambia de un consorcio a otro: la póliza de ART y el importe del
 * seguro de vida. El resto son alícuotas de ley o de convenio, iguales para
 * todos.
 */
export type ConfigCostoLaboral = {
  /** Porcentaje de la póliza de ART. */
  artAlicuota: number
  /** Suma fija mensual por trabajador de la póliza de ART. */
  artMontoFijo: number
  /** Seguro colectivo de vida obligatorio, importe fijo por trabajador. */
  seguroVidaObligatorio: number
}

export const CONFIG_COSTO_LABORAL_POR_DEFECTO: ConfigCostoLaboral = {
  artAlicuota: 4.71,
  artMontoFijo: 1765,
  seguroVidaObligatorio: 424.62,
}

/** Alícuotas que no dependen del consorcio. */
const ALICUOTAS = {
  jubilacionSipa: 10.77,
  inssjp: 1.59,
  asignacionesFamiliares: 5.64,
  obraSocial: 6,
  cajaProteccionFamilia: 1.5,
  fateryhFmvdd: 4.75,
  seracarh: 0.5,
} as const

export type FilaContribucion = {
  id: ClaveContribucion
  detalle: string
  /** null cuando es un importe fijo y no un porcentaje del bruto. */
  alicuota: number | null
  monto: number
}

export type CostoLaboral = {
  contribuciones: FilaContribucion[]
  totalContribuciones: number
  /** Bruto remunerativo más las contribuciones: lo que sale del consorcio. */
  costoTotal: number
}

const seguro = (valor: number) => (Number.isFinite(valor) ? valor : 0)

export function calcularCostoLaboral(
  bruto: number,
  config: ConfigCostoLaboral = CONFIG_COSTO_LABORAL_POR_DEFECTO
): CostoLaboral {
  const base = Math.max(0, seguro(bruto))

  const porcentaje = (alicuota: number) => (base * alicuota) / 100

  // El orden replica el del recibo: se lee por columnas, de a dos.
  const contribuciones: FilaContribucion[] = [
    {
      id: "jubilacionSipa",
      detalle: "JUBILACIÓN (SIPA)",
      alicuota: ALICUOTAS.jubilacionSipa,
      monto: porcentaje(ALICUOTAS.jubilacionSipa),
    },
    {
      id: "seguroVidaObligatorio",
      detalle: "SEGURO DE VIDA OBLIGATORIO",
      alicuota: null,
      monto: seguro(config.seguroVidaObligatorio),
    },
    {
      id: "inssjp",
      detalle: "I.N.S.S.J.P (LEY 19.032)",
      alicuota: ALICUOTAS.inssjp,
      monto: porcentaje(ALICUOTAS.inssjp),
    },
    {
      id: "artAlicuota",
      detalle: "ART (ALÍCUOTA)",
      alicuota: seguro(config.artAlicuota),
      monto: porcentaje(seguro(config.artAlicuota)),
    },
    {
      id: "asignacionesFamiliares",
      detalle: "ASIGNACIONES FAMILIARES (SUAF)",
      alicuota: ALICUOTAS.asignacionesFamiliares,
      monto: porcentaje(ALICUOTAS.asignacionesFamiliares),
    },
    {
      id: "cajaProteccionFamilia",
      detalle: "CAJA PROTECCIÓN FAMILIA",
      alicuota: ALICUOTAS.cajaProteccionFamilia,
      monto: porcentaje(ALICUOTAS.cajaProteccionFamilia),
    },
    {
      id: "obraSocial",
      detalle: "OBRA SOCIAL (ADICIONAL)",
      alicuota: ALICUOTAS.obraSocial,
      monto: porcentaje(ALICUOTAS.obraSocial),
    },
    {
      id: "fateryhFmvdd",
      detalle: "FATERYH (F.M.V.D.D)",
      alicuota: ALICUOTAS.fateryhFmvdd,
      monto: porcentaje(ALICUOTAS.fateryhFmvdd),
    },
    {
      id: "artMontoFijo",
      detalle: "ART (MONTO FIJO)",
      alicuota: null,
      monto: seguro(config.artMontoFijo),
    },
    {
      id: "seracarh",
      detalle: "SERACARH",
      alicuota: ALICUOTAS.seracarh,
      monto: porcentaje(ALICUOTAS.seracarh),
    },
  ]

  const totalContribuciones = contribuciones.reduce((acc, fila) => acc + fila.monto, 0)

  return {
    contribuciones,
    totalContribuciones,
    costoTotal: base + totalContribuciones,
  }
}
