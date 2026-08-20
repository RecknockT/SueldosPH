"use client"

import Link from "next/link"
import { ArrowLeft, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"

export function BarraRecibo({ empleado, periodo }: { empleado: string; periodo: string }) {
  return (
    <div className="no-imprimir border-border bg-background/80 sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 backdrop-blur-md lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Volver al historial">
          <Link href="/historial">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <p className="truncate font-semibold">{empleado}</p>
          <p className="text-muted-foreground text-xs">{periodo}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <p className="text-muted-foreground hidden text-xs sm:block">
          Para PDF, elegí “Guardar como PDF” como destino
        </p>
        <Button className="bg-brand" onClick={() => window.print()}>
          <Printer className="size-4" />
          Imprimir o guardar PDF
        </Button>
      </div>
    </div>
  )
}
