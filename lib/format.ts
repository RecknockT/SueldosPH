const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const pesosCompacto = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const numero = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 })

const seguro = (valor: number) => (Number.isFinite(valor) ? valor : 0)

/** $ 1.234.567,89 */
export const formatPesos = (valor: number) => pesos.format(seguro(valor))

/** $ 1.234.568 — para los encabezados, donde los centavos son ruido. */
export const formatPesosCompacto = (valor: number) => pesosCompacto.format(seguro(valor))

export const formatNumero = (valor: number) => numero.format(seguro(valor))
