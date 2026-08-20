"use client"

import { useActionState, useState, useSyncExternalStore } from "react"
import { useFormStatus } from "react-dom"
import { AlertCircle, Loader2, LockKeyhole } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { ingresar, type EstadoLogin } from "./actions"

const CLAVE_EMAIL_RECORDADO = "sueldosph:email"

const sinSuscripcion = () => () => {}
const leerEmailGuardado = () =>
  window.localStorage.getItem(CLAVE_EMAIL_RECORDADO) ?? ""

/**
 * localStorage no existe en el server: se lee con useSyncExternalStore para que
 * el snapshot del server sea "" y React reconcilie después de hidratar.
 */
function useEmailRecordado() {
  return useSyncExternalStore(sinSuscripcion, leerEmailGuardado, () => "")
}

function BotonIngresar() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="bg-brand h-11 w-full text-base">
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Ingresando…
        </>
      ) : (
        "Ingresar"
      )}
    </Button>
  )
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [estado, accion] = useActionState<EstadoLogin, FormData>(ingresar, {})

  const emailRecordado = useEmailRecordado()

  // null = todavía no lo tocó el usuario, vale lo guardado.
  const [emailEditado, setEmailEditado] = useState<string | null>(null)
  const [recordarmeEditado, setRecordarmeEditado] = useState<boolean | null>(null)

  const email = emailEditado ?? emailRecordado
  const recordarme = recordarmeEditado ?? emailRecordado !== ""

  const recordarEmail = () => {
    if (recordarme && email) {
      window.localStorage.setItem(CLAVE_EMAIL_RECORDADO, email)
    } else {
      window.localStorage.removeItem(CLAVE_EMAIL_RECORDADO)
    }
  }

  return (
    <form action={accion} onSubmit={recordarEmail} className="space-y-5">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nombre@empresa.com"
          value={email}
          onChange={(event) => setEmailEditado(event.target.value)}
          className="h-11"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="h-11"
          required
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Label
          htmlFor="recordarme"
          className="text-muted-foreground cursor-pointer text-sm font-normal"
        >
          <Checkbox
            id="recordarme"
            checked={recordarme}
            onCheckedChange={(valor) => setRecordarmeEditado(valor === true)}
          />
          Recordarme
        </Label>

        <span className="text-muted-foreground/70 text-sm">
          <LockKeyhole className="mr-1 inline size-3.5 align-[-2px]" />
          Acceso privado
        </span>
      </div>

      {estado.error ? (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm"
        >
          <AlertCircle className="size-4 shrink-0" />
          {estado.error}
        </p>
      ) : null}

      <BotonIngresar />
    </form>
  )
}
