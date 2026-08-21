import type { PostgrestError } from "@supabase/supabase-js"

/** Códigos con los que Postgres y PostgREST avisan que la tabla no existe. */
const TABLA_FALTANTE = ["42P01", "PGRST205"]

/** Y el que usa cuando la tabla está pero le falta una columna. */
const COLUMNA_FALTANTE = "42703"

const CORRER = (archivo: string) =>
  `Ejecutá supabase/migrations/${archivo} en Supabase → SQL Editor.`

export class MigracionPendienteError extends Error {
  constructor(detalle: string) {
    super(detalle)
    this.name = "MigracionPendienteError"
  }
}

/**
 * Traduce el error de Supabase a algo accionable antes de propagarlo.
 *
 * Las migraciones las corre el usuario a mano, así que cuando falta una tabla o
 * una columna conviene decir cuál es el archivo en vez de mostrar el error de
 * Postgres.
 */
export function traducirError(error: PostgrestError): Error {
  if (TABLA_FALTANTE.includes(error.code)) {
    return new MigracionPendienteError(
      "Las tablas de legajos y liquidaciones todavía no existen. " +
        CORRER("0001_legajos_y_liquidaciones.sql")
    )
  }

  if (error.code === COLUMNA_FALTANTE) {
    return new MigracionPendienteError(
      `A la base le falta una columna (${error.message}). ` +
        "Corré las migraciones que tengas pendientes en supabase/migrations, " +
        "en orden numérico."
    )
  }

  return new Error(error.message)
}

export function esMigracionPendiente(error: unknown) {
  return error instanceof MigracionPendienteError
}
