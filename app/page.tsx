import Link from "next/link"
import { ArrowRight, Calculator, FileSpreadsheet, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"

const CARACTERISTICAS = [
  {
    icono: Calculator,
    titulo: "Cálculo automático",
    detalle:
      "Básico, antigüedad, adicionales por tarea, horas extra y aportes en un solo paso.",
  },
  {
    icono: FileSpreadsheet,
    titulo: "Planillas por período",
    detalle: "Escalas oficiales cargadas por mes, con el detalle de haberes y descuentos.",
  },
  {
    icono: ShieldCheck,
    titulo: "Acceso privado",
    detalle: "El panel de liquidación requiere sesión iniciada con tu cuenta.",
  },
]

export default function HomePage() {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(11,15,25,0.88),rgba(11,15,25,0.94))]"
      />

      <div className="mx-auto w-full max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-[0.12em] text-white/70 uppercase backdrop-blur">
          Propiedad Horizontal
        </span>

        <h1 className="mt-8 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Sueldos<span className="bg-brand bg-clip-text text-transparent">PH</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-balance text-white/70">
          Sistema profesional para la liquidación de sueldos del personal de edificios,
          según las escalas del convenio vigente.
        </p>

        <Button asChild size="lg" className="bg-brand mt-10 h-13 px-8 text-base">
          <Link href="/login">
            Ingresar
            <ArrowRight className="size-5" />
          </Link>
        </Button>
      </div>

      <div className="mx-auto mt-20 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        {CARACTERISTICAS.map(({ icono: Icono, titulo, detalle }) => (
          <div
            key={titulo}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left backdrop-blur"
          >
            <Icono className="size-5 text-[var(--brand-from)]" />
            <h2 className="mt-3 text-sm font-semibold text-white">{titulo}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-white/60">{detalle}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
