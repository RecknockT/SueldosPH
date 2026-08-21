import type { Cargo, Planilla } from "./planillas"

export const CATEGORIAS = [1, 2, 3, 4] as const
export type Categoria = (typeof CATEGORIAS)[number]

/** Horas mensuales usadas para derivar el valor hora del sueldo. */
const HORAS_MENSUALES = 200

/**
 * Recargo de las horas extra sobre el valor hora.
 *
 * Se carga por recargo, no por día: al 50% la hora se paga 1,5 veces y al 100%
 * el doble. Las horas de sábado o feriado se cargan en el campo que corresponda
 * según el recargo que les aplique, sin necesidad de un campo por día.
 */
const MULTIPLICADOR_HORA_50 = 1.5
const MULTIPLICADOR_HORA_100 = 2

/** Cargos que cobran el plus de antigüedad reducido (media jornada y equivalentes). */
export const CARGOS_PLUS_ANTIGUEDAD_REDUCIDO = [
  "Ayudante Media jornada",
  "Personal Vigilancia Media Jornada",
  "Ayudante Temporario Media Jornada",
  "Suplentes fijos",
  "Jornalizados",
]

export type ClaveAdicional =
  | "clasificacionResiduos"
  | "retiroResiduos"
  | "jardin"
  | "limpiezaCochera"
  | "movimientoAutos"
  | "viaticos"
  | "limpiezaPileta"
  | "tituloEncargadoIntegral"
  | "zonaDesfavorable"

export type ClaveAporte =
  | "jubilacion"
  | "inssjp"
  | "sindicato"
  | "obraSocial"
  | "cajaProteccionFamilia"
  | "fmvdd"
  | "seguroVitalicio"

export type ClaveEntrada =
  | "uf"
  | "antiguedad"
  | "horas50"
  | "horas100"

/** Valores numéricos que carga el usuario. Se permite "" para poder vaciar el campo. */
export type Entradas = Record<ClaveEntrada, number | "">

export type EstadoAdicionales = Record<ClaveAdicional, boolean>
export type EstadoAportes = Record<ClaveAporte, boolean>

export const ENTRADAS_INICIALES: Entradas = {
  uf: 0,
  antiguedad: 0,
  horas50: 0,
  horas100: 0,
}

export const ADICIONALES_INICIALES: EstadoAdicionales = {
  clasificacionResiduos: false,
  retiroResiduos: false,
  jardin: false,
  limpiezaCochera: false,
  movimientoAutos: false,
  viaticos: false,
  limpiezaPileta: false,
  tituloEncargadoIntegral: false,
  zonaDesfavorable: false,
}

export const APORTES_INICIALES: EstadoAportes = {
  jubilacion: true,
  inssjp: true,
  sindicato: true,
  obraSocial: true,
  cajaProteccionFamilia: true,
  fmvdd: true,
  seguroVitalicio: true,
}

export const CAMPOS_ENTRADA: {
  key: ClaveEntrada
  label: string
  ayuda: string
}[] = [
  { key: "uf", label: "UF", ayuda: "Unidades funcionales" },
  { key: "antiguedad", label: "Antigüedad", ayuda: "Años cumplidos" },
  { key: "horas50", label: "Horas al 50%", ayuda: "Se pagan a 1,5 veces el valor hora" },
  { key: "horas100", label: "Horas al 100%", ayuda: "Se pagan al doble del valor hora" },
]

