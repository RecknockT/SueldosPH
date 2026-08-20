"use client"

import { useMemo, useState } from "react"
import { Menu, RotateCcw, ReceiptText } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { CampoNumero } from "./campo-numero"
import { DialogRecibo } from "./dialog-recibo"
import { ListaCargos } from "./lista-cargos"
import { Marca } from "./marca"
import { MenuUsuario } from "./menu-usuario"

import { formatPesos, formatPesosCompacto } from "@/lib/format"
import { PLANILLA_KEYS, PLANILLA_POR_DEFECTO, PLANILLAS, type PlanillaKey } from "@/lib/planillas"
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
  type Categoria,
  type ClaveEntrada,
  type EstadoAdicionales,
  type EstadoAportes,
  type Entradas,
} from "@/lib/liquidacion"

const numero = (valor: number | "") => (valor === "" ? 0 : valor)

export function PanelLiquidacion({ email }: { email: string }) {
  const [planillaKey, setPlanillaKey] = useState<PlanillaKey>(PLANILLA_POR_DEFECTO)
  const [cargoId, setCargoId] = useState(PLANILLAS[PLANILLA_POR_DEFECTO].cargos[0].id)
  const [categoria, setCategoria] = useState<Categoria>(1)
  const [entradas, setEntradas] = useState<Entradas>(ENTRADAS_INICIALES)
  const [adicionales, setAdicionales] = useState<EstadoAdicionales>(ADICIONALES_INICIALES)
  const [aportes, setAportes] = useState<EstadoAportes>(APORTES_INICIALES)
  const [reciboAbierto, setReciboAbierto] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)

  const planilla = PLANILLAS[planillaKey]

  // Si el cargo elegido no existe en la planilla nueva, se cae al primero.
  const cargo = useMemo(
    () => planilla.cargos.find((item) => item.id === cargoId) ?? planilla.cargos[0],
    [planilla, cargoId]
  )

  const liquidacion = useMemo(
    () => calcularLiquidacion({ planilla, cargo, categoria, entradas, adicionales, aportes }),
    [planilla, cargo, categoria, entradas, adicionales, aportes]
  )

  const setEntrada = (key: ClaveEntrada) => (valor: number | "") =>
    setEntradas((prev) => ({ ...prev, [key]: valor }))

  const seleccionarCargo = (id: string) => {
    setCargoId(id)
    setMenuAbierto(false)
  }

  const reiniciar = () => {
    setPlanillaKey(PLANILLA_POR_DEFECTO)
    setCategoria(1)
    setEntradas(ENTRADAS_INICIALES)
    setAdicionales(ADICIONALES_INICIALES)
    setAportes(APORTES_INICIALES)
    setReciboAbierto(false)
    toast.success("Formulario reiniciado")
  }

  const uf = numero(entradas.uf)

  const estadisticas = [
    { label: "Sueldo básico", valor: formatPesos(liquidacion.sueldoBasico) },
    { label: "Total haberes", valor: formatPesos(liquidacion.bruto) },
    { label: "Descuentos", valor: `−${formatPesos(liquidacion.descuentos)}` },
    {
      label: "Neto a cobrar",
      valor: formatPesos(liquidacion.neto),
      destacado: true,
    },
  ]

  const barraLateral = (
    <>
      <Marca />
      <ListaCargos
        cargos={planilla.cargos}
        seleccionadoId={cargo.id}
        onSeleccionar={seleccionarCargo}
      />
    </>
  )

  return (
    <div className="bg-background flex min-h-dvh">
      <aside className="bg-sidebar border-sidebar-border hidden w-[286px] shrink-0 flex-col gap-6 border-r py-6 lg:flex">
        {barraLateral}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/70 border-border sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-5 py-4 backdrop-blur-md lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="bg-sidebar flex w-[286px] flex-col gap-6 py-6"
              >
                <SheetTitle className="sr-only">Cargos</SheetTitle>
                {barraLateral}
              </SheetContent>
            </Sheet>

            <div className="min-w-0">
              <span className="text-muted-foreground hidden text-[11px] font-bold tracking-[0.09em] uppercase sm:block">
                Panel de liquidación
              </span>
              <h1 className="truncate text-base font-bold tracking-tight sm:text-xl">
                {cargo.nombre}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Select
              value={planillaKey}
              onValueChange={(valor) => setPlanillaKey(valor as PlanillaKey)}
            >
              <SelectTrigger className="w-[128px] sm:w-[150px]" aria-label="Planilla">
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

            <MenuUsuario email={email} />
          </div>
        </header>

        <main className="flex flex-col gap-5 px-5 pt-5 pb-10 lg:px-8">
          <section className="bg-brand relative flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-2xl px-7 py-6 text-white shadow-[0_18px_40px_-18px_rgba(59,90,255,0.55)]">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(255,255,255,0.18),transparent_55%)]"
            />
            <div className="relative">
              <span className="text-[11px] font-bold tracking-[0.09em] text-white/65 uppercase">
                Resumen de liquidación
              </span>
              <h2 className="mt-1 text-xl font-bold">
                Categoría {categoria} · {planillaKey}
              </h2>
              <p className="mt-1.5 text-sm text-white/80">
                Los totales se recalculan al instante. Abrí el recibo para ver el detalle.
              </p>
            </div>

            <Badge
              variant="outline"
              className="relative border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white"
            >
              Básico {formatPesosCompacto(liquidacion.sueldoBasico)}
            </Badge>
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
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.05fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Datos de liquidación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <span className="text-muted-foreground text-xs font-semibold">
                    Categoría
                  </span>
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
                        Cat. {item}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {CAMPOS_ENTRADA.map((campo) => (
                    <CampoNumero
                      key={campo.key}
                      id={`campo-${campo.key}`}
                      label={campo.label}
                      ayuda={campo.ayuda}
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
                  const monto = montoAdicionalDe(
                    planilla,
                    campo.key,
                    liquidacion.sueldoBasico,
                    uf
                  )

                  return (
                    <div
                      key={campo.key}
                      className="flex items-center justify-between gap-3"
                    >
                      <Label
                        htmlFor={`adic-${campo.key}`}
                        className="cursor-pointer text-sm font-normal"
                      >
                        <Checkbox
                          id={`adic-${campo.key}`}
                          aria-label={campo.label}
                          checked={adicionales[campo.key]}
                          onCheckedChange={(valor) =>
                            setAdicionales((prev) => ({
                              ...prev,
                              [campo.key]: valor === true,
                            }))
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
            <CardHeader className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Aportes y contribuciones</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={reiniciar}>
                  <RotateCcw className="size-4" />
                  Reiniciar
                </Button>
                <Button className="bg-brand" onClick={() => setReciboAbierto(true)}>
                  <ReceiptText className="size-4" />
                  Ver recibo
                </Button>
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
        </main>
      </div>

      <DialogRecibo
        abierto={reciboAbierto}
        onOpenChange={setReciboAbierto}
        liquidacion={liquidacion}
        cargo={cargo.nombre}
        categoria={categoria}
        planilla={planillaKey}
      />
    </div>
  )
}
