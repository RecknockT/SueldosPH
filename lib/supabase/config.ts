/**
 * Las claves publicables de Supabase viajan al navegador, por eso son NEXT_PUBLIC_*.
 * Se leen con la referencia literal a process.env para que Next las pueda inlinear.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function supabaseEnv() {
  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copiá .env.example a .env.local en local y cargá ambas variables en Vercel."
    )
  }

  return { url, anonKey }
}
