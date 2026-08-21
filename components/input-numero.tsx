"use client"

import type { WheelEvent } from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/**
 * Campo numérico para importes y cantidades.
 *
 * Los input type="number" del navegador cambian de valor cuando la rueda del
 * mouse gira sobre ellos y tienen el foco: alguien scrollea la página, el
 * cursor pasa por encima de un campo y le sube o le baja el número sin
 * enterarse. En una liquidación eso es un monto mal cargado.
 *
 * Quitarle el foco al empezar a girar la rueda lo resuelve sin efectos
 * secundarios: el campo deja de escuchar la rueda y la página scrollea normal.
 * Cancelar el evento no serviría, porque también frenaría el scroll.
 */
export function InputNumero({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  const soltarFoco = (evento: WheelEvent<HTMLInputElement>) => {
    evento.currentTarget.blur()
  }

  return (
    <Input
      type="number"
      inputMode="decimal"
      className={cn("tabular", className)}
      {...props}
      onWheel={soltarFoco}
    />
  )
}