export const CAMPOS_ADICIONAL: {
  key: ClaveAdicional
  label: string
  detalle: string
}[] = [
  {
    key: "clasificacionResiduos",
    label: "Clasificación de residuos",
    detalle: "CLASIF. RESIDUOS",
  },
  { key: "retiroResiduos", label: "Retiro de residuos", detalle: "RETIRO RESIDUOS" },
  { key: "jardin", label: "Jardín", detalle: "JARDÍN" },
  { key: "limpiezaCochera", label: "Limpieza de cochera", detalle: "LIMPIEZA COCHERA" },
  { key: "movimientoAutos", label: "Movimiento de autos", detalle: "MOVIMIENTO AUTOS" },
  { key: "viaticos", label: "Viáticos", detalle: "VIÁTICOS" },
  {
    key: "limpiezaPileta",
    label: "Limpieza de pileta",
    detalle: "LIMPIEZA PILETA Y MANT. DEL AGUA",
  },
  {
    key: "tituloEncargadoIntegral",
    label: "Título Encargado Integral",
    detalle: "TÍTULO ENCARGADO INTEGRAL",
  },
  {
    key: "zonaDesfavorable",
    label: "Zona desfavorable",
    detalle: "PLUS ZONA DESFAVORABLE",
  },
]

export const CAMPOS_APORTE: {
  key: ClaveAporte
  label: string
  detalle: string
}[] = [
  { key: "jubilacion", label: "Jubilatorio", detalle: "APORTE JUBILATORIO" },
  { key: "inssjp", label: "INSSJP", detalle: "INSSJP" },
  { key: "sindicato", label: "Sindicato", detalle: "CUOTA SINDICAL" },
  { key: "obraSocial", label: "Obra social", detalle: "OBRA SOCIAL" },
  {
    key: "cajaProteccionFamilia",
    label: "Caja protección a la familia",
    detalle: "CAJA PROTECCIÓN FAMILIA",
  },
  { key: "fmvdd", label: "FMVDD", detalle: "FATERYH (FMVDD)" },
  {
    // La clave queda como está: renombrarla invalidaría los aportes ya
    // guardados en los legajos y las planillas generadas.
    key: "seguroVitalicio",
    label: "ART 27 bis · CCT 589/10",
    detalle: "ART27 BIS CCT 589/10",
  },
]

/** Orden en el que los aportes se imprimen en el recibo. */
const ORDEN_RECIBO_APORTES: ClaveAporte[] = [
  "jubilacion",
  "inssjp",
  "obraSocial",
  "cajaProteccionFamilia",
  "fmvdd",
  "sindicato",
  "seguroVitalicio",
]

export type ColumnaAjuste = "haber" | "descuento"

/**
 * Línea libre de la liquidación: sumas remunerativas puntuales, vacaciones,
 * anticipos, embargos, préstamos. Todo lo que no es un concepto de la planilla.
 */
export type Ajuste = {
  id: string
  concepto: string
  columna: ColumnaAjuste
  monto: number
  /**
   * Sólo para haberes. Remunerativo es una sola cosa: paga aportes y entra al
   * valor hora. Antes eran dos marcas, lo que dejaba pedir una tercera
   * combinación —remunerativo pero fuera del jornal— que no existe.
   */
  remunerativo: boolean
}

/**
 * Tramos de horas confiables a partir de lo que manda el cliente.
 *
 * Llegan al guardar la liquidación, así que se validan antes de recalcularla
 * en el servidor: si no, cualquiera podría mandar horas negativas o un tramo
 * inventado.
 */
export function parsearTramosHoras(valor: unknown): TramoHoras[] {
  if (!Array.isArray(valor)) return []

  const tramos: TramoHoras[] = []

  for (const [i, item] of valor.entries()) {
    if (typeof item !== "object" || item === null) continue

    const { id, origen, horas, tramo } = item as Record<string, unknown>

    const cantidad = Number(horas)
    if (!Number.isFinite(cantidad) || cantidad <= 0) continue

    tramos.push({
      id: typeof id === "string" && id !== "" ? id : `tramo-${i}`,
      origen: typeof origen === "string" ? origen.trim() : "",
      horas: cantidad,
      tramo: tramo === "horas50" ? "horas50" : "horas100",
    })
  }

  return tramos
}

/**
 * Ajustes confiables a partir de algo que no lo es.
 *
 * Entra lo que devuelve la base y lo que manda el cliente al guardar: ninguno
 * de los dos está tipado de verdad, así que lo que no encaje se descarta en
 * vez de llegar al cálculo.
 */
