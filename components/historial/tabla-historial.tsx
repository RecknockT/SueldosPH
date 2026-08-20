"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { FileText, History, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { borrarLiquidacion } from "@/app/(app)/sueldos/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPesos } from "@/lib/format"
import { formatFechaHora } from "@/lib/periodos"
import type { LiquidacionGuardada } from "@/lib/tipos"

function BotonBorrar({ liquidacion }: { liquidacion: LiquidacionGuardada }) {
  const [borrando, iniciar] = useTransition()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Borrar liquidación de ${liquidacion.empleado_nombre}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Borrar esta liquidación?</AlertDialogTitle>
          <AlertDialogDescription>
            {liquidacion.empleado_nombre} · {liquidacion.periodo}. Es el registro de un
            recibo ya emitido, y no se puede recuperar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={borrando}
            onClick={() =>
              iniciar(async () => {
                const r = await borrarLiquidacion(liquidacion.id)
                if (r.error) toast.error(r.error)
                else toast.success("Liquidación borrada")
              })
            }
          >
            Borrar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function TablaHistorial({
  liquidaciones,
}: {
  liquidaciones: LiquidacionGuardada[]
}) {
  const [busqueda, setBusqueda] = useState("")

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return liquidaciones

    return liquidaciones.filter(
      (l) =>
        l.empleado_nombre.toLowerCase().includes(q) ||
        l.periodo.toLowerCase().includes(q) ||
        (l.snapshot?.empleador?.nombre ?? "").toLowerCase().includes(q)
    )
  }, [liquidaciones, busqueda])

  if (liquidaciones.length === 0) {
    return (
      <div className="border-border bg-card mt-6 rounded-2xl border border-dashed p-12 text-center">
        <History className="text-muted-foreground mx-auto size-8" />
        <h2 className="mt-4 font-semibold">Todavía no emitiste ningún recibo</h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-relaxed">
          Cada vez que guardes una liquidación va a quedar acá, con el detalle completo
          congelado tal como se emitió.
        </p>
        <div className="mt-6">
          <Button asChild className="bg-brand">
            <Link href="/sueldos">Ir a liquidar</Link>
          </Button>
        </div>
      </div>
    )
  }

  const total = filtradas.reduce((acc, l) => acc + Number(l.neto), 0)

  return (
    <div className="mt-6 space-y-4">
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por empleado, período o consorcio"
          className="pl-9"
          aria-label="Buscar liquidaciones"
        />
      </div>

      <div className="border-border overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Empleado</TableHead>
              <TableHead>Período</TableHead>
              <TableHead className="hidden md:table-cell">Consorcio</TableHead>
              <TableHead className="hidden lg:table-cell">Emitido</TableHead>
              <TableHead className="text-right">Neto</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.empleado_nombre}</TableCell>
                <TableCell>{l.periodo}</TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">
                  {l.snapshot?.empleador?.nombre ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground hidden lg:table-cell text-xs">
                  {formatFechaHora(l.created_at)}
                </TableCell>
                <TableCell className="tabular text-right font-semibold">
                  {formatPesos(Number(l.neto))}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" title="Ver recibo">
                      <Link href={`/recibo/${l.id}`} aria-label="Ver recibo">
                        <FileText className="size-4" />
                      </Link>
                    </Button>
                    <BotonBorrar liquidacion={l} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-muted-foreground text-sm">
        {filtradas.length} {filtradas.length === 1 ? "liquidación" : "liquidaciones"} ·
        neto acumulado{" "}
        <span className="tabular text-foreground font-semibold">{formatPesos(total)}</span>
      </p>
    </div>
  )
}
