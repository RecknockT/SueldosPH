import { createBrowserClient } from "@supabase/ssr"

import { supabaseEnv } from "./config"

/** Cliente de Supabase para componentes que corren en el navegador. */
export function createClient() {
  const { url, anonKey } = supabaseEnv()
  return createBrowserClient(url, anonKey)
}