export function parsearAjustes(valor: unknown): Ajuste[] {
  const crudo = typeof valor === "string" ? intentarJSON(valor) : valor
  if (!Array.isArray(crudo)) return []

  const ajustes: Ajuste[] = []

  for (const [i, item] of crudo.entries()) {
    if (typeof item !== "object" || item === null) continue

    const { id, concepto, columna, monto, remunerativo } = item as Record<string, unknown>

    const importe = Number(monto)
    if (!Number.isFinite(importe) || importe <= 0) continue

    const texto = typeof concepto === "string" ? concepto.trim() : ""
    if (texto === "") continue

    const esDescuento = columna === "descuento"

    ajustes.push({
      id: typeof id === "string" && id !== "" ? id : `ajuste-${i}`,
      concepto: texto,
      columna: esDescuento ? "descuento" : "haber",
      monto: importe,
      // Un descuento nunca es remunerativo; en los haberes, el default es que sí.
      remunerativo: esDescuento ? false : remunerativo !== false,
    })
  }

  return ajustes
}

function intentarJSON(texto: string): unknown {
  try {
    return JSON.parse(texto)
  } catch {
    return null
  }
}

export const AJUSTE_VACIO: Omit<Ajuste, "id"> = {
  concepto: "",
  columna: "haber",
  monto: 0,
  remunerativo: true,
}

export type FilaRecibo = {
  id: string
  detalle: string
  unidad: string
  haber: number
  descuento: number
  esTotal?: boolean
}

export type Liquidacion = {
  sueldoBasico: number
  antiguedad: number
  vivienda: number
  tituloEncargado: number
  totalAdicionales: number
  valorHora: number
  horasExtras: number
  bruto: number
  /** Lo que suma la columna del recibo: el bruto más lo no remunerativo. */
  totalHaberes: number
  descuentos: number
  noRemunerativo: number
  neto: number
  haberes: FilaRecibo[]
  deducciones: FilaRecibo[]
}

/**
 * Horas que vienen de una regla del legajo, no del campo.
 *
 * Se pasan aparte de las entradas para que el recibo pueda decir de dónde
 * salen: "20 hs los sábados" es verificable, "52 hs" no.
 */
export type TramoHoras = {
  id: string
  /** Cómo se nombra en el recibo: "sábados", "feriados". */
  origen: string
  horas: number
  tramo: "horas50" | "horas100"
}

export type ParametrosLiquidacion = {
  planilla: Planilla
  cargo: Cargo | undefined
  categoria: Categoria
  entradas: Entradas
  adicionales: EstadoAdicionales
  aportes: EstadoAportes
  ajustes?: Ajuste[]
  /** Horas fijas del legajo. Se suman a las del campo, con su propia línea. */
  horasFijas?: TramoHoras[]
}

const num = (valor: number | "") => (valor === "" ? 0 : Number(valor) || 0)

/**
 * "Planilla Salarial Mayo 2026" -> "MAYO 2026", que es como se nombra el
 * período en el recibo. El nombre completo del JSON no va impreso.
 */

export function formatPorcentaje(valor: number) {
  return `${valor.toString().replace(".", ",")}%`
}

/**
 * Un cargo cobra vivienda sólo si es "con vivienda".
 *
 * OJO: la versión anterior chequeaba `includes("vivienda")`, que también daba
 * verdadero para los cargos "sin vivienda" — justamente los que tienen básico más
 * alto porque NO reciben el beneficio.
 */
export function cobraVivienda(nombreCargo: string) {
  return nombreCargo.toLowerCase().includes("con vivienda")
}

export function sueldoBasicoDe(cargo: Cargo | undefined, categoria: Categoria) {
  return cargo?.categorias?.[String(categoria)] ?? 0
}

