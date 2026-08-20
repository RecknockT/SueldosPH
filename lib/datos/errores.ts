import type { PostgrestError } from "@supabase/supabase-js"

/** Códigos con los que Postgres y PostgREST avisan que la tabla no existe. */
const TABLA_FALTANTE = ["42P01", "PGRST205"]

export class MigracionPendienteError extends Error {
  constructor() {
    super(
      "Las tablas de legajos y liquidaciones todavía no existen. " +
        "Ejecutá supabase/migrations/0001_legajos_y_liquidaciones.sql en Supabase → SQL Editor."
    )
    this.name = "MigracionPendienteError"
  }
}

/** Traduce el error de Supabase a algo accionable antes de propagarlo. */
export function traducirError(error: PostgrestError): Error {
  if (TABLA_FALTANTE.includes(error.code)) return new MigracionPendienteError()

  return new Error(error.message)
}

export function esMigracionPendiente(error: unknown) {
  return error instanceof MigracionPendienteError
}
