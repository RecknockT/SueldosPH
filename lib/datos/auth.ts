import "server-only"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

/**
 * Exige sesión y devuelve el usuario.
 * El proxy ya cubre estas rutas; esto es la segunda barrera del lado del server.
 */
export async function requerirUsuario(rutaActual: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?redirectTo=${encodeURIComponent(rutaActual)}`)

  return user
}
