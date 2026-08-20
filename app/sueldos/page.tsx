import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { PanelLiquidacion } from "@/components/sueldos/panel-liquidacion"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Panel de liquidación",
}

export default async function SueldosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // El proxy ya cubre este caso; queda como segunda barrera del lado del server.
  if (!user) redirect("/login?redirectTo=/sueldos")

  return <PanelLiquidacion email={user.email ?? ""} />
}
