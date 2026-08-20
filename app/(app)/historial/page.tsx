import type { Metadata } from "next"

import { AppShell } from "@/components/app-shell"
import { AvisoMigracion } from "@/components/aviso-migracion"
import { TablaHistorial } from "@/components/historial/tabla-historial"
import { requerirUsuario } from "@/lib/datos/auth"
import { esMigracionPendiente } from "@/lib/datos/errores"
import { listarLiquidaciones } from "@/lib/datos/liquidaciones"
import type { LiquidacionGuardada } from "@/lib/tipos"

export const metadata: Metadata = { title: "Historial" }

export default async function HistorialPage() {
  const user = await requerirUsuario("/historial")

  let liquidaciones: LiquidacionGuardada[] = []
  let aviso: string | null = null

  try {
    liquidaciones = await listarLiquidaciones()
  } catch (error) {
    if (esMigracionPendiente(error)) aviso = (error as Error).message
    else throw error
  }

  return (
    <AppShell
      email={user.email ?? ""}
      titulo="Historial"
      descripcion="Recibos emitidos"
    >
      <main className="px-5 pt-5 pb-10 lg:px-8">
        {aviso ? (
          <AvisoMigracion mensaje={aviso} />
        ) : (
          <TablaHistorial liquidaciones={liquidaciones} />
        )}
      </main>
    </AppShell>
  )
}
