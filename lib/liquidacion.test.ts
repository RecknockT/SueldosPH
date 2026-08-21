import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  ADICIONALES_INICIALES,
  APORTES_INICIALES,
  ENTRADAS_INICIALES,
  calcularLiquidacion,
  parsearAjustes,
  cobraVivienda,
  type Ajuste,
  type EstadoAdicionales,
  type EstadoAportes,
  type Entradas,
  type TramoHoras,
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
  ajustes = [],
  horasFijas = [],
}: {
  cargo?: Cargo
  categoria?: 1 | 2 | 3 | 4
  entradas?: Partial<Entradas>
  adicionales?: Partial<EstadoAdicionales>
  aportes?: Partial<EstadoAportes>
  ajustes?: Ajuste[]
  horasFijas?: TramoHoras[]
} = {}) {
  return calcularLiquidacion({
    planilla: PLANILLA,
    cargo,
    categoria,
    entradas: { ...ENTRADAS_INICIALES, ...entradas },
    adicionales: { ...ADICIONALES_INICIALES, ...adicionales },
    aportes: { ...APORTES_INICIALES, ...aportes },
    ajustes,
    horasFijas,
  })
}

/** La suma remunerativa dejó de ser un campo: ahora es un ajuste del legajo. */
const sumaRem = (monto: number): Ajuste => ({
  id: "suma-rem",
  concepto: "Suma remunerativa",
  columna: "haber",
  monto,
  remunerativo: true,
})

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

  it("aplica a cada hora extra el recargo que le corresponde", () => {
    const r = liquidar({ entradas: { horas100: 3, horas50: 2 } })
    const valorHora = 1348432 / 200

    casi(r.valorHora, valorHora)
    casi(r.horasExtras, 3 * valorHora * 2 + 2 * valorHora * 1.5)
  })

  it("calcula el valor hora sobre todo lo remunerativo", () => {
    const r = liquidar({
      cargo: CON_VIVIENDA,
      entradas: { antiguedad: 5, uf: 20 },
      ajustes: [sumaRem(50000)],
      adicionales: {
        retiroResiduos: true,
        clasificacionResiduos: true,
        jardin: true,
        limpiezaCochera: true,
        movimientoAutos: true,
        viaticos: true,
        tituloEncargadoIntegral: true,
      },
    })

    // La base del valor hora es la del bruto, sin las horas extra.
    casi(r.valorHora, (r.bruto - r.horasExtras) / 200)
  })

  it("cada adicional por tarea sube el valor hora", () => {
    const sinNinguno = liquidar()

    const adicionales = [
      "jardin",
      "limpiezaCochera",
      "movimientoAutos",
      "viaticos",
      "tituloEncargadoIntegral",
    ] as const

    for (const clave of adicionales) {
      const con = liquidar({ adicionales: { [clave]: true } })

      assert.ok(
        con.valorHora > sinNinguno.valorHora,
        `${clave} debería subir el valor hora y no lo hace`
      )
    }
  })

  it("liquida la limpieza de pileta como importe fijo de la planilla", () => {
    const r = liquidar({ adicionales: { limpiezaPileta: true } })
    casi(r.totalAdicionales, 47996.6)
  })

  it("calcula la zona desfavorable sobre todo lo demás remunerativo", () => {
    const sinZona = liquidar({
      cargo: CON_VIVIENDA,
      entradas: { antiguedad: 5, uf: 20 },
      ajustes: [sumaRem(50000)],
      adicionales: { retiroResiduos: true, jardin: true, viaticos: true },
    })

    const conZona = liquidar({
      cargo: CON_VIVIENDA,
      entradas: { antiguedad: 5, uf: 20 },
      ajustes: [sumaRem(50000)],
      adicionales: {
        retiroResiduos: true,
        jardin: true,
        viaticos: true,
        zonaDesfavorable: true,
      },
    })

    // El 50% se calcula sobre la base sin el propio plus: no es circular.
    casi(conZona.bruto, sinZona.bruto * 1.5)
  })

  it("la zona desfavorable también levanta el valor hora", () => {
    const sinZona = liquidar({ adicionales: {} })
    const conZona = liquidar({ adicionales: { zonaDesfavorable: true } })

    casi(conZona.valorHora, sinZona.valorHora * 1.5)
  })

  it("imprime la zona desfavorable con su porcentaje", () => {
    const r = liquidar({ adicionales: { zonaDesfavorable: true } })
    const fila = r.haberes.find((f) => f.id === "zonaDesfavorable")

    assert.equal(fila?.detalle, "PLUS ZONA DESFAVORABLE")
    assert.equal(fila?.unidad, "50%")
  })

  it("paga la hora al 100% más que la hora al 50%", () => {
    const alCincuenta = liquidar({ entradas: { horas50: 10 } })
    const alCien = liquidar({ entradas: { horas100: 10 } })

    casi(alCien.horasExtras, (alCincuenta.horasExtras / 1.5) * 2)
    assert.ok(alCien.horasExtras > alCincuenta.horasExtras)
  })

  it("imprime cada tramo de horas extra en su propia fila", () => {
    const r = liquidar({ entradas: { horas50: 2, horas100: 3 } })
    const detalles = r.haberes.map((fila) => fila.detalle)

    assert.ok(detalles.includes("HORAS EXTRAS AL 50%"))
    assert.ok(detalles.includes("HORAS EXTRAS AL 100%"))
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

  it("respeta los aportes desactivados", () => {
    const r = liquidar({ aportes: { jubilacion: false, sindicato: false } })
    casi(r.descuentos, 1348432 * ((TOTAL_APORTES - 11 - 2) / 100))
  })

  it("trata los campos vacíos como cero", () => {
    const r = liquidar({ entradas: { antiguedad: "", horas100: "", uf: "" } })
    casi(r.bruto, 1348432)
  })
})

