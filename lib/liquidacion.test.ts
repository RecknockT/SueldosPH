import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  ADICIONALES_INICIALES,
  APORTES_INICIALES,
  ENTRADAS_INICIALES,
  calcularLiquidacion,
  cobraVivienda,
  type EstadoAdicionales,
  type EstadoAportes,
  type Entradas,
} from "./liquidacion.ts"
import type { Cargo, Planilla } from "./planillas.ts"

/** Valores de la planilla Junio 2026, para no depender del JSON en los tests. */
const PLANILLA: Planilla = {
  nombre: "Planilla de prueba",
  cargos: [],
  jornales: { personalJornalizadoHora: 11684.3, suplentePorDia: 51022 },
  adicionales: {
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
  },
  aportes: {
    jubilacion: 11,
    inssjp: 3,
    sindicato: 2,
    obraSocial: 3,
    cajaProteccionFamilia: 1,
    fmvdd: 1,
    seguroVitalicio: 0.75,
  },
}

const SIN_VIVIENDA: Cargo = {
  id: "encargado_permanente_sv",
  nombre: "Encargado Permanente sin vivienda",
  categorias: { "1": 1348432, "2": 1292247, "3": 1236063, "4": 1123693 },
}

const CON_VIVIENDA: Cargo = {
  id: "encargado_permanente_cv",
  nombre: "Encargado Permanente con vivienda",
  categorias: { "1": 1173930, "2": 1125017, "3": 1076103, "4": 978275 },
}

const MEDIA_JORNADA: Cargo = {
  id: "ayudante_media_jornada",
  nombre: "Ayudante Media jornada",
  categorias: { "1": 674216, "2": 646124, "3": 618031, "4": 561847 },
}

const TOTAL_APORTES = 11 + 3 + 3 + 1 + 1 + 2 + 0.75 // 21,75%

function liquidar({
  cargo = SIN_VIVIENDA,
  categoria = 1 as const,
  entradas = {},
  adicionales = {},
  aportes = {},
}: {
  cargo?: Cargo
  categoria?: 1 | 2 | 3 | 4
  entradas?: Partial<Entradas>
  adicionales?: Partial<EstadoAdicionales>
  aportes?: Partial<EstadoAportes>
} = {}) {
  return calcularLiquidacion({
    planilla: PLANILLA,
    cargo,
    categoria,
    entradas: { ...ENTRADAS_INICIALES, ...entradas },
    adicionales: { ...ADICIONALES_INICIALES, ...adicionales },
    aportes: { ...APORTES_INICIALES, ...aportes },
  })
}

const casi = (a: number, b: number, mensaje?: string) =>
  assert.ok(
    Math.abs(a - b) < 0.005,
    mensaje ?? `esperaba ${b}, obtuve ${a} (diferencia ${Math.abs(a - b)})`
  )

describe("cobraVivienda", () => {
  it("sólo reconoce los cargos 'con vivienda'", () => {
    assert.equal(cobraVivienda("Encargado Permanente con vivienda"), true)
    assert.equal(cobraVivienda("Encargado Permanente sin vivienda"), false)
    assert.equal(cobraVivienda("Intendente"), false)
  })
})

describe("calcularLiquidacion", () => {
  it("liquida el básico con todos los aportes activos", () => {
    const r = liquidar()

    casi(r.sueldoBasico, 1348432)
    casi(r.bruto, 1348432)
    casi(r.descuentos, 1348432 * (TOTAL_APORTES / 100))
    casi(r.neto, 1348432 * (1 - TOTAL_APORTES / 100))
    casi(r.vivienda, 0)
  })

  it("toma el básico de la categoría elegida", () => {
    casi(liquidar({ categoria: 4 }).sueldoBasico, 1123693)
  })

  it("suma vivienda como haber y la descuenta como beneficio en especie", () => {
    const r = liquidar({ cargo: CON_VIVIENDA })

    casi(r.vivienda, 7680.8)
    casi(r.bruto, 1173930 + 7680.8)
    casi(r.descuentos, r.bruto * (TOTAL_APORTES / 100) + 7680.8)
  })

  it("usa el plus de antigüedad reducido en los cargos de media jornada", () => {
    casi(liquidar({ cargo: MEDIA_JORNADA, entradas: { antiguedad: 5 } }).antiguedad, 5 * 11236.9)
    casi(liquidar({ entradas: { antiguedad: 5 } }).antiguedad, 5 * 22473.9)
  })

  it("calcula las horas extra sobre el valor hora, al 100% en ambos casos", () => {
    const r = liquidar({ entradas: { horas100: 3, horas50: 2 } })
    const valorHora = 1348432 / 200

    casi(r.valorHora, valorHora)
    casi(r.horasExtras, 3 * valorHora * 2 + 2 * valorHora * 2)
  })

  it("liquida el retiro de residuos por unidad funcional", () => {
    const r = liquidar({
      entradas: { uf: 40 },
      adicionales: { retiroResiduos: true },
    })

    casi(r.totalAdicionales, 2090.7 * 40)
  })

  it("calcula el título de encargado integral como porcentaje del básico", () => {
    const r = liquidar({ adicionales: { tituloEncargadoIntegral: true } })
    casi(r.tituloEncargado, 1348432 * 0.1)
  })

  it("deja el adicional no remunerativo fuera de la base de aportes", () => {
    const base = liquidar()
    const conNoRem = liquidar({ entradas: { adicNoRem: 100000 } })

    casi(conNoRem.bruto, base.bruto)
    casi(conNoRem.descuentos, base.descuentos)
    casi(conNoRem.neto, base.neto + 100000)
  })

  it("respeta los aportes desactivados", () => {
    const r = liquidar({ aportes: { jubilacion: false, sindicato: false } })
    casi(r.descuentos, 1348432 * ((TOTAL_APORTES - 11 - 2) / 100))
  })

  it("trata los campos vacíos como cero", () => {
    const r = liquidar({ entradas: { antiguedad: "", horas100: "", uf: "" } })
    casi(r.bruto, 1348432)
  })
})

describe("detalle del recibo", () => {
  const r = liquidar({
    cargo: CON_VIVIENDA,
    entradas: { uf: 40, antiguedad: 7, horas100: 4, horas50: 3, adicRem: 50000, adicNoRem: 20000 },
    adicionales: {
      retiroResiduos: true,
      clasificacionResiduos: true,
      jardin: true,
      viaticos: true,
      tituloEncargadoIntegral: true,
    },
  })

  it("las filas de haberes suman exactamente el total de haberes", () => {
    const filas = r.haberes.filter((fila) => !fila.esTotal)
    const suma = filas.reduce((acc, fila) => acc + fila.haber, 0)
    const total = r.haberes.find((fila) => fila.esTotal)

    casi(suma, r.bruto)
    casi(total?.haber ?? 0, r.bruto)
  })

  it("las filas de descuentos suman exactamente el total de descuentos", () => {
    const filas = r.deducciones.filter((fila) => !fila.esTotal)
    const suma = filas.reduce((acc, fila) => acc + fila.descuento, 0)
    const total = r.deducciones.find((fila) => fila.esTotal)

    casi(suma, r.descuentos)
    casi(total?.descuento ?? 0, r.descuentos)
  })

  it("el neto cierra con bruto, descuentos y no remunerativo", () => {
    casi(r.neto, r.bruto - r.descuentos + r.noRemunerativo)
  })

  it("no imprime filas en cero", () => {
    const sinAdicionales = liquidar()
    const ids = sinAdicionales.haberes.map((fila) => fila.id)

    assert.deepEqual(ids, ["basico", "total-haberes"])
  })
})
