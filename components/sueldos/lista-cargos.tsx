"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Cargo } from "@/lib/planillas"

type Props = {
  cargos: Cargo[]
  seleccionadoId: string
  onSeleccionar: (id: string) => void
}

export function ListaCargos({ cargos, seleccionadoId, onSeleccionar }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <span className="text-muted-foreground/80 px-3 text-[11px] font-bold tracking-[0.08em] uppercase">
        Cargo
      </span>

      <ScrollArea className="min-h-0 flex-1">
        <nav className="flex flex-col gap-0.5 pr-3">
          {cargos.map((cargo) => {
            const activo = cargo.id === seleccionadoId

            return (
              <button
                key={cargo.id}
                type="button"
                onClick={() => onSeleccionar(cargo.id)}
                aria-current={activo ? "true" : undefined}
                className={cn(
                  "focus-visible:ring-ring rounded-lg border-l-2 border-transparent px-3 py-2.5 text-left text-sm leading-snug transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  activo
                    ? "border-l-primary bg-primary/15 text-primary font-semibold"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                {cargo.nombre}
              </button>
            )
          })}
        </nav>
      </ScrollArea>
    </div>
  )
}
