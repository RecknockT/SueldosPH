"use client"

import { useMemo, useTransition } from "react"
import Link from "next/link"
import { Building2, Calculator, Pencil, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import { borrarLegajo } from "@/app/(app)/legajos/actions"
import { DialogoLegajo } from "@/components/legajos/dialogo-legajo"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatFecha } from "@/lib/periodos"
import { PLANILLAS, PLANILLA_POR_DEFECTO } from "@/lib/planillas"
import type { Legajo } from "@/lib/tipos"

const CARGOS = PLANILLAS[PLANILLA_POR_DEFECTO].cargos
const nombreCargo = (id: string) => CARGOS.find((c) => c.id === id)?.nombre ?? id

const SIN_CONSORCIO = "Sin consorcio asignado"

function BotonBorrar({ legajo }: { legajo: Legajo }) {
  const [borrando, iniciar] = useTransition()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Borrar ${legajo.nombre}`}>
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Borrar el legajo de {legajo.nombre}?</AlertDialogTitle>
          <AlertDialogDescription>
            Las liquidaciones ya emitidas se conservan en el historial: son el registro
            de lo que pagaste. Sólo se borra la ficha del empleado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={borrando}
            onClick={() =>
              iniciar(async () => {
                const r = await borrarLegajo(legajo.id)
                if (r.error) toast.error(r.error)
                else toast.success("Legajo borrado")
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

export function ListaLegajos({ legajos }: { legajos: Legajo[] }) {
  const porConsorcio = useMemo(() => {
    const grupos = new Map<string, Legajo[]>()

    for (const legajo of legajos) {
      const clave = legajo.consorcio_nombre?.trim() || SIN_CONSORCIO
      const actual = grupos.get(clave)
      if (actual) actual.push(legajo)
      else grupos.set(clave, [legajo])
    }

    return [...grupos.entries()]
  }, [legajos])

  if (legajos.length === 0) {
    return (
      <div className="border-border bg-card mt-6 rounded-2xl border border-dashed p-12 text-center">
        <Users className="text-muted-foreground mx-auto size-8" />
        <h2 className="mt-4 font-semibold">Todavía no hay legajos</h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-relaxed">
          Cargá a las personas que liquidás todos los meses. Después, liquidar es
          elegirlas de una lista en vez de volver a tipear todo.
        </p>
        <div className="mt-6">
          <DialogoLegajo />
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-8">
      {porConsorcio.map(([consorcio, delGrupo]) => (
        <section key={consorcio}>
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="text-muted-foreground size-4" />
            <h2 className="text-sm font-semibold">{consorcio}</h2>
            <span className="text-muted-foreground text-xs">
              {delGrupo.length} {delGrupo.length === 1 ? "empleado" : "empleados"}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {delGrupo.map((legajo) => (
              <Card key={legajo.id} className={legajo.activo ? "" : "opacity-60"}>
                <CardContent className="space-y-3 px-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{legajo.nombre}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {nombreCargo(legajo.cargo_id)} · Cat. {legajo.categoria}
                      </p>
                    </div>
                    {legajo.activo ? null : <Badge variant="secondary">Inactivo</Badge>}
                  </div>

                  <dl className="text-muted-foreground grid grid-cols-2 gap-1 text-xs">
                    <div>
                      <dt className="inline">Ingreso: </dt>
                      <dd className="tabular inline">{formatFecha(legajo.fecha_ingreso)}</dd>
                    </div>
                    <div>
                      <dt className="inline">UF: </dt>
                      <dd className="tabular inline">{legajo.uf}</dd>
                    </div>
                    {legajo.cuil ? (
                      <div className="col-span-2">
                        <dt className="inline">CUIL: </dt>
                        <dd className="tabular inline">{legajo.cuil}</dd>
                      </div>
                    ) : null}
                  </dl>

                  <div className="border-border flex items-center gap-1 border-t pt-3">
                    <Button asChild variant="ghost" size="sm" className="mr-auto">
                      <Link href="/sueldos">
                        <Calculator className="size-4" />
                        Liquidar
                      </Link>
                    </Button>

                    <DialogoLegajo
                      legajo={legajo}
                      disparador={
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar ${legajo.nombre}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />

                    <BotonBorrar legajo={legajo} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
