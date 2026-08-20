import type { Metadata } from "next"

import { AppShell } from "@/components/app-shell"
import { AvisoMigracion } from "@/components/aviso-migracion"
import { PanelLiquidacion } from "@/components/sueldos/panel-liquidacion"
import { requerirUsuario } from "@/lib/datos/auth"
import { esMigracionPendiente } from "@/lib/datos/errores"
import { listarLegajos } from "@/lib/datos/legajos"
import type { Legajo } from "@/lib/tipos"

/**
 * Depende de la sesión del usuario: nunca se prerenderiza ni se cachea.
 * Sin esto Next intenta generarla en build y falla antes de llegar a cookies().
 */
export const dynamic = "force-dynamic"

export const metadata: Metadata = { title: "Liquidar" }

export default async function SueldosPage() {
  const user = await requerirUsuario("/sueldos")

  let legajos: Legajo[] = []
  let aviso: string | null = null

  try {
    legajos = await listarLegajos()
  } catch (error) {
    // Sin tablas todavía se puede liquidar a mano: sólo no hay legajos.
    if (esMigracionPendiente(error)) {
      aviso = (error as Error).message
    } else {
      throw error
    }
  }

  return (
    <AppShell email={user.email ?? ""} titulo="Liquidar" descripcion="Panel de liquidación">
      {aviso ? <AvisoMigracion mensaje={aviso} /> : null}
      <PanelLiquidacion legajos={legajos} />
    </AppShell>
  )
}
