import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  CONFIG_COSTO_LABORAL_POR_DEFECTO,
  calcularCostoLaboral,
  type ClaveContribucion,
} from "./costo-laboral.ts"

/**
 * Caso de referencia: recibo real de propiedad horizontal, período 06-2026,
 * con base remunerativa de $597.700,40. Los importes son los que imprime ese
 * recibo, al centavo.
 *
 * La única línea que no se contrasta es OBRA SOCIAL: en ese recibo se liquidó
 * sobre una base especial por tratarse de un suplente, no sobre el bruto.
 */
const BASE = 597700.4

const ESPERADO: Partial<Record<ClaveContribucion, number>> = {
  jubilacionSipa: 64372.33,
  inssjp: 9503.44,
  asignacionesFamiliares: 33710.3,
  artAlicuota: 28151.69,
  cajaProteccionFamilia: 8965.51,
  fateryhFmvdd: 28390.77,
  seracarh: 2988.5,
  artMontoFijo: 1765.0,
  seguroVidaObligatorio: 424.62,
}

const casi = (a: number, b: number) =>
  assert.ok(Math.abs(a - b) < 0.02, `esperaba ${b}, obtuve ${a.toFixed(2)}`)

const resultado = calcularCostoLaboral(BASE)
const monto = (clave: ClaveContribucion) =>
  resultado.contribuciones.find((c) => c.id === clave)?.monto ?? Number.NaN

describe("calcularCostoLaboral", () => {
  it("reproduce al centavo las contribuciones del recibo real", () => {
    for (const [clave, valor] of Object.entries(ESPERADO)) {
      casi(monto(clave as ClaveContribucion), valor)
    }
  })

  it("liquida la obra social patronal al 6% del bruto", () => {
    casi(monto("obraSocial"), BASE * 0.06)
  })

  it("informa los diez conceptos del recibo", () => {
    assert.equal(resultado.contribuciones.length, 10)
  })

  it("el total es la suma de las filas", () => {
    const suma = resultado.contribuciones.reduce((acc, c) => acc + c.monto, 0)
    casi(resultado.totalContribuciones, suma)
  })

  it("el costo total es el bruto más las contribuciones", () => {
    casi(resultado.costoTotal, BASE + resultado.totalContribuciones)
  })

  it("marca como importe fijo lo que no es porcentaje", () => {
    const fijos = resultado.contribuciones.filter((c) => c.alicuota === null).map((c) => c.id)
    assert.deepEqual(fijos.sort(), ["artMontoFijo", "seguroVidaObligatorio"])
  })
})

describe("configuración por consorcio", () => {
  it("usa la alícuota de ART de la póliza", () => {
    const r = calcularCostoLaboral(BASE, {
      ...CONFIG_COSTO_LABORAL_POR_DEFECTO,
      artAlicuota: 2.5,
    })

    casi(r.contribuciones.find((c) => c.id === "artAlicuota")!.monto, BASE * 0.025)
  })

  it("usa los importes fijos configurados", () => {
    const r = calcularCostoLaboral(BASE, {
      artAlicuota: 0,
      artMontoFijo: 3000,
      seguroVidaObligatorio: 500,
    })

    casi(r.contribuciones.find((c) => c.id === "artMontoFijo")!.monto, 3000)
    casi(r.contribuciones.find((c) => c.id === "seguroVidaObligatorio")!.monto, 500)
    casi(r.contribuciones.find((c) => c.id === "artAlicuota")!.monto, 0)
  })

  it("no rompe con configuración inválida", () => {
    const r = calcularCostoLaboral(BASE, {
      artAlicuota: Number.NaN,
      artMontoFijo: Number.NaN,
      seguroVidaObligatorio: Number.NaN,
    })

    assert.ok(Number.isFinite(r.totalContribuciones))
    assert.ok(Number.isFinite(r.costoTotal))
  })
})

describe("bordes", () => {
  it("con bruto cero sólo quedan los importes fijos", () => {
    const r = calcularCostoLaboral(0)

    casi(r.totalContribuciones, 1765 + 424.62)
    casi(r.costoTotal, 1765 + 424.62)
  })

  it("trata un bruto negativo o no finito como cero", () => {
    casi(calcularCostoLaboral(-1000).costoTotal, 1765 + 424.62)
    casi(calcularCostoLaboral(Number.NaN).costoTotal, 1765 + 424.62)
  })
})
