import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { supabaseEnv } from "./config"

/** Cliente de Supabase para Server Components, Server Actions y Route Handlers. */
export async function createClient() {
  const { url, anonKey } = supabaseEnv()
  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Un Server Component no puede escribir cookies; el proxy ya refresca la sesión.
        }
      },
    },
  })
}
