"use client"

import type { ChangeEvent, FocusEvent, MouseEvent, ReactNode } from "react"

import { InputNumero } from "@/components/input-numero"
import { Label } from "@/components/ui/label"

type Props = {
  id: string
  label: string
  ayuda: ReactNode
  value: number | ""
  onChange: (valor: number | "") => void
}

export function CampoNumero({ id, label, ayuda, value, onChange }: Props) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    if (raw === "") return onChange("")

    const parsed = Number(raw)
    onChange(Number.isNaN(parsed) ? "" : parsed)
  }

  // Seleccionar al enfocar: se carga campo por campo y el 0 previo molesta.
  const handleFocus = (event: FocusEvent<HTMLInputElement>) => event.target.select()
  const handleMouseUp = (event: MouseEvent<HTMLInputElement>) => event.preventDefault()

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-muted-foreground text-xs font-semibold">
        {label}
      </Label>
      <InputNumero
        id={id}
        min={0}
        step="any"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onMouseUp={handleMouseUp}
        className="h-9"
      />
      <p className="text-muted-foreground/60 text-[11px] leading-tight">{ayuda}</p>
    </div>
  )
}
