import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Ingresar",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const { redirectTo } = await searchParams

  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden px-6 py-12">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#2d5eff33_0%,transparent_45%),radial-gradient(circle_at_bottom,#0d8eff1a_0%,transparent_45%)]"
      />

      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground absolute top-6 left-6 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>

      <div className="border-border/60 bg-card/80 w-full max-w-md rounded-3xl border p-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-10">
        <div className="text-center">
          <div className="bg-brand mx-auto flex size-16 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-[0_0_30px_rgba(91,124,255,0.4)]">
            $
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight">SueldosPH</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Liquidación profesional para Propiedad Horizontal
          </p>

          <div className="bg-brand mx-auto mt-6 mb-8 h-[3px] w-16 rounded-full" />
        </div>

        <LoginForm redirectTo={redirectTo ?? "/sueldos"} />
      </div>
    </main>
  )
}
