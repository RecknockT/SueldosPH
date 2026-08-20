"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type EstadoLogin = { error?: string }

/** Sólo rutas internas: evita que ?redirectTo= mande a un dominio externo. */
function destinoSeguro(valor: string) {
  return valor.startsWith("/") && !valor.startsWith("//") ? valor : "/sueldos"
}

export async function ingresar(
  _estadoPrevio: EstadoLogin,
  formData: FormData
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const destino = destinoSeguro(String(formData.get("redirectTo") ?? "/sueldos"))

  if (!email || !password) {
    return { error: "Completá correo y contraseña." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: "Usuario o contraseña incorrectos." }
  }

  revalidatePath("/", "layout")
  redirect(destino)
}

export async function cerrarSesion() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidatePath("/", "layout")
  redirect("/login")
}
