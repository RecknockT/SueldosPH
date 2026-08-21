"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FileText, Loader2, ReceiptText, RotateCcw, UserPlus, Zap } from "lucide-react"
import { toast } from "sonner"

import { guardarLiquidacion } from "@/app/(app)/sueldos/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { CalendarioPeriodo, TituloCalendario } from "./calendario-periodo"
import { CampoNumero } from "./campo-numero"
import { TablaAjustes } from "./tabla-ajustes"
import { DialogRecibo } from "./dialog-recibo"

import {
  CONFIG_COSTO_LABORAL_POR_DEFECTO,
  calcularCostoLaboral,
  type ConfigCostoLaboral,
} from "@/lib/costo-laboral"
import { feriadosDelPeriodo } from "@/lib/feriados"
import { formatPesos, formatPesosCompacto } from "@/lib/format"
import {
  SIN_HORAS_FIJAS,
  parsearHorasFijas,
  resolverHorasFijas,
  totalHoras,
  type HoraFija,
  type HorasResueltas,
} from "@/lib/horas-fijas"
import { aniosDeAntiguedad } from "@/lib/periodos"
import { PLANILLAS, PLANILLA_KEYS, PLANILLA_POR_DEFECTO } from "@/lib/planillas"
import type { Legajo } from "@/lib/tipos"
import { usePreferenciaLocal } from "@/lib/use-preferencia"
import {
  ADICIONALES_INICIALES,
  APORTES_INICIALES,
  CAMPOS_ADICIONAL,
  CAMPOS_APORTE,
  CAMPOS_ENTRADA,
  CATEGORIAS,
  ENTRADAS_INICIALES,
  calcularLiquidacion,
  formatPorcentaje,
  montoAdicionalDe,
  type Ajuste,
  type Categoria,
  type ClaveEntrada,
  type EstadoAdicionales,
  type EstadoAportes,
  type Entradas,
} from "@/lib/liquidacion"

const SIN_LEGAJO = "__manual__"
const CLAVE_MODO = "sueldosph:modo"

const numero = (valor: number | "") => (valor === "" ? 0 : valor)

type Empleado = {
  nombre: string
  cuil: string
  fechaIngreso: string
  consorcioNombre: string
  consorcioCuit: string
}

const EMPLEADO_VACIO: Empleado = {
  nombre: "",
  cuil: "",
  fechaIngreso: "",
  consorcioNombre: "",
  consorcioCuit: "",
}

