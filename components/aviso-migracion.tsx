import { Database } from "lucide-react"

/** Se muestra cuando las tablas todavía no existen en Supabase. */
export function AvisoMigracion({ mensaje }: { mensaje: string }) {
  return (
    <div className="border-border bg-card mx-auto mt-10 max-w-2xl rounded-2xl border p-8">
      <Database className="text-muted-foreground size-6" />
      <h2 className="mt-4 text-lg font-semibold">Falta crear las tablas</h2>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{mensaje}</p>
      <ol className="text-muted-foreground mt-4 list-decimal space-y-1 pl-5 text-sm">
        <li>Abrí tu proyecto en Supabase → SQL Editor.</li>
        <li>
          Pegá el contenido de{" "}
          <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
            supabase/migrations/0001_legajos_y_liquidaciones.sql
          </code>
          .
        </li>
        <li>Ejecutalo y recargá esta página.</li>
      </ol>
    </div>
  )
}
