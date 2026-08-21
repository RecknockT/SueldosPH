"use client"

import { useMemo, useState } from "react"
import { CalendarDays, Plus } from "lucide-react"

import { InputNumero } from "@/components/input-numero"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  NOMBRES_DIA,
  calendarioDe,
  explicarHoras,
  resumenMes,
  type DiaSemana,
} from "@/lib/calendario"
import { diasFeriadosDelPeriodo, hayDatosDelPeriodo } from "@/lib/feriados"
import { cn } from "@/lib/utils"

const INICIALES = ["D", "L", "M", "M", "J", "V", "S"]

/** Además de los siete días, se puede contar por feriado. */
const FERIADOS = "feriados"
type Seleccion = DiaSemana | typeof FERIADOS

/**
 * Calendario del período con una calculadora de horas.
 *
 * Resuelve "hace cuatro horas los sábados": en vez de contar sábados en un
 * almanaque y multiplicar a mano, se elige el día, se cargan las horas y se
 * suma al tramo que corresponda. También sirve para los feriados, que salen de
 * data/feriados.
 */
export function CalendarioPeriodo({
  periodo,
  onSumarHoras,
}: {
  periodo: string
  onSumarHoras: (tramo: "horas50" | "horas100", horas: number) => void
}) {
  const [seleccion, setSeleccion] = useState<Seleccion>(6)
  const [horasPorDia, setHorasPorDia] = useState<number | "">(0)
  const [tramo, setTramo] = useState<"horas50" | "horas100">("horas100")
  // La grilla arranca oculta: lo que se consulta seguido son los totales.
  const [grillaVisible, setGrillaVisible] = useState(false)

  const calendario = useMemo(() => calendarioDe(periodo), [periodo])
  const feriados = useMemo(() => diasFeriadosDelPeriodo(periodo), [periodo])
  const hayFeriados = hayDatosDelPeriodo(periodo)

  const resumen = useMemo(
    () => resumenMes(periodo, new Set(feriados.keys())),
    [periodo, feriados]
  )

  const cuenta = useMemo(() => {
    const horas = horasPorDia === "" ? 0 : horasPorDia

    if (seleccion === FERIADOS) {
      const cantidad = feriados.size
      return {
        cantidad,
        total: cantidad * Math.max(0, horas),
        texto: `${cantidad} ${cantidad === 1 ? "feriado" : "feriados"} × ${horas} hs`,
      }
    }

    return explicarHoras(periodo, seleccion, horas)
  }, [periodo, seleccion, horasPorDia, feriados])

  if (!calendario || !resumen) return null

  const estaResaltado = (numero: number, diaSemana: DiaSemana) =>
    seleccion === FERIADOS ? feriados.has(numero) : diaSemana === seleccion

  return (
    <div className="space-y-4">
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span>
          <span className="text-foreground font-semibold tabular">{resumen.habiles}</span>{" "}
          hábiles
        </span>
        <span>
          <span className="text-foreground font-semibold tabular">{resumen.sabados}</span>{" "}
          sábados
        </span>
        <span>
          <span className="text-foreground font-semibold tabular">{resumen.domingos}</span>{" "}
          domingos
        </span>
        <span>
          <span className="text-foreground font-semibold tabular">{resumen.feriados}</span>{" "}
          {resumen.feriados === 1 ? "feriado" : "feriados"}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          aria-expanded={grillaVisible}
          onClick={() => setGrillaVisible((v) => !v)}
        >
          <CalendarDays className="size-3.5" />
          {grillaVisible ? "Ocultar calendario" : "Mostrar calendario"}
        </Button>
      </div>

      {grillaVisible ? (
      <div>
        <div className="text-muted-foreground mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold">
          {INICIALES.map((inicial, i) => (
            <span key={i}>{inicial}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: calendario.huecoInicial }, (_, i) => (
            <span key={`hueco-${i}`} />
          ))}

          {calendario.dias.map((dia) => {
            const feriado = feriados.get(dia.numero)

            return (
              <span
                key={dia.numero}
                title={feriado?.nombre}
                className={cn(
                  "tabular relative flex h-7 items-center justify-center rounded text-xs",
                  estaResaltado(dia.numero, dia.diaSemana)
                    ? "bg-brand font-semibold text-white"
                    : dia.esFinDeSemana
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground"
                )}
              >
                {dia.numero}
                {feriado ? (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute bottom-0.5 size-1 rounded-full",
                      estaResaltado(dia.numero, dia.diaSemana)
                        ? "bg-white"
                        : "bg-primary"
                    )}
                  />
                ) : null}
              </span>
            )
          })}
        </div>

        {feriados.size > 0 ? (
          <ul className="text-muted-foreground mt-3 space-y-0.5 text-xs">
            {[...feriados.entries()].map(([numero, feriado]) => (
              <li key={numero}>
                <span className="text-foreground tabular font-medium">{numero}</span>{" "}
                {feriado.nombre}
              </li>
            ))}
          </ul>
        ) : null}

        {hayFeriados ? null : (
          <p className="text-muted-foreground mt-3 text-xs">
            No hay feriados cargados para ese año. Corré{" "}
            <code className="bg-muted rounded px-1 py-0.5">npm run sync:feriados</code>.
          </p>
        )}
      </div>
      ) : null}

      <div className="border-border space-y-3 border-t pt-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cal-dia" className="text-muted-foreground text-xs font-semibold">
              Contar por
            </Label>
            <Select
              value={String(seleccion)}
              onValueChange={(v) =>
                setSeleccion(v === FERIADOS ? FERIADOS : (Number(v) as DiaSemana))
              }
            >
              <SelectTrigger id="cal-dia" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Día de la semana</SelectLabel>
                  {NOMBRES_DIA.map((nombre, i) => (
                    <SelectItem key={nombre} value={String(i)}>
                      <span className="capitalize">{nombre}</span>
                      <span className="text-muted-foreground ml-1">
                        ({calendario.porDiaSemana[i]})
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectSeparator />
                <SelectItem value={FERIADOS}>
                  Feriados
                  <span className="text-muted-foreground ml-1">({feriados.size})</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="cal-horas"
              className="text-muted-foreground text-xs font-semibold"
            >
              Horas por día
            </Label>
            <InputNumero
              id="cal-horas"
              min={0}
              step="any"
              value={horasPorDia}
              onChange={(e) => {
                const raw = e.target.value
                setHorasPorDia(raw === "" ? "" : Number(raw))
              }}
              onFocus={(e) => e.target.select()}
              className="h-9"
            />
          </div>
        </div>

        <div className="bg-muted/50 flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-2">
          <p className="text-sm">
            <span className="text-muted-foreground">{cuenta.texto} = </span>
            <span className="tabular font-semibold">{cuenta.total} hs</span>
          </p>

          <div className="flex items-center gap-2">
            <Select
              value={tramo}
              onValueChange={(v) => setTramo(v as "horas50" | "horas100")}
            >
              <SelectTrigger className="h-8 w-[110px]" aria-label="Recargo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="horas50">al 50%</SelectItem>
                <SelectItem value="horas100">al 100%</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={cuenta.total <= 0}
              onClick={() => onSumarHoras(tramo, cuenta.total)}
            >
              <Plus className="size-4" />
              Sumar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TituloCalendario({ periodo }: { periodo: string }) {
  return <>Horas por día · {periodo}</>
}
