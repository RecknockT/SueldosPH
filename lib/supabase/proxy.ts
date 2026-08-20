import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import { supabaseEnv } from "./config"

/** Rutas que exigen sesión iniciada. */
const RUTAS_PROTEGIDAS = ["/sueldos"]

/**
 * Refresca el token de Supabase en cada request y resuelve los redirects de auth.
 * Es el patrón recomendado por @supabase/ssr: sin esto la sesión se vence en el server.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const { url, anonKey } = supabaseEnv()

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // No insertar lógica entre createServerClient y getUser: se pierden sesiones al azar.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const esProtegida = RUTAS_PROTEGIDAS.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
  )

  if (!user && esProtegida) {
    const destino = request.nextUrl.clone()
    destino.pathname = "/login"
    destino.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(destino)
  }

  if (user && pathname === "/login") {
    const destino = request.nextUrl.clone()
    destino.pathname = "/sueldos"
    destino.search = ""
    return NextResponse.redirect(destino)
  }

  return response
}
