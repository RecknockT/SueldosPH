import { formatPesos } from "@/lib/format"
import type { ComposicionCosto } from "@/lib/composicion-costo"

/**
 * Torta de composición del costo laboral (Decreto 407/2026).
 *
 * SVG inline con stroke-dasharray sobre un círculo: sin librerías ni scripts,
 * así el gráfico sale igual en pantalla y en la impresión.
 *
 * La leyenda lleva monto y porcentaje, y hace de resumen: es la única tabla de
 * composición del recibo. Una tabla aparte repetiría estos mismos números.
 */

const RADIO = 70
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

export function GraficoCosto({ composicion }: { composicion: ComposicionCosto }) {
  if (composicion.total <= 0 || composicion.tramos.length === 0) return null

  // Cada tramo arranca donde terminó el anterior, sin acumular en una variable
  // para no mutar nada durante el render.
  const segmentos = composicion.tramos.map((tramo, i) => {
    const previos = composicion.tramos
      .slice(0, i)
      .reduce((acc, t) => acc + t.porcentaje, 0)

    return {
      ...tramo,
      largo: (tramo.porcentaje / 100) * CIRCUNFERENCIA,
      offset: -(previos / 100) * CIRCUNFERENCIA,
    }
  })

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg
        viewBox="0 0 200 200"
        className="h-[148px] w-[148px] shrink-0"
        role="img"
        aria-label="Distribución del costo total del empleador"
      >
        {/* Rotado para que el primer tramo arranque arriba. */}
        <g transform="rotate(-90 100 100)">
          {segmentos.map((tramo) => (
            <circle
              key={tramo.id}
              cx="100"
              cy="100"
              r={RADIO}
              fill="none"
              stroke={tramo.color}
              strokeWidth="44"
              strokeDasharray={`${tramo.largo} ${CIRCUNFERENCIA}`}
              strokeDashoffset={tramo.offset}
            />
          ))}
        </g>
      </svg>

      <dl className="min-w-[240px] flex-1 space-y-0.5">
        {composicion.tramos.map((tramo) => (
          <div key={tramo.id} className="flex items-baseline gap-2">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: tramo.color }}
            />
            <dt className="flex-1 text-[11px] text-neutral-600">{tramo.etiqueta}</dt>
            <dd className="tabular w-[92px] text-right text-[11px]">
              {formatPesos(tramo.monto)}
            </dd>
            <dd className="tabular w-[44px] text-right text-[11px] font-semibold">
              {tramo.porcentaje.toFixed(1).replace(".", ",")}%
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
