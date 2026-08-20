"use client"

import { useFormStatus } from "react-dom"
import { LogOut } from "lucide-react"

import { cerrarSesion } from "@/app/login/actions"
import { Button } from "@/components/ui/button"

function BotonSalir() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      variant="ghost"
      size="icon"
      disabled={pending}
      title="Cerrar sesión"
      aria-label="Cerrar sesión"
    >
      <LogOut className="size-4" />
    </Button>
  )
}

export function MenuUsuario({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground hidden max-w-[200px] truncate text-sm sm:inline">
        {email}
      </span>
      <form action={cerrarSesion}>
        <BotonSalir />
      </form>
    </div>
  )
}
