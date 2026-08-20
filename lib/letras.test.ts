import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { enteroEnLetras, pesosEnLetras } from "./letras.ts"

describe("enteroEnLetras", () => {
  it("resuelve los casos chicos", () => {
    assert.equal(enteroEnLetras(0), "cero")
    assert.equal(enteroEnLetras(1), "uno")
    assert.equal(enteroEnLetras(15), "quince")
    assert.equal(enteroEnLetras(21), "veintiuno")
    assert.equal(enteroEnLetras(31), "treinta y uno")
    assert.equal(enteroEnLetras(90), "noventa")
  })

  it("distingue cien de ciento", () => {
    assert.equal(enteroEnLetras(100), "cien")
    assert.equal(enteroEnLetras(101), "ciento uno")
    assert.equal(enteroEnLetras(115), "ciento quince")
    assert.equal(enteroEnLetras(200), "doscientos")
    assert.equal(enteroEnLetras(500), "quinientos")
  })

  it("apocopa el uno delante de mil y millones", () => {
    assert.equal(enteroEnLetras(1000), "mil")
    assert.equal(enteroEnLetras(21000), "veintiún mil")
    assert.equal(enteroEnLetras(31000), "treinta y un mil")
    assert.equal(enteroEnLetras(1_000_000), "un millón")
    assert.equal(enteroEnLetras(2_000_000), "dos millones")
  })

  it("arma montos de liquidación reales", () => {
    assert.equal(enteroEnLetras(1348432), "un millón trescientos cuarenta y ocho mil cuatrocientos treinta y dos")
    assert.equal(enteroEnLetras(965838), "novecientos sesenta y cinco mil ochocientos treinta y ocho")
  })
})

describe("pesosEnLetras", () => {
  it("escribe el importe como va en el recibo", () => {
    assert.equal(pesosEnLetras(1500.5), "Pesos mil quinientos con 50/100")
    assert.equal(pesosEnLetras(0), "Pesos cero con 00/100")
  })

  it("redondea los centavos sin desbordar a 100/100", () => {
    assert.equal(pesosEnLetras(1234.999), "Pesos mil doscientos treinta y cinco con 00/100")
    assert.equal(pesosEnLetras(1234.994), "Pesos mil doscientos treinta y cuatro con 99/100")
  })

  it("tolera valores no finitos", () => {
    assert.equal(pesosEnLetras(Number.NaN), "Pesos cero con 00/100")
  })
})
