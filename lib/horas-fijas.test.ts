import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  FERIADOS,
  parsearHorasFijas,
  resolverHorasFijas,
  vecesEnElPeriodo,
  type HoraFija,
} from "./horas-fijas.ts"

const regla = (p: Partial<HoraFija>): HoraFija => ({
  id: "x",
  dia: 6,
  horas: 4,
  tramo: "horas100",
  ...p,
})

describe("vecesEnElPeriodo", () => {
  it("cuenta los días de la semana", () => {
    // Agosto 2026 arranca sábado: cinco sábados y cinco domingos.
    assert.equal(vecesEnElPeriodo(6, "Agosto 2026"), 5)
    assert.equal(vecesEnElPeriodo(0, "Agosto 2026"), 5)
    assert.equal(vecesEnElPeriodo(2, "Agosto 2026"), 4)
  })

  it("usa la cantidad de feriados que le pasan", () => {
    assert.equal(vecesEnElPeriodo(FERIADOS, "Agosto 2026", 1), 1)
    assert.equal(vecesEnElPeriodo(FERIADOS, "Agosto 2026", 3), 3)
  })
})

describe("resolverHorasFijas", () => {
  it("multiplica las horas por la cantidad de días", () => {
    const r = resolverHorasFijas([regla({ horas: 4 })], "Agosto 2026")

    assert.equal(r.horas100, 20)
    assert.equal(r.horas50, 0)
  })

  it("el total cambia con el período, sin tocar la regla", () => {
    const reglas = [regla({ horas: 4 })]

    // Agosto tiene cinco sábados; junio, cuatro.
    assert.equal(resolverHorasFijas(reglas, "Agosto 2026").horas100, 20)
    assert.equal(resolverHorasFijas(reglas, "Junio 2026").horas100, 16)
  })

  it("separa los dos tramos", () => {
    const r = resolverHorasFijas(
      [
        regla({ id: "a", dia: 6, horas: 4, tramo: "horas100" }),
        regla({ id: "b", dia: 1, horas: 2, tramo: "horas50" }),
      ],
      "Agosto 2026"
    )

    assert.equal(r.horas100, 20)
    assert.equal(r.horas50, 2 * vecesEnElPeriodo(1, "Agosto 2026"))
  })

  it("explica de dónde sale cada total", () => {
    const r = resolverHorasFijas([regla({ horas: 4 })], "Agosto 2026")

    assert.equal(r.detalle.length, 1)
    assert.equal(r.detalle[0].texto, "5 sábados × 4 hs")
    assert.equal(r.detalle[0].horas, 20)
  })

  it("usa el singular cuando el día cae una sola vez", () => {
    const r = resolverHorasFijas([regla({ dia: FERIADOS, horas: 8 })], "Agosto 2026", 1)
    assert.equal(r.detalle[0].texto, "1 feriado × 8 hs")
  })

  it("ignora reglas en cero o negativas", () => {
    const r = resolverHorasFijas(
      [regla({ id: "a", horas: 0 }), regla({ id: "b", horas: -4 })],
      "Agosto 2026"
    )

    assert.equal(r.horas100, 0)
    assert.deepEqual(r.detalle, [])
  })

  it("sin reglas devuelve cero", () => {
    const r = resolverHorasFijas([], "Agosto 2026")

    assert.equal(r.horas50, 0)
    assert.equal(r.horas100, 0)
  })

  it("tolera un período que no existe", () => {
    const r = resolverHorasFijas([regla({})], "no es un mes")
    assert.equal(r.horas100, 0)
  })
})

describe("parsearHorasFijas", () => {
  it("acepta el JSON del formulario", () => {
    const reglas = parsearHorasFijas(
      '[{"id":"a","dia":6,"horas":4,"tramo":"horas100"}]'
    )

    assert.deepEqual(reglas, [{ id: "a", dia: 6, horas: 4, tramo: "horas100" }])
  })

  it("acepta un array ya parseado, como el que devuelve la base", () => {
    const reglas = parsearHorasFijas([{ id: "a", dia: FERIADOS, horas: 8, tramo: "horas50" }])

    assert.equal(reglas.length, 1)
    assert.equal(reglas[0].dia, FERIADOS)
  })

  it("descarta lo que no es una regla", () => {
    assert.deepEqual(parsearHorasFijas("no soy json"), [])
    assert.deepEqual(parsearHorasFijas(null), [])
    assert.deepEqual(parsearHorasFijas('{"dia":6}'), [])
    assert.deepEqual(parsearHorasFijas('[null, 3, "x"]'), [])
  })

  it("descarta días y horas fuera de rango", () => {
    assert.deepEqual(parsearHorasFijas('[{"dia":7,"horas":4}]'), [])
    assert.deepEqual(parsearHorasFijas('[{"dia":-1,"horas":4}]'), [])
    assert.deepEqual(parsearHorasFijas('[{"dia":6,"horas":0}]'), [])
    assert.deepEqual(parsearHorasFijas('[{"dia":6,"horas":25}]'), [])
  })

  it("pone id y tramo cuando faltan, en vez de descartar la regla", () => {
    const reglas = parsearHorasFijas('[{"dia":6,"horas":4}]')

    assert.equal(reglas.length, 1)
    assert.equal(reglas[0].tramo, "horas100")
    assert.notEqual(reglas[0].id, "")
  })
})