describe("etiquetas del recibo", () => {
  it("nombra el aporte del 0,75% como ART 27 bis, no como seguro vitalicio", () => {
    const fila = liquidar().deducciones.find((f) => f.id === "seguroVitalicio")

    assert.equal(fila?.detalle, "ART27 BIS CCT 589/10 0,75%")
  })
})

describe("detalle del recibo", () => {
  const r = liquidar({
    cargo: CON_VIVIENDA,
    entradas: { uf: 40, antiguedad: 7, horas100: 4, horas50: 3 },
    ajustes: [
      sumaRem(50000),
      {
        id: "no-rem",
        concepto: "Adicional no remunerativo",
        columna: "haber",
        monto: 20000,
        remunerativo: false,
      },
    ],
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

    casi(suma, r.totalHaberes)
    casi(total?.haber ?? 0, r.totalHaberes)
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

describe("ajustes", () => {
  const ajuste = (parcial: Partial<Ajuste>): Ajuste => ({
    id: "x",
    concepto: "Prueba",
    columna: "haber",
    monto: 100000,
    remunerativo: true,
    ...parcial,
  })

  const conAjustes = (ajustes: Ajuste[], entradas: Partial<Entradas> = {}) =>
    calcularLiquidacion({
      planilla: PLANILLA,
      cargo: SIN_VIVIENDA,
      categoria: 1,
      entradas: { ...ENTRADAS_INICIALES, ...entradas },
      adicionales: ADICIONALES_INICIALES,
      aportes: APORTES_INICIALES,
      ajustes,
    })

  const base = conAjustes([])

  it("un haber remunerativo entra al bruto y a la base de aportes", () => {
    const r = conAjustes([ajuste({})])

    casi(r.bruto, base.bruto + 100000)
    casi(r.descuentos, r.bruto * (TOTAL_APORTES / 100))
  })

  it("un haber remunerativo levanta el valor hora", () => {
    // Remunerativo y jornal son la misma cosa: no hay forma de pedir uno sin
    // el otro, que era lo que dejaba la marca vieja.
    const r = conAjustes([ajuste({ remunerativo: true })])
    casi(r.valorHora - base.valorHora, 100000 / 200)
  })

  it("un haber no remunerativo va al neto sin pagar aportes", () => {
    const r = conAjustes([ajuste({ remunerativo: false })])

    casi(r.bruto, base.bruto)
    casi(r.descuentos, base.descuentos)
    casi(r.noRemunerativo, 100000)
    casi(r.neto, base.neto + 100000)
  })

  it("un no remunerativo nunca toca el valor hora", () => {
    const r = conAjustes([ajuste({ remunerativo: false })])
    casi(r.valorHora, base.valorHora)
  })

  it("un descuento resta del neto sin tocar el bruto", () => {
    const r = conAjustes([ajuste({ columna: "descuento" })])

    casi(r.bruto, base.bruto)
    casi(r.descuentos, base.descuentos + 100000)
    casi(r.neto, base.neto - 100000)
  })

  it("varios ajustes conviven", () => {
    const r = conAjustes([
      ajuste({ id: "a", concepto: "Suma remunerativa", monto: 55000 }),
      ajuste({ id: "b", concepto: "Vacaciones", monto: 786118.84 }),
      ajuste({ id: "c", concepto: "Anticipo", columna: "descuento", monto: 200000 }),
      ajuste({ id: "d", concepto: "Viático fijo", remunerativo: false, monto: 30000 }),
    ])

    casi(r.bruto, base.bruto + 55000 + 786118.84)
    casi(r.descuentos, r.bruto * (TOTAL_APORTES / 100) + 200000)
    casi(r.noRemunerativo, 30000)
  })

  it("se imprime cada ajuste con su concepto", () => {
    const r = conAjustes([
      ajuste({ id: "a", concepto: "vacaciones", monto: 786118.84 }),
      ajuste({ id: "b", concepto: "anticipo", columna: "descuento", monto: 200000 }),
    ])

    assert.ok(r.haberes.some((f) => f.detalle === "VACACIONES"))
    assert.ok(r.deducciones.some((f) => f.detalle === "ANTICIPO"))
  })

  it("marca los no remunerativos en el recibo", () => {
    const r = conAjustes([ajuste({ concepto: "bono", remunerativo: false })])
    const fila = r.haberes.find((f) => f.detalle === "BONO")

    assert.equal(fila?.unidad, "NO REM.")
  })

  it("ignora montos negativos", () => {
    const r = conAjustes([ajuste({ monto: -500000 })])
    casi(r.bruto, base.bruto)
  })

  it("las filas siguen sumando sus totales", () => {
    const r = conAjustes(
      [
        ajuste({ id: "a", monto: 55000 }),
        ajuste({ id: "b", columna: "descuento", monto: 200000 }),
      ],
      { horas100: 10 }
    )

    const sumaHaberes = r.haberes
      .filter((f) => !f.esTotal)
      .reduce((acc, f) => acc + f.haber, 0)
    const sumaDescuentos = r.deducciones
      .filter((f) => !f.esTotal)
      .reduce((acc, f) => acc + f.descuento, 0)

    casi(sumaHaberes, r.bruto)
    casi(sumaDescuentos, r.descuentos)
  })
})

describe("horas fijas con su propia línea", () => {
  const sabados: TramoHoras = {
    id: "s",
    origen: "sábados",
    horas: 20,
    tramo: "horas100",
  }

  const domingos: TramoHoras = {
    id: "d",
    origen: "domingos",
    horas: 8,
    tramo: "horas100",
  }

  it("nombra el día en la línea del recibo", () => {
    const r = liquidar({ horasFijas: [sabados] })
    const fila = r.haberes.find((f) => f.id === "horas100-s")

    assert.equal(fila?.detalle, "HORAS EXTRAS SÁBADOS AL 100%")
    assert.equal(fila?.unidad, "20 HS")
  })

  it("una línea por regla, no un total mezclado", () => {
    const r = liquidar({ horasFijas: [sabados, domingos] })

    assert.equal(r.haberes.find((f) => f.id === "horas100-s")?.unidad, "20 HS")
    assert.equal(r.haberes.find((f) => f.id === "horas100-d")?.unidad, "8 HS")
  })

  it("las cargadas a mano quedan en su propia línea, sin día", () => {
    const r = liquidar({ entradas: { horas100: 12 }, horasFijas: [sabados] })

    assert.equal(r.haberes.find((f) => f.id === "horas100")?.detalle, "HORAS EXTRAS AL 100%")
    assert.equal(r.haberes.find((f) => f.id === "horas100")?.unidad, "12 HS")
    assert.equal(r.haberes.find((f) => f.id === "horas100-s")?.unidad, "20 HS")
  })

  it("se pagan igual que las cargadas a mano: mismo valor hora y recargo", () => {
    const juntas = liquidar({ entradas: { horas100: 32 } })
    const partidas = liquidar({ entradas: { horas100: 12 }, horasFijas: [sabados] })

    casi(partidas.horasExtras, juntas.horasExtras)
    casi(partidas.bruto, juntas.bruto)
  })

  it("las líneas partidas siguen sumando el total de haberes", () => {
    const r = liquidar({ entradas: { horas100: 12, horas50: 3 }, horasFijas: [sabados, domingos] })
    const filas = r.haberes.filter((f) => !f.esTotal)

    casi(
      filas.reduce((acc, f) => acc + f.haber, 0),
      r.totalHaberes
    )
  })

  it("no imprime una regla en cero", () => {
    const r = liquidar({ horasFijas: [{ ...sabados, horas: 0 }] })
    assert.equal(r.haberes.find((f) => f.id === "horas100-s"), undefined)
  })

  it("separa los tramos: sábados al 100% y feriados al 50% no se mezclan", () => {
    const r = liquidar({
      horasFijas: [sabados, { id: "f", origen: "feriados", horas: 6, tramo: "horas50" }],
    })

    assert.equal(r.haberes.find((f) => f.id === "horas50-f")?.detalle, "HORAS EXTRAS FERIADOS AL 50%")
    assert.equal(r.haberes.find((f) => f.id === "horas100-s")?.detalle, "HORAS EXTRAS SÁBADOS AL 100%")
  })
})

describe("el resumen del detalle cierra", () => {
  it("total haberes menos descuentos da el neto", () => {
    // Es la cuenta que muestra el diálogo de detalle: si totalHaberes no
    // incluyera lo no remunerativo, el resumen no daría el neto.
    const r = liquidar({
      entradas: { uf: 20, antiguedad: 5, horas100: 4 },
      adicionales: { retiroResiduos: true, jardin: true },
      ajustes: [
        { id: "a", concepto: "Vacaciones", columna: "haber", monto: 80000, remunerativo: true },
        { id: "b", concepto: "Viático", columna: "haber", monto: 30000, remunerativo: false },
        { id: "c", concepto: "Anticipo", columna: "descuento", monto: 50000, remunerativo: false },
      ],
    })

    assert.ok(r.noRemunerativo > 0, "el caso tiene que tener algo no remunerativo")
    casi(r.totalHaberes - r.descuentos, r.neto)
  })

  it("sin nada no remunerativo, totalHaberes es el bruto", () => {
    const r = liquidar({ entradas: { horas100: 4 } })

    casi(r.totalHaberes, r.bruto)
    casi(r.totalHaberes - r.descuentos, r.neto)
  })
})
