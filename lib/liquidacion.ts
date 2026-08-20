import type { Cargo, Planilla } from "./planillas"

export const CATEGORIAS = [1, 2, 3, 4] as const
export type Categoria = (typeof CATEGORIAS)[number]

/** Horas mensuales usadas para derivar el valor hora del sueldo. */
const HORAS_MENSUALES = 200

/**
 * Las dos cargas de horas extra se liquidan al 100% (x2).
 *
 * OJO: la versión anterior sumaba x2 al total pero imprimía x1,5 en la fila de
 * "sábados", así que el detalle nunca cerraba con su propio total. Acá se unificó
 * en x2. Si el multiplicador correcto para sábados fuese 1,5, alcanza con cambiar
 * esta constante y queda consistente en total y detalle.
 */
const MULTIPLICADOR_HORA_100 = 2
const MULTIPLICADOR_HORA_50 = 2

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
  | "tituloEncargadoIntegral"

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
  | "horas100"
  | "horas50"
  | "adicRem"
  | "adicNoRem"

/** Valores numéricos que carga el usuario. Se permite "" para poder vaciar el campo. */
export type Entradas = Record<ClaveEntrada, number | "">

export type EstadoAdicionales = Record<ClaveAdicional, boolean>
export type EstadoAportes = Record<ClaveAporte, boolean>

export const ENTRADAS_INICIALES: Entradas = {
  uf: 0,
  antiguedad: 0,
  horas100: 0,
  horas50: 0,
  adicRem: 0,
  adicNoRem: 0,
}

export const ADICIONALES_INICIALES: EstadoAdicionales = {
  clasificacionResiduos: false,
  retiroResiduos: false,
  jardin: false,
  limpiezaCochera: false,
  movimientoAutos: false,
  viaticos: false,
  tituloEncargadoIntegral: false,
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
  { key: "horas100", label: "Horas feriados", ayuda: "Cantidad de horas al 100%" },
  { key: "horas50", label: "Horas sábados", ayuda: "Cantidad de horas al 100%" },
  { key: "adicRem", label: "Adic. remunerativo", ayuda: "Suma fija en pesos" },
  {
    key: "adicNoRem",
    label: "Adic. no remunerativo",
    ayuda: "No integra la base de aportes",
  },
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
    key: "tituloEncargadoIntegral",
    label: "Título Encargado Integral",
    detalle: "TÍTULO ENCARGADO INTEGRAL",
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
  { key: "seguroVitalicio", label: "Seguro vitalicio", detalle: "SEGURO VITALICIO" },
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
  descuentos: number
  noRemunerativo: number
  neto: number
  haberes: FilaRecibo[]
  deducciones: FilaRecibo[]
}

export type ParametrosLiquidacion = {
  planilla: Planilla
  cargo: Cargo | undefined
  categoria: Categoria
  entradas: Entradas
  adicionales: EstadoAdicionales
  aportes: EstadoAportes
}

const num = (valor: number | "") => (valor === "" ? 0 : Number(valor) || 0)

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
}: ParametrosLiquidacion): Liquidacion {
  const uf = num(entradas.uf)
  const anios = num(entradas.antiguedad)
  const horas100 = num(entradas.horas100)
  const horas50 = num(entradas.horas50)
  const adicRem = num(entradas.adicRem)
  const adicNoRem = num(entradas.adicNoRem)

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

  const totalAdicionales =
    retiroResiduos +
    clasificacionResiduos +
    jardin +
    limpiezaCochera +
    movimientoAutos +
    viaticos +
    tituloEncargado

  const baseSueldo = sueldoBasico + adicRem + antiguedad + vivienda

  // El valor hora toma el básico y los adicionales fijos, no los de tarea eventual.
  const valorHora =
    (sueldoBasico +
      antiguedad +
      retiroResiduos +
      clasificacionResiduos +
      adicRem +
      vivienda) /
    HORAS_MENSUALES

  const montoHoras100 = horas100 * valorHora * MULTIPLICADOR_HORA_100
  const montoHoras50 = horas50 * valorHora * MULTIPLICADOR_HORA_50
  const horasExtras = montoHoras100 + montoHoras50

  const bruto = baseSueldo + totalAdicionales + horasExtras

  let descuentos = 0
  for (const clave of ORDEN_RECIBO_APORTES) {
    if (aportes[clave]) descuentos += bruto * (planilla.aportes[clave] / 100)
  }
  // La vivienda suma como haber (integra la base de aportes) y se descuenta
  // después porque es un beneficio en especie, no efectivo.
  descuentos += vivienda

  const neto = bruto - descuentos + adicNoRem

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
  agregarHaber("adicRem", `SUMA REMUNERATIVA ${planilla.nombre}`, "", adicRem)
  agregarHaber("jardin", "JARDÍN", "", jardin)
  agregarHaber("limpiezaCochera", "LIMPIEZA COCHERA", "", limpiezaCochera)
  agregarHaber("movimientoAutos", "MOVIMIENTO AUTOS", "", movimientoAutos)
  agregarHaber("viaticos", "VIÁTICOS", "", viaticos)
  agregarHaber("horas100", "HORAS EXTRAS AL 100% FERIADOS", `${horas100} HS`, montoHoras100)
  agregarHaber("vivienda", "VIVIENDA", "", vivienda)
  agregarHaber("horas50", "HORAS EXTRAS AL 100% SÁBADOS", `${horas50} HS`, montoHoras50)
  agregarHaber("titulo", "TÍTULO ENCARGADO INTEGRAL", "", tituloEncargado)

  haberes.push({
    id: "total-haberes",
    detalle: "TOTAL HABERES",
    unidad: "",
    haber: bruto,
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
    descuentos,
    noRemunerativo: adicNoRem,
    neto,
    haberes,
    deducciones,
  }
}
