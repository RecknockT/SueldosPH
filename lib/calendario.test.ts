import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  NOMBRES_DIA,
  calendarioDe,
  cuantosDias,
  explicarHoras,
  type DiaSemana,
} from "./calendario.ts"

const SABADO: DiaSemana = 6
const DOMINGO: DiaSemana = 0

describe("calendarioDe", () => {
  it("arma el mes completo", () => {
    const c = calendarioDe("Junio 2026")

    assert.equal(c?.dias.length, 30)
    assert.equal(c?.mes, 5)
    assert.equal(c?.anio, 2026)
  })

  it("reconoce los meses de 31 y de 28 días", () => {
    assert.equal(calendarioDe("Enero 2026")?.dias.length, 31)
    assert.equal(calendarioDe("Febrero 2026")?.dias.length, 28)
  })

  it("resuelve el febrero de un año bisiesto", () => {
    assert.equal(calendarioDe("Febrero 2024")?.dias.length, 29)
  })

  it("los días de la semana suman los días del mes", () => {
    const c = calendarioDe("Junio 2026")
    const suma = c!.porDiaSemana.reduce((a, b) => a + b, 0)

    assert.equal(suma, c!.dias.length)
  })

  it("ningún mes tiene menos de cuatro ni más de cinco de un mismo día", () => {
    for (const mes of NOMBRES_DIA.length ? [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ] : []) {
      const c = calendarioDe(`${mes} 2026`)

      for (const [dia, cantidad] of c!.porDiaSemana.entries()) {
        assert.ok(
          cantidad >= 4 && cantidad <= 5,
          `${mes} tiene ${cantidad} ${NOMBRES_DIA[dia]}`
        )
      }
    }
  })

  it("marca sábados y domingos como fin de semana", () => {
    const c = calendarioDe("Junio 2026")
    const finde = c!.dias.filter((d) => d.esFinDeSemana)

    assert.equal(finde.length, c!.porDiaSemana[SABADO] + c!.porDiaSemana[DOMINGO])
  })

  it("devuelve null si el período no se entiende", () => {
    assert.equal(calendarioDe("no es un período"), null)
    assert.equal(calendarioDe(""), null)
  })
})

describe("cuantosDias", () => {
  /**
   * Junio de 2026 arranca lunes: tiene 30 días, así que lunes y martes caen
   * cinco veces y el resto cuatro.
   */
  it("cuenta bien un mes conocido", () => {
    assert.equal(calendarioDe("Junio 2026")!.dias[0].diaSemana, 1)

    assert.equal(cuantosDias("Junio 2026", 1), 5)
    assert.equal(cuantosDias("Junio 2026", 2), 5)
    assert.equal(cuantosDias("Junio 2026", SABADO), 4)
    assert.equal(cuantosDias("Junio 2026", DOMINGO), 4)
  })

  it("devuelve cero si el período no existe", () => {
    assert.equal(cuantosDias("cualquier cosa", SABADO), 0)
  })
})

describe("explicarHoras", () => {
  it("multiplica las horas por la cantidad de días", () => {
    const r = explicarHoras("Junio 2026", SABADO, 4)

    assert.equal(r.cantidad, 4)
    assert.equal(r.total, 16)
    assert.equal(r.texto, "4 sábados × 4 hs")
  })

  it("usa el singular cuando corresponde", () => {
    const r = explicarHoras("Junio 2026", SABADO, 4)
    assert.ok(r.texto.includes("sábados"))
  })

  it("no devuelve totales negativos", () => {
    assert.equal(explicarHoras("Junio 2026", SABADO, -5).total, 0)
  })

  it("con cero horas da cero", () => {
    assert.equal(explicarHoras("Junio 2026", SABADO, 0).total, 0)
  })
})
