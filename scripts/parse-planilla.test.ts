import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, it } from "node:test"

import { APORTES_POR_LEY, normalizar, parsearMonto, parsearPlanilla } from "./parse-planilla.ts"

/** Copia de las dos tablas de la página real de SUTERH, para no pegarle a la red. */
const FIXTURE = readFileSync(join(import.meta.dirname, "fixtures", "junio-2026.html"), "utf8")

const { planilla, avisos } = parsearPlanilla(FIXTURE, "Planilla Salarial Junio 2026")

describe("parsearMonto", () => {
  it("lee el formato es-AR: punto de miles, coma decimal", () => {
    assert.equal(parsearMonto("1.348.432"), 1348432)
    assert.equal(parsearMonto("2.090,70"), 2090.7)
    assert.equal(parsearMonto("51.022,00"), 51022)
  })

  it("ignora el signo de porcentaje", () => {
    assert.equal(parsearMonto("50 %"), 50)
    assert.equal(parsearMonto("10 %"), 10)
  })

  it("devuelve NaN cuando la celda no trae un número", () => {
    assert.ok(Number.isNaN(parsearMonto("")))
    assert.ok(Number.isNaN(parsearMonto("a definir")))
  })
})

describe("normalizar", () => {
  it("saca tildes, mayúsculas y espacios de más", () => {
    assert.equal(normalizar("  Personal  Asimilado Con vivienda "), "personal asimilado con vivienda")
    assert.equal(normalizar("Plus Jardín"), "plus jardin")
  })
})

describe("parsearPlanilla", () => {
  it("extrae las 21 funciones de la escala", () => {
    assert.equal(planilla.cargos.length, 21)
  })

  it("no emite avisos sobre la página actual", () => {
    assert.deepEqual(avisos, [])
  })

  it("usa nombres e ids canónicos, no los del sitio", () => {
    const cargo = planilla.cargos.find((c) => c.id === "personal_mas_una_funcion_cv")

    // El sitio publica "Personal con mas 1 Funcion con vivienda".
    assert.equal(cargo?.nombre, "Personal con más de 1 función con vivienda")
  })

  it("mantiene el nombre con la forma que espera cobraVivienda()", () => {
    const conVivienda = planilla.cargos.filter((c) =>
      c.nombre.toLowerCase().includes("con vivienda")
    )
    const sinVivienda = planilla.cargos.filter((c) =>
      c.nombre.toLowerCase().includes("sin vivienda")
    )

    assert.equal(conVivienda.length, 7)
    assert.equal(sinVivienda.length, 7)
  })

  it("lee los básicos por categoría", () => {
    const encargado = planilla.cargos.find((c) => c.id === "encargado_permanente_sv")

    assert.deepEqual(encargado?.categorias, {
      "1": 1348432,
      "2": 1292247,
      "3": 1236063,
      "4": 1123693,
    })
  })

  it("lee los jornales del pie de la escala", () => {
    assert.deepEqual(planilla.jornales, {
      personalJornalizadoHora: 11684.3,
      suplentePorDia: 51022,
    })
  })

  it("lee los doce adicionales, montos y porcentajes", () => {
    assert.deepEqual(planilla.adicionales, {
      retiroResiduos: 2090.7,
      clasificacionResiduos: 36010.5,
      valorVivienda: 7680.8,
      plusAntiguedad1: 11236.9,
      plusAntiguedad2: 22473.9,
      limpiezaCocheras: 28531.3,
      movimientoCoches: 42243.5,
      jardin: 28531.3,
      zonaDesfavorable: 50,
      tituloEncargadoIntegral: 10,
      limpiezaPileta: 47996.6,
      viaticos: 79459.8,
    })
  })

  it("completa los aportes de ley, que no vienen en la planilla", () => {
    assert.deepEqual(planilla.aportes, { ...APORTES_POR_LEY })
  })

  it("distingue los dos plus de antigüedad, que sólo difieren en el texto legal", () => {
    assert.notEqual(
      planilla.adicionales.plusAntiguedad1,
      planilla.adicionales.plusAntiguedad2
    )
  })
})

describe("fallos de parseo", () => {
  it("falla si la página no trae las dos tablas", () => {
    assert.throws(
      () => parsearPlanilla("<html><body><table></table></body></html>", "Prueba"),
      /se esperaban 2 tablas/
    )
  })

  it("falla si desaparece una función, en vez de escribir una planilla incompleta", () => {
    const mutilado = FIXTURE.replace(/Intendente/g, "Otro Cargo Nuevo")

    assert.throws(() => parsearPlanilla(mutilado, "Prueba"), /no se encontró la función/)
  })

  it("falla si un básico deja de ser legible", () => {
    const mutilado = FIXTURE.replace("1.348.432", "a convenir")

    assert.throws(() => parsearPlanilla(mutilado, "Prueba"), /ilegible/)
  })

  it("falla si desaparece un adicional", () => {
    const mutilado = FIXTURE.replace(/Valor vivienda/gi, "Otro concepto")

    assert.throws(() => parsearPlanilla(mutilado, "Prueba"), /no se encontró el adicional/)
  })
})
