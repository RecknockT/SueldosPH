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
  | "contribucionSolidaria"
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
  /**
   * Detracción del art. 4 del Decreto 814/2001: se resta de la base de las
   * contribuciones nacionales (SIPA, INSSJP y asignaciones familiares), no de
   * las de obra social, ART ni convenio. Se reduce en contratos a tiempo
   * parcial, así que se deja configurable; en 0 se liquida sobre el bruto.
   */
  detraccion: number
  /**
   * Contribución solidaria del convenio, importe fijo. Corresponde a los
   * trabajadores que no aportan cuota sindical.
   */
  contribucionSolidaria: number
}

export const CONFIG_COSTO_LABORAL_POR_DEFECTO: ConfigCostoLaboral = {
  artAlicuota: 4.71,
  artMontoFijo: 1765,
  seguroVidaObligatorio: 424.62,
  detraccion: 7003.68,
  contribucionSolidaria: 0,
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
  /** null cuando es un importe fijo y no un porcentaje. */
  alicuota: number | null
  /**
   * Base sobre la que se liquidó, null en los importes fijos. Se imprime en el
   * recibo: sin esta columna, que dos conceptos con el mismo bruto den bases
   * distintas parece un error en vez de la detracción del Dto. 814/2001.
   * Opcional porque los recibos emitidos antes de incorporarla no la tienen.
   */
  base?: number | null
  monto: number
}

export type CostoLaboral = {
  contribuciones: FilaContribucion[]
  totalContribuciones: number
  /** Base remunerativa sobre la que se calcularon las contribuciones. */
  bruto: number
  /** Sumas no remunerativas: no pagan contribuciones pero las paga el consorcio. */
  noRemunerativo: number
  /** Todo lo que sale del consorcio por este trabajador. */
  costoTotal: number
}

const seguro = (valor: number) => (Number.isFinite(valor) ? valor : 0)

export function calcularCostoLaboral(
  bruto: number,
  config: ConfigCostoLaboral = CONFIG_COSTO_LABORAL_POR_DEFECTO,
  noRemunerativo = 0
): CostoLaboral {
  const base = Math.max(0, seguro(bruto))

  // Las contribuciones nacionales van sobre la base neta de detracción.
  const baseNacional = Math.max(0, base - Math.max(0, seguro(config.detraccion)))

  const porcentaje = (alicuota: number) => (base * alicuota) / 100
  const porcentajeNacional = (alicuota: number) => (baseNacional * alicuota) / 100

  // El orden define el corte en dos columnas del recibo: a la izquierda las de
  // ley y ART, a la derecha las de convenio y los importes fijos.
  const contribuciones: FilaContribucion[] = [
    {
      id: "jubilacionSipa",
      detalle: "Jubilación (SIPA)",
      alicuota: ALICUOTAS.jubilacionSipa,
      base: baseNacional,
      monto: porcentajeNacional(ALICUOTAS.jubilacionSipa),
    },
    {
      id: "inssjp",
      detalle: "INSSJP Ley 19.032",
      alicuota: ALICUOTAS.inssjp,
      base: baseNacional,
      monto: porcentajeNacional(ALICUOTAS.inssjp),
    },
    {
      id: "asignacionesFamiliares",
      detalle: "Asignaciones familiares (SUAF)",
      alicuota: ALICUOTAS.asignacionesFamiliares,
      base: baseNacional,
      monto: porcentajeNacional(ALICUOTAS.asignacionesFamiliares),
    },
    {
      id: "obraSocial",
      detalle: "Obra social",
      alicuota: ALICUOTAS.obraSocial,
      base,
      monto: porcentaje(ALICUOTAS.obraSocial),
    },
    {
      id: "artAlicuota",
      detalle: "ART · alícuota",
      alicuota: seguro(config.artAlicuota),
      base,
      monto: porcentaje(seguro(config.artAlicuota)),
    },
    {
      id: "artMontoFijo",
      detalle: "ART · suma fija",
      alicuota: null,
      base: null,
      monto: seguro(config.artMontoFijo),
    },
    {
      id: "cajaProteccionFamilia",
      detalle: "Caja protección a la familia",
      alicuota: ALICUOTAS.cajaProteccionFamilia,
      base,
      monto: porcentaje(ALICUOTAS.cajaProteccionFamilia),
    },
    {
      id: "fateryhFmvdd",
      detalle: "FATERYH (F.M.V.D.D)",
      alicuota: ALICUOTAS.fateryhFmvdd,
      base,
      monto: porcentaje(ALICUOTAS.fateryhFmvdd),
    },
    {
      id: "seracarh",
      detalle: "SERACARH",
      alicuota: ALICUOTAS.seracarh,
      base,
      monto: porcentaje(ALICUOTAS.seracarh),
    },
    {
      id: "contribucionSolidaria",
      detalle: "Contribución solidaria",
      alicuota: null,
      base: null,
      monto: Math.max(0, seguro(config.contribucionSolidaria)),
    },
    {
      id: "seguroVidaObligatorio",
      detalle: "Seguro colectivo de vida obligatorio",
      alicuota: null,
      base: null,
      monto: seguro(config.seguroVidaObligatorio),
    },
  ]

  const totalContribuciones = contribuciones.reduce((acc, fila) => acc + fila.monto, 0)

  const noRem = Math.max(0, seguro(noRemunerativo))

  return {
    contribuciones,
    totalContribuciones,
    bruto: base,
    noRemunerativo: noRem,
    costoTotal: base + noRem + totalContribuciones,
  }
}

export type ReferenciaBase = {
  /** "a", "b", … en el orden en que aparecen las bases distintas. */
  letra: string
  base: number
}

/**
 * Agrupa las bases distintas y les asigna una letra.
 *
 * En el recibo la columna de base repetía dos valores ocho veces. Con las
 * referencias la columna se reduce a una letra y los importes van una sola vez
 * al pie, que es lo que permite acomodar los once conceptos en dos columnas.
 */
export function referenciasDeBase(contribuciones: FilaContribucion[]): ReferenciaBase[] {
  const vistas: number[] = []

  for (const fila of contribuciones) {
    if (fila.base == null) continue
    if (!vistas.includes(fila.base)) vistas.push(fila.base)
  }

  return vistas.map((base, i) => ({ letra: String.fromCharCode(97 + i), base }))
}

/** Letra que le corresponde a una fila, o null si es un importe fijo. */
export function letraDeBase(
  fila: FilaContribucion,
  referencias: ReferenciaBase[]
): string | null {
  if (fila.base == null) return null
  return referencias.find((r) => r.base === fila.base)?.letra ?? null
}
