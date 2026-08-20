import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { componerCostoLaboral } from "./composicion-costo.ts"
import { calcularCostoLaboral } from "./costo-laboral.ts"

const SIN_COSTOS = {
  artAlicuota: 0,
  artMontoFijo: 0,
  seguroVidaObligatorio: 0,
  detraccion: 0,
  contribucionSolidaria: 0,
}

const BRUTO = 1619102.99
const DESCUENTOS = 360531.3
const NO_REM = 25000
const NETO = BRUTO - DESCUENTOS + NO_REM

const costoLaboral = calcularCostoLaboral(BRUTO, undefined, NO_REM)
const composicion = componerCostoLaboral(costoLaboral, NETO, DESCUENTOS)

const casi = (a: number, b: number) =>
  assert.ok(Math.abs(a - b) < 0.02, `esperaba ${b}, obtuve ${a.toFixed(2)}`)

describe("componerCostoLaboral", () => {
  it("los tramos suman exactamente el costo laboral total", () => {
    const suma = composicion.tramos.reduce((acc, t) => acc + t.monto, 0)

    casi(suma, composicion.total)
    casi(composicion.total, costoLaboral.costoTotal)
  })

  it("los porcentajes suman 100", () => {
    const suma = composicion.tramos.reduce((acc, t) => acc + t.porcentaje, 0)
    casi(suma, 100)
  })

  it("agrupa las contribuciones sin perder ni duplicar ninguna", () => {
    const dePatronales = composicion.tramos
      .filter((t) => t.id !== "neto" && t.id !== "aportes")
      .reduce((acc, t) => acc + t.monto, 0)

    casi(dePatronales, costoLaboral.totalContribuciones)
  })

  it("el neto y los aportes cubren el bruto más lo no remunerativo", () => {
    const neto = composicion.tramos.find((t) => t.id === "neto")
    const aportes = composicion.tramos.find((t) => t.id === "aportes")

    casi((neto?.monto ?? 0) + (aportes?.monto ?? 0), BRUTO + NO_REM)
  })

  it("deja el INSSJP fuera de seguridad social, como el modelo oficial", () => {
    const seg = composicion.tramos.find((t) => t.id === "seguridadSocial")
    const pami = composicion.tramos.find((t) => t.id === "inssjp")

    const sipaYSuaf = costoLaboral.contribuciones
      .filter((c) => c.id === "jubilacionSipa" || c.id === "asignacionesFamiliares")
      .reduce((acc, c) => acc + c.monto, 0)

    casi(seg?.monto ?? 0, sipaYSuaf)
    casi(
      pami?.monto ?? 0,
      costoLaboral.contribuciones.find((c) => c.id === "inssjp")!.monto
    )
  })

  it("junta las dos partes de ART en un solo tramo", () => {
    const art = composicion.tramos.find((t) => t.id === "art")
    const esperado = costoLaboral.contribuciones
      .filter((c) => c.id === "artAlicuota" || c.id === "artMontoFijo")
      .reduce((acc, c) => acc + c.monto, 0)

    casi(art?.monto ?? 0, esperado)
  })

  it("cada tramo lleva un color propio", () => {
    const colores = new Set(composicion.tramos.map((t) => t.color))
    assert.equal(colores.size, composicion.tramos.length)
  })
})

describe("bordes", () => {
  it("omite los tramos en cero", () => {
    const sinCosto = calcularCostoLaboral(0, SIN_COSTOS)
    const c = componerCostoLaboral(sinCosto, 1000, 0)

    assert.deepEqual(
      c.tramos.map((t) => t.id),
      ["neto"]
    )
  })

  it("no divide por cero cuando no hay nada que componer", () => {
    const vacio = calcularCostoLaboral(0, SIN_COSTOS)
    const c = componerCostoLaboral(vacio, 0, 0)

    assert.equal(c.total, 0)
    assert.deepEqual(c.tramos, [])
  })
})
