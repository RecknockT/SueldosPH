"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calculator, History, Menu, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Marca } from "@/components/sueldos/marca"
import { MenuUsuario } from "@/components/sueldos/menu-usuario"
import { cn } from "@/lib/utils"

const SECCIONES = [
  { href: "/sueldos", label: "Liquidar", icono: Calculator },
  { href: "/legajos", label: "Legajos", icono: Users },
  { href: "/historial", label: "Historial", icono: History },
]

function Navegacion({ onNavegar }: { onNavegar?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 px-3">
      {SECCIONES.map(({ href, label, icono: Icono }) => {
        const activo = pathname === href || pathname.startsWith(`${href}/`)

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavegar}
            aria-current={activo ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              activo
                ? "bg-primary/15 text-primary font-semibold"
                : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <Icono className="size-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AppShell({
  email,
  titulo,
  descripcion,
  acciones,
  children,
}: {
  email: string
  titulo: string
  descripcion?: string
  acciones?: React.ReactNode
  children: React.ReactNode
}) {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="bg-background flex min-h-dvh">
      <aside className="bg-sidebar border-sidebar-border hidden w-[240px] shrink-0 flex-col gap-6 border-r py-6 lg:flex">
        <Marca />
        <Navegacion />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/70 border-border sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-5 py-4 backdrop-blur-md lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Abrir menú"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="bg-sidebar flex w-[260px] flex-col gap-6 py-6"
              >
                <SheetTitle className="sr-only">Navegación</SheetTitle>
                <Marca />
                <Navegacion onNavegar={() => setMenuAbierto(false)} />
              </SheetContent>
            </Sheet>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
                {titulo}
              </h1>
              {descripcion ? (
                <p className="text-muted-foreground truncate text-xs">{descripcion}</p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {acciones}
            <MenuUsuario email={email} />
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}
