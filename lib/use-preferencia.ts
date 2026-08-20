"use client"

import { useCallback, useSyncExternalStore } from "react"

const oyentes = new Set<() => void>()

const notificar = () => {
  for (const oyente of oyentes) oyente()
}

const suscribir = (alCambiar: () => void) => {
  oyentes.add(alCambiar)
  return () => {
    oyentes.delete(alCambiar)
  }
}

/**
 * Preferencia de UI guardada en localStorage.
 *
 * Se lee con useSyncExternalStore para que el snapshot del server sea el valor
 * por defecto y React reconcilie después de hidratar, sin efectos ni desajustes.
 */
export function usePreferenciaLocal(clave: string, porDefecto: string) {
  const valor = useSyncExternalStore(
    suscribir,
    () => window.localStorage.getItem(clave) ?? porDefecto,
    () => porDefecto
  )

  const guardar = useCallback(
    (nuevo: string) => {
      window.localStorage.setItem(clave, nuevo)
      notificar()
    },
    [clave]
  )

  return [valor, guardar] as const
}