export function PanelLiquidacion({ legajos }: { legajos: Legajo[] }) {
  const router = useRouter()
  const [guardando, iniciarGuardado] = useTransition()

  const [planillaKey, setPlanillaKey] = useState<string>(PLANILLA_POR_DEFECTO)
  const [legajoId, setLegajoId] = useState<string>(SIN_LEGAJO)
  const [cargoId, setCargoId] = useState(PLANILLAS[PLANILLA_POR_DEFECTO].cargos[0].id)
  const [categoria, setCategoria] = useState<Categoria>(1)
  const [empleado, setEmpleado] = useState<Empleado>(EMPLEADO_VACIO)
  const [entradas, setEntradas] = useState<Entradas>(ENTRADAS_INICIALES)
  const [adicionales, setAdicionales] = useState<EstadoAdicionales>(ADICIONALES_INICIALES)
  const [aportes, setAportes] = useState<EstadoAportes>(APORTES_INICIALES)
  const [ajustes, setAjustes] = useState<Ajuste[]>([])
  // Las reglas vienen del legajo; las horas son lo que dan en este período.
  const [reglasFijas, setReglasFijas] = useState<HoraFija[]>([])
  const [horasFijas, setHorasFijas] = useState<HorasResueltas>(SIN_HORAS_FIJAS)
  const [reciboAbierto, setReciboAbierto] = useState(false)
  const [configCosto, setConfigCosto] = useState<ConfigCostoLaboral>(
    CONFIG_COSTO_LABORAL_POR_DEFECTO
  )
  const [modo, setModo] = usePreferenciaLocal(CLAVE_MODO, "legajo")

  const modoRapido = modo === "rapido"

  const planilla = PLANILLAS[planillaKey]

  const cargo = useMemo(
    () => planilla.cargos.find((item) => item.id === cargoId) ?? planilla.cargos[0],
    [planilla, cargoId]
  )

  /**
   * Lo que realmente se liquida.
   *
   * Los campos de horas son del usuario y las horas fijas salen del legajo:
   * viven separados y se suman recién acá. Si las fijas se escribieran dentro
   * del campo, escribir en él las borraría.
   */
  const entradasFinales = useMemo<Entradas>(
    () => ({ ...entradas, ...totalHoras(entradas, horasFijas) }),
    [entradas, horasFijas]
  )

  const liquidacion = useMemo(
    () =>
      calcularLiquidacion({
        planilla,
        cargo,
        categoria,
        entradas: entradasFinales,
        adicionales,
        aportes,
        ajustes,
      }),
    [planilla, cargo, categoria, entradasFinales, adicionales, aportes, ajustes]
  )

  const costoLaboral = useMemo(
    () => calcularCostoLaboral(liquidacion.bruto, configCosto, liquidacion.noRemunerativo),
    [liquidacion.bruto, liquidacion.noRemunerativo, configCosto]
  )

  /**
   * La ayuda del campo dice qué se le suma.
   *
   * Sin esto el total que se liquida no coincide con lo que muestra el input y
   * la diferencia queda invisible.
   */
  const ayudaDeEntrada = (campo: (typeof CAMPOS_ENTRADA)[number]) => {
    if (campo.key === "antiguedad" && empleado.fechaIngreso) {
      return "Calculada desde la fecha de ingreso"
    }

    if (campo.key !== "horas50" && campo.key !== "horas100") return campo.ayuda

    const fijas = horasFijas[campo.key]
    if (fijas <= 0) return campo.ayuda

    return (
      <>
        +<span className="text-foreground tabular font-medium">{fijas}</span> fijas del
        legajo ={" "}
        <span className="text-foreground tabular font-medium">
          {entradasFinales[campo.key]}
        </span>{" "}
        hs
      </>
    )
  }

  const setEntrada = (key: ClaveEntrada) => (valor: number | "") =>
    setEntradas((prev) => ({ ...prev, [key]: valor }))

  /** Suma al tramo lo que calculó el calendario, sin pisar lo ya cargado. */
  const sumarHoras = (tramo: "horas50" | "horas100", horas: number) => {
    setEntradas((prev) => ({ ...prev, [tramo]: numero(prev[tramo]) + horas }))
    toast.success(`${horas} hs sumadas a horas al ${tramo === "horas50" ? "50" : "100"}%`)
  }

  const resolverEnPeriodo = (reglas: HoraFija[], periodo: string) =>
    resolverHorasFijas(reglas, periodo, feriadosDelPeriodo(periodo).length)

  const setDato = (key: keyof Empleado) => (valor: string) =>
    setEmpleado((prev) => ({ ...prev, [key]: valor }))

  /** Cargar un legajo pisa todo el formulario con sus valores habituales. */
  const elegirLegajo = (id: string) => {
    setLegajoId(id)

    if (id === SIN_LEGAJO) {
      setEmpleado(EMPLEADO_VACIO)
      setEntradas(ENTRADAS_INICIALES)
      setAdicionales(ADICIONALES_INICIALES)
      setAportes(APORTES_INICIALES)
      setConfigCosto(CONFIG_COSTO_LABORAL_POR_DEFECTO)
      setReglasFijas([])
      setHorasFijas(SIN_HORAS_FIJAS)
      return
    }

    const legajo = legajos.find((l) => l.id === id)
    if (!legajo) return

    setCargoId(legajo.cargo_id)
    setCategoria(legajo.categoria)
    setEmpleado({
      nombre: legajo.nombre,
      cuil: legajo.cuil ?? "",
      fechaIngreso: legajo.fecha_ingreso ?? "",
      consorcioNombre: legajo.consorcio_nombre ?? "",
      consorcioCuit: legajo.consorcio_cuit ?? "",
    })
    // Las horas fijas del legajo, resueltas contra el calendario del período.
    // Van aparte de las entradas: se suman al liquidar, no se cargan al campo.
    const reglas = parsearHorasFijas(legajo.horas_fijas)

    setReglasFijas(reglas)
    setHorasFijas(resolverEnPeriodo(reglas, planillaKey))

    setEntradas({
      ...ENTRADAS_INICIALES,
      uf: legajo.uf,
      adicRem: legajo.adic_rem,
      adicNoRem: legajo.adic_no_rem,
      // La antigüedad sale de la fecha de ingreso, no se carga a mano.
      antiguedad: aniosDeAntiguedad(legajo.fecha_ingreso, planillaKey),
    })
    setAdicionales({ ...ADICIONALES_INICIALES, ...legajo.adicionales })
    setAportes({ ...APORTES_INICIALES, ...legajo.aportes })
    setConfigCosto({
      artAlicuota: legajo.art_alicuota ?? CONFIG_COSTO_LABORAL_POR_DEFECTO.artAlicuota,
      artMontoFijo: legajo.art_monto_fijo ?? CONFIG_COSTO_LABORAL_POR_DEFECTO.artMontoFijo,
      seguroVidaObligatorio:
        legajo.seguro_vida ?? CONFIG_COSTO_LABORAL_POR_DEFECTO.seguroVidaObligatorio,
      detraccion: legajo.detraccion ?? CONFIG_COSTO_LABORAL_POR_DEFECTO.detraccion,
      contribucionSolidaria:
        legajo.contribucion_solidaria ??
        CONFIG_COSTO_LABORAL_POR_DEFECTO.contribucionSolidaria,
    })
  }

  const cambiarPlanilla = (valor: string) => {
    setPlanillaKey(valor)

    if (legajoId === SIN_LEGAJO) return

    // La antigüedad y las horas fijas dependen del período. Las horas fijas
    // se recalculan solas; el campo de horas no se toca, es del usuario.
    setHorasFijas(resolverEnPeriodo(reglasFijas, valor))

    if (empleado.fechaIngreso) {
      setEntradas((prev) => ({
        ...prev,
        antiguedad: aniosDeAntiguedad(empleado.fechaIngreso, valor),
      }))
    }
  }

  const reiniciar = () => {
    setPlanillaKey(PLANILLA_POR_DEFECTO)
    setLegajoId(SIN_LEGAJO)
    setCategoria(1)
    setEmpleado(EMPLEADO_VACIO)
    setEntradas(ENTRADAS_INICIALES)
    setAdicionales(ADICIONALES_INICIALES)
    setAportes(APORTES_INICIALES)
    setAjustes([])
    setReglasFijas([])
    setHorasFijas(SIN_HORAS_FIJAS)
    setReciboAbierto(false)
    toast.success("Formulario reiniciado")
  }

  const emitirRecibo = () => {
    if (!empleado.nombre.trim()) {
      toast.error("Poné el nombre del empleado para emitir el recibo")
      return
    }

    iniciarGuardado(async () => {
      const resultado = await guardarLiquidacion({
        legajoId: legajoId === SIN_LEGAJO ? null : legajoId,
        periodo: planillaKey,
        cargoId: cargo.id,
        categoria,
        entradas: entradasFinales,
        adicionales,
        aportes,
        ajustes,
        empleado: {
          nombre: empleado.nombre,
          cuil: empleado.cuil || null,
          fechaIngreso: empleado.fechaIngreso || null,
        },
        empleador: {
          nombre: empleado.consorcioNombre || null,
          cuit: empleado.consorcioCuit || null,
        },
        costoLaboral: configCosto,
      })

      if (resultado.error) {
        toast.error(resultado.error)
        return
      }

      router.push(`/recibo/${resultado.id}`)
    })
  }

  const uf = numero(entradas.uf)

  const estadisticas = [
    { label: "Total haberes", valor: formatPesos(liquidacion.bruto) },
    { label: "Descuentos", valor: `−${formatPesos(liquidacion.descuentos)}` },
    { label: "Neto a cobrar", valor: formatPesos(liquidacion.neto), destacado: true },
    {
      label: "Costo para el consorcio",
      valor: formatPesos(costoLaboral.costoTotal),
      ayuda: `Incluye ${formatPesos(costoLaboral.totalContribuciones)} de contribuciones patronales`,
    },
  ]

  const activos = legajos.filter((l) => l.activo)
  const inactivos = legajos.filter((l) => !l.activo)

  return (
    <main className="flex flex-col gap-5 px-5 pt-5 pb-10 lg:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          value={modo}
          onValueChange={(valor) => valor && setModo(valor)}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem
            value="legajo"
            className="data-[state=on]:bg-brand gap-2 px-4 data-[state=on]:border-transparent data-[state=on]:text-white"
          >
            <UserPlus className="size-4" />
            Con legajo
          </ToggleGroupItem>
          <ToggleGroupItem
            value="rapido"
            className="data-[state=on]:bg-brand gap-2 px-4 data-[state=on]:border-transparent data-[state=on]:text-white"
          >
            <Zap className="size-4" />
            Cálculo rápido
          </ToggleGroupItem>
        </ToggleGroup>

        <p className="text-muted-foreground hidden text-xs lg:block">
          {modoRapido
            ? "Calculás sin guardar nada. No se pide empleado ni queda en el historial."
            : "Elegís un legajo, se emite el recibo y queda registrado en el historial."}
        </p>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-muted-foreground text-xs font-semibold">Planilla</span>
          <Select value={planillaKey} onValueChange={cambiarPlanilla}>
            <SelectTrigger className="w-[150px]" aria-label="Planilla">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLANILLA_KEYS.map((key) => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <section className="bg-brand relative flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-2xl px-7 py-6 text-white shadow-[0_18px_40px_-18px_rgba(59,90,255,0.55)]">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(255,255,255,0.18),transparent_55%)]"
        />
        <div className="relative min-w-0">
          <span className="text-[11px] font-bold tracking-[0.09em] text-white/65 uppercase">
            Resumen de liquidación
          </span>
          <h2 className="mt-1 truncate text-xl font-bold">
            {modoRapido ? cargo.nombre : empleado.nombre || "Sin empleado"} · {planillaKey}
          </h2>
          <p className="mt-1.5 text-sm text-white/80">
            {modoRapido ? `Categoría ${categoria}` : `${cargo.nombre} · Categoría ${categoria}`}
          </p>
        </div>

        <div className="relative flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white"
          >
            Básico {formatPesosCompacto(liquidacion.sueldoBasico)}
          </Badge>

          {/* El jornal es la base de las horas extras: conviene verlo mientras
              se carga, no después. Al recibo no va. */}
          <Badge
            variant="outline"
            className="border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white"
          >
            Jornal/hora {formatPesos(liquidacion.valorHora)}
          </Badge>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {estadisticas.map((stat) => (
          <Card key={stat.label} className="gap-0 py-5">
            <CardContent className="px-5">
              <p className="text-muted-foreground text-xs">{stat.label}</p>
              <p
                className={`tabular mt-1.5 text-2xl font-bold ${stat.destacado ? "text-primary" : ""}`}
              >
                {stat.valor}
              </p>
              {stat.ayuda ? (
                <p className="text-muted-foreground/70 mt-1 text-[11px] leading-tight">
                  {stat.ayuda}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </section>

      {modoRapido ? null : (
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Empleado</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={legajoId} onValueChange={elegirLegajo}>
              <SelectTrigger className="w-[240px]" aria-label="Legajo">
                <SelectValue placeholder="Elegí un legajo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SIN_LEGAJO}>Carga manual</SelectItem>

                {activos.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>Legajos</SelectLabel>
                    {activos.map((legajo) => (
                      <SelectItem key={legajo.id} value={legajo.id}>
                        {legajo.nombre}
                        {legajo.consorcio_nombre ? ` · ${legajo.consorcio_nombre}` : ""}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null}

                {inactivos.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>Inactivos</SelectLabel>
                    {inactivos.map((legajo) => (
                      <SelectItem key={legajo.id} value={legajo.id}>
                        {legajo.nombre}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : null}
              </SelectContent>
            </Select>

            <Button asChild variant="outline" size="icon" title="Nuevo legajo">
              <Link href="/legajos" aria-label="Ir a legajos">
                <UserPlus className="size-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="emp-nombre" className="text-muted-foreground text-xs font-semibold">
              Nombre y apellido
            </Label>
            <Input
              id="emp-nombre"
              value={empleado.nombre}
              onChange={(e) => setDato("nombre")(e.target.value)}
              placeholder="Juan Pérez"
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emp-cuil" className="text-muted-foreground text-xs font-semibold">
              CUIL
            </Label>
            <Input
              id="emp-cuil"
              value={empleado.cuil}
              onChange={(e) => setDato("cuil")(e.target.value)}
              placeholder="20-12345678-9"
              className="tabular h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="emp-ingreso"
              className="text-muted-foreground text-xs font-semibold"
            >
              Fecha de ingreso
            </Label>
            <Input
              id="emp-ingreso"
              type="date"
              value={empleado.fechaIngreso}
              onChange={(e) => {
                setDato("fechaIngreso")(e.target.value)
                setEntradas((prev) => ({
                  ...prev,
                  antiguedad: aniosDeAntiguedad(e.target.value, planillaKey),
                }))
              }}
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="emp-consorcio"
              className="text-muted-foreground text-xs font-semibold"
            >
              Consorcio
            </Label>
            <Input
              id="emp-consorcio"
              value={empleado.consorcioNombre}
              onChange={(e) => setDato("consorcioNombre")(e.target.value)}
              placeholder="Av. Siempreviva 742"
              className="h-9"
            />
          </div>
        </CardContent>
      </Card>
      )}

      <section className="grid gap-5 xl:grid-cols-[1.05fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Datos de liquidación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cargo" className="text-muted-foreground text-xs font-semibold">
                  Cargo
                </Label>
                <Select value={cargo.id} onValueChange={setCargoId}>
                  <SelectTrigger id="cargo" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {planilla.cargos.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <span className="text-muted-foreground text-xs font-semibold">Categoría</span>
                <ToggleGroup
                  type="single"
                  value={String(categoria)}
                  onValueChange={(valor) => {
                    if (valor) setCategoria(Number(valor) as Categoria)
                  }}
                  variant="outline"
                  className="w-full"
                >
                  {CATEGORIAS.map((item) => (
                    <ToggleGroupItem
                      key={item}
                      value={String(item)}
                      aria-label={`Categoría ${item}`}
                      className="data-[state=on]:bg-brand flex-1 data-[state=on]:border-transparent data-[state=on]:text-white"
                    >
                      {item}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              {CAMPOS_ENTRADA.map((campo) => (
                <CampoNumero
                  key={campo.key}
                  id={`campo-${campo.key}`}
                  label={campo.label}
                  ayuda={ayudaDeEntrada(campo)}
                  value={entradas[campo.key]}
                  onChange={setEntrada(campo.key)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adicionales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {CAMPOS_ADICIONAL.map((campo) => {
              const monto = montoAdicionalDe(planilla, campo.key, liquidacion.sueldoBasico, uf)

              return (
                <div key={campo.key} className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor={`adic-${campo.key}`}
                    className="cursor-pointer text-sm font-normal"
                  >
                    <Checkbox
                      id={`adic-${campo.key}`}
                      aria-label={campo.label}
                      checked={adicionales[campo.key]}
                      onCheckedChange={(valor) =>
                        setAdicionales((prev) => ({ ...prev, [campo.key]: valor === true }))
                      }
                    />
                    {campo.label}
                  </Label>

                  <span
                    className={`tabular shrink-0 text-xs ${
                      adicionales[campo.key]
                        ? "text-foreground font-medium"
                        : "text-muted-foreground/60"
                    }`}
                  >
                    {formatPesos(monto)}
                  </span>
                </div>
              )
            })}

            {adicionales.retiroResiduos && uf === 0 ? (
              <p className="text-muted-foreground border-border mt-1 border-t pt-3 text-xs">
                El retiro de residuos se calcula por UF. Cargá la cantidad de unidades
                funcionales para que sume.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Ajustes</CardTitle>
        </CardHeader>
        <CardContent>
          <TablaAjustes ajustes={ajustes} onCambiar={setAjustes} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <TituloCalendario periodo={planillaKey} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {horasFijas.detalle.length > 0 ? (
            <div className="bg-muted/50 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold">Horas fijas del legajo</p>
              <ul className="text-muted-foreground mt-1 space-y-0.5 text-xs">
                {horasFijas.detalle.map((linea) => (
                  <li key={linea.id}>
                    {linea.texto} ={" "}
                    <span className="text-foreground tabular font-medium">
                      {linea.horas} hs
                    </span>{" "}
                    al {linea.tramo === "horas50" ? "50" : "100"}%
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground mt-1.5 text-xs">
                Se suman a lo que cargues en Horas al 50% y al 100%, y se
                recalculan al cambiar de período.
              </p>
            </div>
          ) : null}

          <CalendarioPeriodo periodo={planillaKey} onSumarHoras={sumarHoras} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Aportes y contribuciones</CardTitle>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={reiniciar}>
              <RotateCcw className="size-4" />
              Reiniciar
            </Button>

            <Button
              variant={modoRapido ? "default" : "outline"}
              className={modoRapido ? "bg-brand" : undefined}
              onClick={() => setReciboAbierto(true)}
            >
              <ReceiptText className="size-4" />
              Ver detalle
            </Button>

            {modoRapido ? null : (
              <Button className="bg-brand" onClick={emitirRecibo} disabled={guardando}>
                {guardando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileText className="size-4" />
                )}
                Guardar y emitir recibo
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {CAMPOS_APORTE.map((campo) => (
            <Label
              key={campo.key}
              htmlFor={`aporte-${campo.key}`}
              className="cursor-pointer text-sm font-normal"
            >
              <Checkbox
                id={`aporte-${campo.key}`}
                aria-label={campo.label}
                checked={aportes[campo.key]}
                onCheckedChange={(valor) =>
                  setAportes((prev) => ({ ...prev, [campo.key]: valor === true }))
                }
              />
              <span className="min-w-0">
                {campo.label}{" "}
                <span className="text-muted-foreground">
                  {formatPorcentaje(planilla.aportes[campo.key])}
                </span>
              </span>
            </Label>
          ))}
        </CardContent>
      </Card>

      <DialogRecibo
        abierto={reciboAbierto}
        onOpenChange={setReciboAbierto}
        liquidacion={liquidacion}
        cargo={cargo.nombre}
        categoria={categoria}
        planilla={planillaKey}
      />
    </main>
  )
}
