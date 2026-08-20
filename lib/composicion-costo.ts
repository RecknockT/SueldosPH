import type { CostoLaboral } from "./costo-laboral"

/**
 * Composición del costo laboral para el gráfico del recibo.
 *
 * El Decreto 407/2026 pide agrupar los conceptos que paga el empleador por
 * fuera del sueldo neto, cada uno con su porcentaje sobre el costo total.
 *
 * Los tramos suman exactamente el costo total:
 *   neto + aportes del trabajador = bruto + no remunerativo
 *   más las contribuciones patronales = costo total
 */

export type TramoCosto = {
  id: string
  etiqueta: string
  monto: number
  /** Porcentaje sobre el costo laboral total. */
  porcentaje: number
  color: string
}

/** Paleta fija: tiene que imprimirse legible también en blanco y negro. */
const COLORES = {
  neto: "#0e9fd8",
  aportes: "#7fc9e8",
  seguridadSocial: "#2f4b7c",
  inssjp: "#3f8a7a",
  obraSocial: "#665191",
  art: "#d45087",
  convenio: "#f5a623",
  seguroVida: "#a05195",
}

export type ComposicionCosto = {
  tramos: TramoCosto[]
  total: number
}

export function componerCostoLaboral(
  costoLaboral: CostoLaboral,
  neto: number,
  aportesTrabajador: number
): ComposicionCosto {
  const monto = (ids: string[]) =>
    costoLaboral.contribuciones
      .filter((c) => ids.includes(c.id))
      .reduce((acc, c) => acc + c.monto, 0)

  const crudos = [
    { id: "neto", etiqueta: "Sueldo neto", monto: neto, color: COLORES.neto },
    {
      id: "aportes",
      etiqueta: "Aportes del trabajador",
      monto: aportesTrabajador,
      color: COLORES.aportes,
    },
    {
      // Sin el INSSJP: va como familia propia, igual que en el modelo oficial.
      id: "seguridadSocial",
      etiqueta: "Seguridad social",
      monto: monto(["jubilacionSipa", "asignacionesFamiliares"]),
      color: COLORES.seguridadSocial,
    },
    {
      id: "inssjp",
      etiqueta: "INSSJP",
      monto: monto(["inssjp"]),
      color: COLORES.inssjp,
    },
    {
      id: "obraSocial",
      etiqueta: "Obra social",
      monto: monto(["obraSocial"]),
      color: COLORES.obraSocial,
    },
    {
      id: "art",
      etiqueta: "ART",
      monto: monto(["artAlicuota", "artMontoFijo"]),
      color: COLORES.art,
    },
    {
      id: "convenio",
      etiqueta: "Convenio y sindicales",
      monto: monto([
        "cajaProteccionFamilia",
        "fateryhFmvdd",
        "seracarh",
        "contribucionSolidaria",
      ]),
      color: COLORES.convenio,
    },
    {
      id: "seguroVida",
      etiqueta: "Seguro de vida",
      monto: monto(["seguroVidaObligatorio"]),
      color: COLORES.seguroVida,
    },
  ]

  const total = crudos.reduce((acc, t) => acc + t.monto, 0)

  const tramos: TramoCosto[] = crudos
    .filter((t) => t.monto > 0)
    .map((t) => ({ ...t, porcentaje: total > 0 ? (t.monto / total) * 100 : 0 }))

  return { tramos, total }
}
