"use client"

import { useMemo, useState } from "react"
import { CalendarDays, Plus } from "lucide-react"

import { InputNumero } from "@/components/input-numero"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  NOMBRES_DIA,
  calendarioDe,
  explicarHoras,
  type DiaSemana,
} from "@/lib/calendario"
import { cn } from "@/lib/utils"

const INICIALES = ["D", "L", "M", "M", "J", "V", "S"]

/**
 * Calendario del período con una calculadora de horas por día de la semana.
 *
 * Resuelve el caso concreto de "hace cuatro horas los sábados": en vez de
 * contar sábados en un almanaque y multiplicar a mano, se elige el día, se
 * cargan las horas y se suma al tramo que corresponda.
 */
export function CalendarioPeriodo({
  periodo,
  onSumarHoras,
}: {
  periodo: string
  onSumarHoras: (tramo: "horas50" | "horas100", horas: number) => void
}) {
  const [diaSemana, setDiaSemana] = useState<DiaSemana>(6)
  const [horasPorDia, setHorasPorDia] = useState<number | "">(0)
  const [tramo, setTramo] = useState<"horas50" | "horas100">("horas100")

  const calendario = useMemo(() => calendarioDe(periodo), [periodo])

  const cuenta = useMemo(
    () => explicarHoras(periodo, diaSemana, horasPorDia === "" ? 0 : horasPorDia),
    [periodo, diaSemana, horasPorDia]
  )

  if (!calendario) return null

  return (
    <div className="space-y-4">
      <div>
        <div className="text-muted-foreground mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold">
          {INICIALES.map((inicial, i) => (
            <span key={i} className={i === 0 || i === 6 ? "text-primary" : undefined}>
              {inicial}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: calendario.huecoInicial }, (_, i) => (
            <span key={`hueco-${i}`} />
          ))}

          {calendario.dias.map((dia) => (
            <span
              key={dia.numero}
              className={cn(
                "tabular flex h-7 items-center justify-center rounded text-xs",
                dia.diaSemana === diaSemana
                  ? "bg-brand font-semibold text-white"
                  : dia.esFinDeSemana
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground"
              )}
            >
              {dia.numero}
            </span>
          ))}
        </div>
      </div>

      <div className="border-border space-y-3 border-t pt-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="cal-dia"
              className="text-muted-foreground text-xs font-semibold"
            >
              Día de la semana
            </Label>
            <Select
              value={String(diaSemana)}
              onValueChange={(v) => setDiaSemana(Number(v) as DiaSemana)}
            >
              <SelectTrigger id="cal-dia" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOMBRES_DIA.map((nombre, i) => (
                  <SelectItem key={nombre} value={String(i)}>
                    <span className="capitalize">{nombre}</span>
                    <span className="text-muted-foreground ml-1">
                      ({calendario.porDiaSemana[i]})
                    </span>
                  </SelectItem>
                ))}
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
  return (
    <span className="flex items-center gap-2">
      <CalendarDays className="text-muted-foreground size-4" />
      Calendario de {periodo}
    </span>
  )
}
