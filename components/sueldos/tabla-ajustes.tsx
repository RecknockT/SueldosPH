"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { InputNumero } from "@/components/input-numero"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatPesos } from "@/lib/format"
import { AJUSTE_VACIO, type Ajuste, type ColumnaAjuste } from "@/lib/liquidacion"

/**
 * Líneas libres de la liquidación.
 *
 * Cubre lo que no es un concepto de la planilla: sumas remunerativas puntuales,
 * vacaciones, anticipos, embargos, préstamos. Cada línea decide si va como
 * haber o descuento, si integra la base de aportes, y si entra al valor hora.
 */
export function TablaAjustes({
  ajustes,
  onCambiar,
}: {
  ajustes: Ajuste[]
  onCambiar: (ajustes: Ajuste[]) => void
}) {
  const [borrador, setBorrador] = useState<Omit<Ajuste, "id">>(AJUSTE_VACIO)

  const puedeAgregar = borrador.concepto.trim() !== "" && borrador.monto > 0

  const agregar = () => {
    if (!puedeAgregar) return

    onCambiar([
      ...ajustes,
      { ...borrador, id: `${Date.now()}-${ajustes.length}` },
    ])
    setBorrador(AJUSTE_VACIO)
  }

  const quitar = (id: string) => onCambiar(ajustes.filter((a) => a.id !== id))

  const esHaber = borrador.columna === "haber"

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_140px_150px_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="aj-concepto" className="text-muted-foreground text-xs font-semibold">
            Concepto
          </Label>
          <Input
            id="aj-concepto"
            value={borrador.concepto}
            onChange={(e) => setBorrador((p) => ({ ...p, concepto: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                agregar()
              }
            }}
            placeholder="Vacaciones, anticipo, suma remunerativa…"
            className="h-9"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="aj-columna" className="text-muted-foreground text-xs font-semibold">
            Columna
          </Label>
          <Select
            value={borrador.columna}
            onValueChange={(v) =>
              setBorrador((p) => ({
                ...p,
                columna: v as ColumnaAjuste,
                // Las marcas sólo tienen sentido en los haberes.
                noRemunerativo: v === "haber" ? p.noRemunerativo : false,
                sumaAlJornal: v === "haber" ? p.sumaAlJornal : false,
              }))
            }
          >
            <SelectTrigger id="aj-columna" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="haber">Haber</SelectItem>
              <SelectItem value="descuento">Descuento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="aj-monto" className="text-muted-foreground text-xs font-semibold">
            Monto
          </Label>
          <InputNumero
            id="aj-monto"
            min={0}
            step="any"
            value={borrador.monto || ""}
            onChange={(e) =>
              setBorrador((p) => ({ ...p, monto: Number(e.target.value) || 0 }))
            }
            onFocus={(e) => e.target.select()}
            className="h-9"
          />
        </div>

        <Button type="button" variant="outline" onClick={agregar} disabled={!puedeAgregar}>
          <Plus className="size-4" />
          Agregar
        </Button>
      </div>

      {esHaber ? (
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Label htmlFor="aj-jornal" className="cursor-pointer text-sm font-normal">
            <Checkbox
              id="aj-jornal"
              checked={borrador.sumaAlJornal && !borrador.noRemunerativo}
              disabled={borrador.noRemunerativo}
              onCheckedChange={(v) =>
                setBorrador((p) => ({ ...p, sumaAlJornal: v === true }))
              }
            />
            Suma al sueldo jornal
          </Label>

          <Label htmlFor="aj-norem" className="cursor-pointer text-sm font-normal">
            <Checkbox
              id="aj-norem"
              checked={borrador.noRemunerativo}
              onCheckedChange={(v) =>
                setBorrador((p) => ({ ...p, noRemunerativo: v === true }))
              }
            />
            No remunerativo
          </Label>

          <p className="text-muted-foreground text-xs">
            {borrador.noRemunerativo
              ? "No paga aportes y no entra al valor hora."
              : borrador.sumaAlJornal
                ? "Paga aportes y levanta el valor hora."
                : "Paga aportes pero no levanta el valor hora."}
          </p>
        </div>
      ) : null}

      {ajustes.length > 0 ? (
        <ul className="border-border divide-border divide-y rounded-lg border">
          {ajustes.map((ajuste) => (
            <li
              key={ajuste.id}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{ajuste.concepto}</p>
                <p className="text-muted-foreground text-xs">
                  {ajuste.columna === "haber" ? "Haber" : "Descuento"}
                  {ajuste.columna === "haber"
                    ? ajuste.noRemunerativo
                      ? " · no remunerativo"
                      : ajuste.sumaAlJornal
                        ? " · suma al jornal"
                        : " · no suma al jornal"
                    : ""}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`tabular text-sm font-semibold ${
                    ajuste.columna === "descuento" ? "text-destructive" : ""
                  }`}
                >
                  {ajuste.columna === "descuento" ? "−" : ""}
                  {formatPesos(ajuste.monto)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Quitar ${ajuste.concepto}`}
                  onClick={() => quitar(ajuste.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          Sin ajustes. Usalos para lo que no está en la planilla: vacaciones,
          suplencias, anticipos, embargos.
        </p>
      )}
    </div>
  )
}
