"use client"

import { useState, useTransition } from "react"
import { AlertCircle, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { guardarLegajo } from "@/app/(app)/legajos/actions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  CAMPOS_ADICIONAL,
  CAMPOS_APORTE,
  CATEGORIAS,
  type EstadoAdicionales,
  type EstadoAportes,
} from "@/lib/liquidacion"
import { PLANILLAS, PLANILLA_POR_DEFECTO } from "@/lib/planillas"
import type { Legajo } from "@/lib/tipos"

const CARGOS = PLANILLAS[PLANILLA_POR_DEFECTO].cargos

function BotonGuardar({ enviando }: { enviando: boolean }) {
  return (
    <Button type="submit" className="bg-brand" disabled={enviando}>
      {enviando ? <Loader2 className="size-4 animate-spin" /> : null}
      Guardar legajo
    </Button>
  )
}

function Campo({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-muted-foreground text-xs font-semibold">
        {label}
      </Label>
      {children}
    </div>
  )
}

export function DialogoLegajo({
  legajo,
  disparador,
}: {
  legajo?: Legajo
  disparador?: React.ReactNode
}) {
  const [abierto, setAbierto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviando, iniciar] = useTransition()

  // Sin useActionState: el cierre del diálogo sucede en el mismo flujo del envío,
  // asi que no hace falta un efecto que observe el resultado.
  const enviar = (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const formData = new FormData(evento.currentTarget)

    iniciar(async () => {
      const resultado = await guardarLegajo(formData)

      if (resultado.error) {
        setError(resultado.error)
        return
      }

      setError(null)
      setAbierto(false)
      toast.success(legajo ? "Legajo actualizado" : "Legajo creado")
    })
  }

  const adicionales = (legajo?.adicionales ?? {}) as Partial<EstadoAdicionales>
  const aportes = (legajo?.aportes ?? {}) as Partial<EstadoAportes>

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        {disparador ?? (
          <Button className="bg-brand">
            <Plus className="size-4" />
            Nuevo legajo
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[88dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{legajo ? "Editar legajo" : "Nuevo legajo"}</DialogTitle>
          <DialogDescription>
            Los valores habituales se precargan cada vez que liquides a esta persona.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} className="space-y-6">
          {legajo ? <input type="hidden" name="id" value={legajo.id} /> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="nombre" label="Nombre y apellido">
              <Input
                id="nombre"
                name="nombre"
                defaultValue={legajo?.nombre}
                placeholder="Juan Pérez"
                required
              />
            </Campo>

            <Campo id="cuil" label="CUIL">
              <Input
                id="cuil"
                name="cuil"
                defaultValue={legajo?.cuil ?? ""}
                placeholder="20-12345678-9"
                className="tabular"
              />
            </Campo>

            <Campo id="cargo_id" label="Cargo">
              <Select name="cargo_id" defaultValue={legajo?.cargo_id ?? CARGOS[0].id}>
                <SelectTrigger id="cargo_id" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARGOS.map((cargo) => (
                    <SelectItem key={cargo.id} value={cargo.id}>
                      {cargo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>

            <Campo id="categoria" label="Categoría">
              <Select name="categoria" defaultValue={String(legajo?.categoria ?? 1)}>
                <SelectTrigger id="categoria" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={String(c)}>
                      Categoría {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>

            <Campo id="fecha_ingreso" label="Fecha de ingreso">
              <Input
                id="fecha_ingreso"
                name="fecha_ingreso"
                type="date"
                defaultValue={legajo?.fecha_ingreso ?? ""}
              />
            </Campo>

            <div className="flex items-end pb-2">
              <Label htmlFor="activo" className="cursor-pointer text-sm font-normal">
                <Checkbox
                  id="activo"
                  name="activo"
                  defaultChecked={legajo ? legajo.activo : true}
                />
                Empleado activo
              </Label>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="consorcio_nombre" label="Consorcio (empleador)">
              <Input
                id="consorcio_nombre"
                name="consorcio_nombre"
                defaultValue={legajo?.consorcio_nombre ?? ""}
                placeholder="Av. Siempreviva 742"
              />
            </Campo>

            <Campo id="consorcio_cuit" label="CUIT del consorcio">
              <Input
                id="consorcio_cuit"
                name="consorcio_cuit"
                defaultValue={legajo?.consorcio_cuit ?? ""}
                placeholder="30-12345678-9"
                className="tabular"
              />
            </Campo>
          </div>

          <Separator />

          <div>
            <p className="mb-3 text-sm font-semibold">Valores habituales</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Campo id="uf" label="UF del edificio">
                <Input
                  id="uf"
                  name="uf"
                  type="number"
                  min={0}
                  step="any"
                  defaultValue={legajo?.uf ?? 0}
                  className="tabular"
                />
              </Campo>

              <Campo id="adic_rem" label="Adic. remunerativo">
                <Input
                  id="adic_rem"
                  name="adic_rem"
                  type="number"
                  min={0}
                  step="any"
                  defaultValue={legajo?.adic_rem ?? 0}
                  className="tabular"
                />
              </Campo>

              <Campo id="adic_no_rem" label="Adic. no remunerativo">
                <Input
                  id="adic_no_rem"
                  name="adic_no_rem"
                  type="number"
                  min={0}
                  step="any"
                  defaultValue={legajo?.adic_no_rem ?? 0}
                  className="tabular"
                />
              </Campo>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold">Adicionales por tarea</p>
              <div className="space-y-2.5">
                {CAMPOS_ADICIONAL.map((campo) => (
                  <Label
                    key={campo.key}
                    htmlFor={`adic-${campo.key}`}
                    className="cursor-pointer text-sm font-normal"
                  >
                    <Checkbox
                      id={`adic-${campo.key}`}
                      name={`adic-${campo.key}`}
                      aria-label={campo.label}
                      defaultChecked={adicionales[campo.key] ?? false}
                    />
                    {campo.label}
                  </Label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold">Aportes</p>
              <div className="space-y-2.5">
                {CAMPOS_APORTE.map((campo) => (
                  <Label
                    key={campo.key}
                    htmlFor={`aporte-${campo.key}`}
                    className="cursor-pointer text-sm font-normal"
                  >
                    <Checkbox
                      id={`aporte-${campo.key}`}
                      name={`aporte-${campo.key}`}
                      aria-label={campo.label}
                      defaultChecked={aportes[campo.key] ?? true}
                    />
                    {campo.label}
                  </Label>
                ))}
              </div>
            </div>
          </div>

          <Campo id="notas" label="Notas">
            <Textarea
              id="notas"
              name="notas"
              defaultValue={legajo?.notas ?? ""}
              placeholder="Lo que quieras recordar de este legajo"
              rows={2}
            />
          </Campo>

          {error ? (
            <p
              role="alert"
              className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm"
            >
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <BotonGuardar enviando={enviando} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
