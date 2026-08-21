"use client"

import { useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

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
import { NOMBRES_DIA } from "@/lib/calendario"
import { feriadosDelPeriodo } from "@/lib/feriados"
import {
  FERIADOS,
  HORA_FIJA_VACIA,
  nombreDia,
  resolverHorasFijas,
  type DiaFijo,
  type HoraFija,
} from "@/lib/horas-fijas"
import { PLANILLA_POR_DEFECTO } from "@/lib/planillas"

/**
 * Horas que el empleado hace todas las semanas.
 *
 * Se cargan una vez en el legajo —"4 horas los sábados"— y al liquidar se
 * multiplican por los sábados que tenga ese mes. Como el número final depende
 * del período, acá se muestra cuánto daría en el período vigente para que no
 * quede en abstracto.
 */
export function TablaHorasFijas({ iniciales }: { iniciales: HoraFija[] }) {
  const [reglas, setReglas] = useState<HoraFija[]>(iniciales)
  const [borrador, setBorrador] = useState<Omit<HoraFija, "id">>(HORA_FIJA_VACIA)

  const periodo = PLANILLA_POR_DEFECTO

  const previa = useMemo(
    () => resolverHorasFijas(reglas, periodo, feriadosDelPeriodo(periodo).length),
    [reglas, periodo]
  )

  const total = previa.horas50 + previa.horas100

  const agregar = () => {
    if (borrador.horas <= 0) return

    setReglas((prev) => [...prev, { ...borrador, id: `${Date.now()}-${prev.length}` }])
    setBorrador(HORA_FIJA_VACIA)
  }

  const quitar = (id: string) => setReglas((prev) => prev.filter((r) => r.id !== id))

  const detallePorId = new Map(previa.detalle.map((d) => [d.id, d]))

  return (
    <div className="space-y-3">
      {/* El formulario del legajo es un form nativo: las reglas viajan como JSON. */}
      <input type="hidden" name="horas_fijas" value={JSON.stringify(reglas)} />

      <div className="grid gap-3 sm:grid-cols-[1fr_110px_130px_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hf-dia" className="text-muted-foreground text-xs font-semibold">
            Día
          </Label>
          <Select
            value={String(borrador.dia)}
            onValueChange={(v) =>
              setBorrador((p) => ({
                ...p,
                dia: (v === FERIADOS ? FERIADOS : Number(v)) as DiaFijo,
              }))
            }
          >
            <SelectTrigger id="hf-dia" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Día de la semana</SelectLabel>
                {NOMBRES_DIA.map((nombre, i) => (
                  <SelectItem key={nombre} value={String(i)}>
                    <span className="capitalize">{nombre}</span>
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectSeparator />
              <SelectItem value={FERIADOS}>Feriados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hf-horas" className="text-muted-foreground text-xs font-semibold">
            Horas
          </Label>
          <InputNumero
            id="hf-horas"
            min={0}
            max={24}
            step="any"
            value={borrador.horas || ""}
            onChange={(e) =>
              setBorrador((p) => ({ ...p, horas: Number(e.target.value) || 0 }))
            }
            onFocus={(e) => e.target.select()}
            className="h-9"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hf-tramo" className="text-muted-foreground text-xs font-semibold">
            Recargo
          </Label>
          <Select
            value={borrador.tramo}
            onValueChange={(v) =>
              setBorrador((p) => ({ ...p, tramo: v as HoraFija["tramo"] }))
            }
          >
            <SelectTrigger id="hf-tramo" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="horas50">al 50%</SelectItem>
              <SelectItem value="horas100">al 100%</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={agregar}
          disabled={borrador.horas <= 0}
        >
          <Plus className="size-4" />
          Agregar
        </Button>
      </div>

      {reglas.length > 0 ? (
        <>
          <ul className="border-border divide-border divide-y rounded-lg border">
            {reglas.map((regla) => {
              const detalle = detallePorId.get(regla.id)

              return (
                <li
                  key={regla.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      <span className="tabular">{regla.horas}</span> hs los{" "}
                      <span className="capitalize">{nombreDia(regla.dia)}</span>
                    </p>
                    <p className="text-muted-foreground text-xs">
                      al {regla.tramo === "horas50" ? "50" : "100"}%
                      {detalle ? ` · ${detalle.texto}` : " · no cae en este mes"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="tabular text-sm font-semibold">
                      {detalle?.horas ?? 0} hs
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Quitar ${regla.horas} hs los ${nombreDia(regla.dia)}`}
                      onClick={() => quitar(regla.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>

          <p className="text-muted-foreground text-xs">
            En {periodo} serían <span className="text-foreground font-semibold tabular">{total}</span>{" "}
            hs. El total se recalcula solo en cada período.
          </p>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          Sin horas fijas. Cargalas si la persona hace las mismas horas todas las
          semanas: al liquidar se multiplican por los días que tenga el mes.
        </p>
      )}
    </div>
  )
}
