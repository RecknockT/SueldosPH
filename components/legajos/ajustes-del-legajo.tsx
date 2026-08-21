"use client"

import { useState } from "react"

import { TablaAjustes } from "@/components/sueldos/tabla-ajustes"
import type { Ajuste } from "@/lib/liquidacion"

/**
 * Los ajustes fijos del empleado, dentro del formulario del legajo.
 *
 * Es el mismo editor que el de la liquidación —así se cargan igual en los dos
 * lados—, envuelto para que el form nativo pueda mandarlos: viajan como JSON
 * en un campo oculto.
 */
export function AjustesDelLegajo({ iniciales }: { iniciales: Ajuste[] }) {
  const [ajustes, setAjustes] = useState<Ajuste[]>(iniciales)

  return (
    <>
      <input type="hidden" name="ajustes" value={JSON.stringify(ajustes)} />
      <TablaAjustes ajustes={ajustes} onCambiar={setAjustes} />
    </>
  )
}