/** Monto de un adicional según la planilla, para mostrarlo al lado del check. */
export function montoAdicionalDe(
  planilla: Planilla,
  clave: ClaveAdicional,
  sueldoBasico: number,
  uf: number
) {
  const tabla = planilla.adicionales

  switch (clave) {
    case "clasificacionResiduos":
      return tabla.clasificacionResiduos
    case "retiroResiduos":
      return tabla.retiroResiduos * uf
    case "jardin":
      return tabla.jardin
    case "limpiezaCochera":
      return tabla.limpiezaCocheras
    case "movimientoAutos":
      return tabla.movimientoCoches
    case "viaticos":
      return tabla.viaticos
    case "limpiezaPileta":
      return tabla.limpiezaPileta
    case "zonaDesfavorable":
      // Depende del resto de la liquidación, no de un valor de tabla.
      return 0
    case "tituloEncargadoIntegral":
      return sueldoBasico * (tabla.tituloEncargadoIntegral / 100)
  }
}

export function calcularLiquidacion({
  planilla,
  cargo,
  categoria,
  entradas,
  adicionales,
  aportes,
  ajustes = [],
  horasFijas = [],
}: ParametrosLiquidacion): Liquidacion {
  const uf = num(entradas.uf)
  const anios = num(entradas.antiguedad)
  // Las horas del campo y las que salen de las reglas del legajo se pagan
  // igual; se cuentan aparte sólo para poder imprimirlas por separado.
  const tramosFijos = horasFijas
    .map((t) => ({ ...t, horas: Math.max(0, num(t.horas)) }))
    .filter((t) => t.horas > 0)

  const fijasDe = (tramo: "horas50" | "horas100") =>
    tramosFijos.filter((t) => t.tramo === tramo).reduce((acc, t) => acc + t.horas, 0)

  const horasManual100 = num(entradas.horas100)
  const horasManual50 = num(entradas.horas50)

  const horas100 = horasManual100 + fijasDe("horas100")
  const horas50 = horasManual50 + fijasDe("horas50")

  const nombreCargo = cargo?.nombre ?? ""
  const tabla = planilla.adicionales

  const sueldoBasico = sueldoBasicoDe(cargo, categoria)

  const plusAntiguedad = CARGOS_PLUS_ANTIGUEDAD_REDUCIDO.includes(nombreCargo)
    ? tabla.plusAntiguedad1
    : tabla.plusAntiguedad2
  const antiguedad = anios > 0 ? anios * plusAntiguedad : 0

  const vivienda = cobraVivienda(nombreCargo) ? tabla.valorVivienda : 0

  const tituloEncargado = adicionales.tituloEncargadoIntegral
    ? sueldoBasico * (tabla.tituloEncargadoIntegral / 100)
    : 0

  const retiroResiduos = adicionales.retiroResiduos ? tabla.retiroResiduos * uf : 0
  const clasificacionResiduos = adicionales.clasificacionResiduos
    ? tabla.clasificacionResiduos
    : 0
  const jardin = adicionales.jardin ? tabla.jardin : 0
  const limpiezaCochera = adicionales.limpiezaCochera ? tabla.limpiezaCocheras : 0
  const movimientoAutos = adicionales.movimientoAutos ? tabla.movimientoCoches : 0
  const viaticos = adicionales.viaticos ? tabla.viaticos : 0
  const limpiezaPileta = adicionales.limpiezaPileta ? tabla.limpiezaPileta : 0

  const baseSueldo = sueldoBasico + antiguedad + vivienda

  const adicionalesPorTarea =
    retiroResiduos +
    clasificacionResiduos +
    jardin +
    limpiezaCochera +
    movimientoAutos +
    viaticos +
    limpiezaPileta +
    tituloEncargado

  // Los ajustes se parten en tres: haberes remunerativos, haberes no
  // remunerativos y descuentos.
  const limpios = ajustes.map((a) => ({ ...a, monto: Math.max(0, num(a.monto)) }))
  const haberesAjuste = limpios.filter((a) => a.columna === "haber")

  const ajusteRemunerativo = haberesAjuste
    .filter((a) => a.remunerativo)
    .reduce((acc, a) => acc + a.monto, 0)

  const ajusteNoRemunerativo = haberesAjuste
    .filter((a) => !a.remunerativo)
    .reduce((acc, a) => acc + a.monto, 0)

  const ajusteDescuento = limpios
    .filter((a) => a.columna === "descuento")
    .reduce((acc, a) => acc + a.monto, 0)

  /**
   * El plus por zona desfavorable es un porcentaje sobre el total de las
   * remuneraciones, no un importe fijo, así que se calcula al final sobre todo
   * lo demás. Queda fuera de su propia base para no ser circular.
   *
   * Los ajustes remunerativos entran a la base: son remuneración como
   * cualquier otra. Antes entraba sólo la suma remunerativa, porque era un
   * campo aparte; ahora que es un ajuste más, entran todos.
   */
  const zonaDesfavorable = adicionales.zonaDesfavorable
    ? ((baseSueldo + adicionalesPorTarea + ajusteRemunerativo) *
        tabla.zonaDesfavorable) /
      100
    : 0

  const totalAdicionales = adicionalesPorTarea + zonaDesfavorable

  /**
   * El valor hora se calcula sobre todo lo remunerativo: el básico, la
   * antigüedad, la vivienda, la suma remunerativa y los adicionales por tarea.
   * Es la misma base que la del bruto, sin las horas extra.
   *
   * Antes sólo entraban retiro y clasificación de residuos, así que quien
   * cobraba jardín, cochera, movimiento de autos, viáticos o título de encargado
   * integral tenía la hora subvaluada.
   */
  const baseValorHora = baseSueldo + totalAdicionales + ajusteRemunerativo
  const valorHora = baseValorHora / HORAS_MENSUALES

  const montoHoras100 = horas100 * valorHora * MULTIPLICADOR_HORA_100
  const montoHoras50 = horas50 * valorHora * MULTIPLICADOR_HORA_50
  const horasExtras = montoHoras100 + montoHoras50

  const bruto = baseSueldo + totalAdicionales + ajusteRemunerativo + horasExtras

  let descuentos = 0
  for (const clave of ORDEN_RECIBO_APORTES) {
    if (aportes[clave]) descuentos += bruto * (planilla.aportes[clave] / 100)
  }
  // La vivienda suma como haber (integra la base de aportes) y se descuenta
  // después porque es un beneficio en especie, no efectivo.
  descuentos += vivienda + ajusteDescuento

  const noRemunerativo = ajusteNoRemunerativo

  /**
   * Lo que suma la columna de haberes del recibo.
   *
   * No es lo mismo que el bruto: el bruto es la base de aportes y
   * contribuciones, y deja afuera lo no remunerativo. Pero lo no remunerativo
   * se imprime igual —marcado "NO REM."—, así que si el total mostrara el
   * bruto la columna no cerraría.
   */
  const totalHaberes = bruto + noRemunerativo
  const neto = bruto - descuentos + noRemunerativo

  const haberes: FilaRecibo[] = [
    {
      id: "basico",
      detalle: "SUELDO BÁSICO",
      unidad: `CATEGORÍA ${categoria}`,
      haber: sueldoBasico,
      descuento: 0,
    },
  ]

  const agregarHaber = (id: string, detalle: string, unidad: string, haber: number) => {
    if (haber > 0) haberes.push({ id, detalle, unidad, haber, descuento: 0 })
  }

  agregarHaber("antiguedad", "ANTIGÜEDAD", `${anios} AÑOS`, antiguedad)
  agregarHaber("retiroResiduos", "RETIRO RESIDUOS", `${uf} UF`, retiroResiduos)
  agregarHaber("clasifResiduos", "CLASIF. RESIDUOS", "", clasificacionResiduos)
  agregarHaber("jardin", "JARDÍN", "", jardin)
  agregarHaber("limpiezaCochera", "LIMPIEZA COCHERA", "", limpiezaCochera)
  agregarHaber("movimientoAutos", "MOVIMIENTO AUTOS", "", movimientoAutos)
  agregarHaber("viaticos", "VIÁTICOS", "", viaticos)
  agregarHaber("limpiezaPileta", "LIMPIEZA PILETA Y MANT. DEL AGUA", "", limpiezaPileta)
  /**
   * Una línea por origen: las cargadas a mano y una por cada regla del legajo.
   *
   * El total pagado es el mismo, pero así el recibo dice "20 HS SÁBADOS" en
   * vez de sumar todo en un número que no se puede rastrear.
   */
  const agregarHoras = (
    id: string,
    tramo: "horas50" | "horas100",
    origen: string,
    horas: number
  ) => {
    const recargo = tramo === "horas100" ? "100" : "50"
    const multiplicador =
      tramo === "horas100" ? MULTIPLICADOR_HORA_100 : MULTIPLICADOR_HORA_50

    agregarHaber(
      id,
      origen
        ? `HORAS EXTRAS ${origen.toUpperCase()} AL ${recargo}%`
        : `HORAS EXTRAS AL ${recargo}%`,
      `${horas} HS`,
      horas * valorHora * multiplicador
    )
  }

  for (const tramo of ["horas50", "horas100"] as const) {
    agregarHoras(
      tramo,
      tramo,
      "",
      tramo === "horas50" ? horasManual50 : horasManual100
    )

    for (const fija of tramosFijos.filter((t) => t.tramo === tramo)) {
      agregarHoras(`${tramo}-${fija.id}`, tramo, fija.origen, fija.horas)
    }
  }
  agregarHaber("vivienda", "VIVIENDA", "", vivienda)
  agregarHaber("titulo", "TÍTULO ENCARGADO INTEGRAL", "", tituloEncargado)
  agregarHaber(
    "zonaDesfavorable",
    "PLUS ZONA DESFAVORABLE",
    formatPorcentaje(tabla.zonaDesfavorable),
    zonaDesfavorable
  )

  for (const ajuste of haberesAjuste) {
    agregarHaber(
      `ajuste-${ajuste.id}`,
      ajuste.concepto.trim().toUpperCase() || "AJUSTE",
      ajuste.remunerativo ? "" : "NO REM.",
      ajuste.monto
    )
  }

  haberes.push({
    id: "total-haberes",
    detalle: "TOTAL HABERES",
    unidad: "",
    haber: totalHaberes,
    descuento: 0,
    esTotal: true,
  })

  const deducciones: FilaRecibo[] = []

  for (const clave of ORDEN_RECIBO_APORTES) {
    if (!aportes[clave]) continue

    const campo = CAMPOS_APORTE.find((aporte) => aporte.key === clave)
    const pct = planilla.aportes[clave]

    deducciones.push({
      id: clave,
      detalle: `${campo?.detalle ?? clave} ${formatPorcentaje(pct)}`,
      unidad: "",
      haber: 0,
      descuento: bruto * (pct / 100),
    })
  }

  if (vivienda > 0) {
    deducciones.push({
      id: "vivienda",
      detalle: "VIVIENDA",
      unidad: "",
      haber: 0,
      descuento: vivienda,
    })
  }

  for (const ajuste of limpios.filter((a) => a.columna === "descuento")) {
    if (ajuste.monto <= 0) continue

    deducciones.push({
      id: `ajuste-${ajuste.id}`,
      detalle: ajuste.concepto.trim().toUpperCase() || "AJUSTE",
      unidad: "",
      haber: 0,
      descuento: ajuste.monto,
    })
  }

  deducciones.push({
    id: "total-descuentos",
    detalle: "TOTAL DESCUENTOS",
    unidad: "",
    haber: 0,
    descuento: descuentos,
    esTotal: true,
  })

  return {
    sueldoBasico,
    antiguedad,
    vivienda,
    tituloEncargado,
    totalAdicionales,
    valorHora,
    horasExtras,
    bruto,
    totalHaberes,
    descuentos,
    noRemunerativo,
    neto,
    haberes,
    deducciones,
  }
}
