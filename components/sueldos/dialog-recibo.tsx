"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { formatPesos } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { FilaRecibo, Liquidacion } from "@/lib/liquidacion"

type Props = {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  liquidacion: Liquidacion
  cargo: string
  categoria: number
  planilla: string
}

function Fila({ fila }: { fila: FilaRecibo }) {
  return (
    <TableRow className={cn(fila.esTotal && "border-t-border border-t-2")}>
      <TableCell className={cn("py-2.5", fila.esTotal && "text-foreground font-bold")}>
        {fila.detalle}
      </TableCell>
      <TableCell className="text-muted-foreground py-2.5 text-xs whitespace-nowrap">
        {fila.unidad}
      </TableCell>
      <TableCell
        className={cn("tabular py-2.5 text-right", fila.esTotal && "font-bold")}
      >
        {fila.haber ? formatPesos(fila.haber) : ""}
      </TableCell>
      <TableCell
        className={cn("tabular py-2.5 text-right", fila.esTotal && "font-bold")}
      >
        {fila.descuento ? formatPesos(fila.descuento) : ""}
      </TableCell>
    </TableRow>
  )
}

export function DialogRecibo({
  abierto,
  onOpenChange,
  liquidacion,
  cargo,
  categoria,
  planilla,
}: Props) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] gap-0 overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="text-left">
          <DialogTitle>Detalle de liquidación</DialogTitle>
          <DialogDescription>
            {cargo} · Categoría {categoria} · {planilla}
          </DialogDescription>

          {/* Las horas extras de la tabla salen de acá; sin el jornal no hay
              forma de verificarlas. */}
          {liquidacion.valorHora > 0 ? (
            <p className="border-border mt-3 inline-flex w-fit items-baseline gap-2 rounded-md border px-2.5 py-1">
              <span className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
                Jornal · hora
              </span>
              <span className="tabular text-sm font-bold">
                {formatPesos(liquidacion.valorHora)}
              </span>
            </p>
          ) : null}
        </DialogHeader>

        <Table className="mt-5 text-sm">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] tracking-wider uppercase">
                Detalle
              </TableHead>
              <TableHead className="text-[11px] tracking-wider uppercase">
                Unidad
              </TableHead>
              <TableHead className="text-right text-[11px] tracking-wider uppercase">
                Haberes
              </TableHead>
              <TableHead className="text-right text-[11px] tracking-wider uppercase">
                Descuentos
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {liquidacion.haberes.map((fila) => (
              <Fila key={`h-${fila.id}`} fila={fila} />
            ))}
            {liquidacion.deducciones.map((fila) => (
              <Fila key={`d-${fila.id}`} fila={fila} />
            ))}
          </TableBody>
        </Table>

        <Separator className="my-5" />

        <dl className="space-y-2 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Total haberes</dt>
            <dd className="tabular font-medium">
              {formatPesos(liquidacion.totalHaberes)}
            </dd>
          </div>

          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Total descuentos</dt>
            <dd className="tabular font-medium">
              −{formatPesos(liquidacion.descuentos)}
            </dd>
          </div>

          {liquidacion.noRemunerativo > 0 ? (
            <p className="text-muted-foreground text-xs">
              Incluye {formatPesos(liquidacion.noRemunerativo)} no remunerativo, que
              no paga aportes.
            </p>
          ) : null}

          <div className="border-border mt-3 flex items-baseline justify-between gap-4 border-t pt-3">
            <dt className="font-semibold">Neto a cobrar</dt>
            <dd className="tabular text-primary text-xl font-bold">
              {formatPesos(liquidacion.neto)}
            </dd>
          </div>
        </dl>
      </DialogContent>
    </Dialog>
  )
}
