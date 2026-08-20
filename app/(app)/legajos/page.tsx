import type { Metadata } from "next"

import { AppShell } from "@/components/app-shell"
import { AvisoMigracion } from "@/components/aviso-migracion"
import { DialogoLegajo } from "@/components/legajos/dialogo-legajo"
import { ListaLegajos } from "@/components/legajos/lista-legajos"
import { requerirUsuario } from "@/lib/datos/auth"
import { esMigracionPendiente } from "@/lib/datos/errores"
import { listarLegajos } from "@/lib/datos/legajos"
import type { Legajo } from "@/lib/tipos"

export const metadata: Metadata = { title: "Legajos" }

export default async function LegajosPage() {
  const user = await requerirUsuario("/legajos")

  let legajos: Legajo[] = []
  let aviso: string | null = null

  try {
    legajos = await listarLegajos()
  } catch (error) {
    if (esMigracionPendiente(error)) aviso = (error as Error).message
    else throw error
  }

  return (
    <AppShell
      email={user.email ?? ""}
      titulo="Legajos"
      descripcion="Las personas que liquidás todos los meses"
      acciones={aviso ? undefined : <DialogoLegajo />}
    >
      <main className="px-5 pt-5 pb-10 lg:px-8">
        {aviso ? <AvisoMigracion mensaje={aviso} /> : <ListaLegajos legajos={legajos} />}
      </main>
    </AppShell>
  )
}
