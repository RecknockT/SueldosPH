import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  CONFIG_COSTO_LABORAL_POR_DEFECTO,
  calcularCostoLaboral,
  letraDeBase,
  referenciasDeBase,
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

/**
 * A ese recibo no se le aplicó detracción —es un suplente con horario por día,
 * y la del art. 4 se reduce en los contratos a tiempo parcial— ni contribución
 * solidaria, porque el empleado sí aporta cuota sindical.
 */
const resultado = calcularCostoLaboral(BASE, {
  ...CONFIG_COSTO_LABORAL_POR_DEFECTO,
  detraccion: 0,
})
const monto = (clave: ClaveContribucion) =>
  resultado.contribuciones.find((c) => c.id === clave)?.monto ?? Number.NaN

describe("calcularCostoLaboral", () => {
  it("reproduce al centavo las contribuciones del recibo real", () => {
    for (const [clave, valor] of Object.entries(ESPERADO)) {
      casi(monto(clave as ClaveContribucion), valor)
    }
  })

  it("no informa contribución solidaria cuando el empleado aporta cuota sindical", () => {
    casi(monto("contribucionSolidaria"), 0)
  })

  it("liquida la obra social patronal al 6% del bruto", () => {
    casi(monto("obraSocial"), BASE * 0.06)
  })

  it("informa los once conceptos posibles", () => {
    assert.equal(resultado.contribuciones.length, 11)
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
    assert.deepEqual(fijos.sort(), [
      "artMontoFijo",
      "contribucionSolidaria",
      "seguroVidaObligatorio",
    ])
  })
})

/**
 * Segundo caso de referencia: recibo real del período 07-2026, Encargado
 * Permanente con vivienda 2ª categoría. Trae la detracción del art. 4 del
 * Decreto 814/2001 y la contribución solidaria, y el empleado no aporta cuota
 * sindical.
 */
describe("recibo 07-2026 con detracción y contribución solidaria", () => {
  const BRUTO = 1928512.77

  const r = calcularCostoLaboral(BRUTO, {
    artAlicuota: 4.71,
    artMontoFijo: 1839,
    seguroVidaObligatorio: 424.62,
    detraccion: 7003.68,
    contribucionSolidaria: 48424,
  })

  const m = (clave: ClaveContribucion) =>
    r.contribuciones.find((c) => c.id === clave)?.monto ?? Number.NaN

  it("aplica la detracción sólo a las contribuciones nacionales", () => {
    casi(m("jubilacionSipa"), 206946.53)
    casi(m("inssjp"), 30551.99)
    casi(m("asignacionesFamiliares"), 108373.11)
  })

  it("liquida sobre el bruto completo las que no llevan detracción", () => {
    casi(m("obraSocial"), 115710.77)
    casi(m("artAlicuota"), 90832.95)
    casi(m("cajaProteccionFamilia"), 28927.69)
    casi(m("fateryhFmvdd"), 91604.36)
    casi(m("seracarh"), 9642.56)
  })

  it("informa los importes fijos del período", () => {
    casi(m("artMontoFijo"), 1839)
    casi(m("seguroVidaObligatorio"), 424.62)
    casi(m("contribucionSolidaria"), 48424)
  })

  it("cierra el total y el costo del empleador", () => {
    casi(r.totalContribuciones, 733277.58)
    casi(r.costoTotal, 2661790.35)
  })

  it("informa la base de cada línea, con la detracción donde corresponde", () => {
    const base = (clave: ClaveContribucion) =>
      r.contribuciones.find((c) => c.id === clave)?.base

    casi(base("jubilacionSipa")!, BRUTO - 7003.68)
    casi(base("inssjp")!, BRUTO - 7003.68)
    casi(base("asignacionesFamiliares")!, BRUTO - 7003.68)

    casi(base("obraSocial")!, BRUTO)
    casi(base("artAlicuota")!, BRUTO)
    casi(base("fateryhFmvdd")!, BRUTO)
  })

  it("los importes fijos no llevan base", () => {
    const sinBase = r.contribuciones.filter((c) => c.base === null).map((c) => c.id)

    assert.deepEqual(sinBase.sort(), [
      "artMontoFijo",
      "contribucionSolidaria",
      "seguroVidaObligatorio",
    ])
  })

  it("cada línea porcentual cierra: base por alícuota da el monto", () => {
    for (const fila of r.contribuciones) {
      if (fila.alicuota === null || fila.base == null) continue
      casi((fila.base * fila.alicuota) / 100, fila.monto)
    }
  })
})

describe("detracción", () => {
  it("en cero liquida todo sobre el bruto", () => {
    const r = calcularCostoLaboral(BASE, {
      ...CONFIG_COSTO_LABORAL_POR_DEFECTO,
      detraccion: 0,
    })

    casi(r.contribuciones.find((c) => c.id === "jubilacionSipa")!.monto, BASE * 0.1077)
  })

  it("nunca deja la base nacional en negativo", () => {
    const r = calcularCostoLaboral(1000, {
      ...CONFIG_COSTO_LABORAL_POR_DEFECTO,
      detraccion: 999999,
    })

    casi(r.contribuciones.find((c) => c.id === "jubilacionSipa")!.monto, 0)
    assert.ok(r.totalContribuciones >= 0)
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
      detraccion: 0,
      contribucionSolidaria: 0,
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
      detraccion: Number.NaN,
      contribucionSolidaria: Number.NaN,
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

describe("referencias de base", () => {
  const r = calcularCostoLaboral(1000000, CONFIG_COSTO_LABORAL_POR_DEFECTO)
  const refs = referenciasDeBase(r.contribuciones)

  it("agrupa las dos bases distintas en dos referencias", () => {
    assert.deepEqual(
      refs.map((x) => x.letra),
      ["a", "b"]
    )
  })

  it("la primera es la de las contribuciones nacionales", () => {
    casi(refs[0].base, 1000000 - 7003.68)
    casi(refs[1].base, 1000000)
  })

  it("cada fila porcentual recibe su letra y las fijas ninguna", () => {
    const conLetra = r.contribuciones.filter(
      (c) => letraDeBase(c, refs) !== null
    ).length
    const sinLetra = r.contribuciones.filter((c) => letraDeBase(c, refs) === null)

    assert.equal(conLetra, 8)
    assert.deepEqual(sinLetra.map((c) => c.id).sort(), [
      "artMontoFijo",
      "contribucionSolidaria",
      "seguroVidaObligatorio",
    ])
  })

  it("no genera referencias cuando no hay bases", () => {
    const sinBases = calcularCostoLaboral(0, {
      artAlicuota: 0, artMontoFijo: 100, seguroVidaObligatorio: 50,
      detraccion: 0, contribucionSolidaria: 0,
    })
    assert.deepEqual(referenciasDeBase(sinBases.contribuciones), [{ letra: "a", base: 0 }])
  })
})
