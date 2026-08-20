import { GraficoCosto } from "@/components/recibo/grafico-costo"
import { componerCostoLaboral } from "@/lib/composicion-costo"
import { formatPesos } from "@/lib/format"
import { pesosEnLetras } from "@/lib/letras"
import { formatFecha, formatFechaHora } from "@/lib/periodos"
import type { FilaRecibo } from "@/lib/liquidacion"
import type { LiquidacionGuardada } from "@/lib/tipos"

/**
 * El recibo se imprime, así que va siempre con colores de papel: blanco y negro
 * explícitos, no los tokens del tema oscuro de la app.
 */

/** Las alícuotas van con dos decimales, como en el recibo de referencia. */
const formatAlicuota = (valor: number) =>
  `${valor.toFixed(2).replace(".", ",")}%`

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] font-semibold tracking-wide text-neutral-500 uppercase">
        {etiqueta}
      </dt>
      <dd className="truncate text-[11px] text-neutral-900">{valor}</dd>
    </div>
  )
}

function Fila({ fila }: { fila: FilaRecibo }) {
  return (
    <tr className={fila.esTotal ? "border-t border-neutral-400 font-bold" : ""}>
      <td className="px-2 py-1 text-[11px]">{fila.detalle}</td>
      <td className="px-2 py-1 text-[10px] whitespace-nowrap text-neutral-600">
        {fila.unidad}
      </td>
      <td className="tabular px-2 py-1 text-right text-[11px]">
        {fila.haber ? formatPesos(fila.haber) : ""}
      </td>
      <td className="tabular px-2 py-1 text-right text-[11px]">
        {fila.descuento ? formatPesos(fila.descuento) : ""}
      </td>
    </tr>
  )
}

export function DocumentoRecibo({
  liquidacion,
  copia,
}: {
  liquidacion: LiquidacionGuardada
  copia: "ORIGINAL" | "DUPLICADO"
}) {
  const { snapshot } = liquidacion
  const { empleado, empleador, resultado, costoLaboral } = snapshot

  return (
    <article className="recibo-copia mx-auto w-full max-w-[190mm] bg-white p-4 text-neutral-900 sm:p-6">
      <header className="flex items-start justify-between gap-4 border-b-2 border-neutral-800 pb-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">
            {empleador.nombre || "Consorcio de Propietarios"}
          </p>
          <p className="text-[10px] text-neutral-600">
            {empleador.cuit ? `CUIT ${empleador.cuit}` : "CUIT —"}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-bold tracking-wide">RECIBO DE HABERES</p>
          <p className="text-[10px] font-semibold text-neutral-500">{copia}</p>
          <p className="text-[10px] text-neutral-600">Período {snapshot.periodo}</p>
        </div>
      </header>

      <dl className="grid grid-cols-3 gap-x-4 gap-y-2 border-b border-neutral-300 py-3 sm:grid-cols-6">
        <div className="col-span-2">
          <Dato etiqueta="Apellido y nombre" valor={empleado.nombre} />
        </div>
        <Dato etiqueta="CUIL" valor={empleado.cuil || "—"} />
        <div className="col-span-2">
          <Dato etiqueta="Cargo" valor={empleado.cargoNombre} />
        </div>
        <Dato etiqueta="Categoría" valor={String(empleado.categoria)} />
        <Dato etiqueta="Fecha de ingreso" valor={formatFecha(empleado.fechaIngreso)} />
        <Dato
          etiqueta="Antigüedad"
          valor={`${empleado.antiguedadAnios} ${empleado.antiguedadAnios === 1 ? "año" : "años"}`}
        />
      </dl>

      {/*
        En pantalla angosta la grilla de conceptos no baja de ~340px, así que
        scrollea dentro de su caja en vez de desbordar la hoja. Al imprimir la
        A4 sobra ancho y el contenedor se desactiva.
      */}
      <div className="overflow-x-auto print:overflow-visible">
      <table className="w-full min-w-[340px] border-collapse">
        <thead>
          <tr className="border-b border-neutral-400">
            <th className="px-2 py-1 text-left text-[9px] font-semibold tracking-wide text-neutral-600 uppercase">
              Concepto
            </th>
            <th className="px-2 py-1 text-left text-[9px] font-semibold tracking-wide text-neutral-600 uppercase">
              Unidad
            </th>
            <th className="px-2 py-1 text-right text-[9px] font-semibold tracking-wide text-neutral-600 uppercase">
              Haberes
            </th>
            <th className="px-2 py-1 text-right text-[9px] font-semibold tracking-wide text-neutral-600 uppercase">
              Descuentos
            </th>
          </tr>
        </thead>
        <tbody>
          {resultado.haberes.map((fila) => (
            <Fila key={`h-${fila.id}`} fila={fila} />
          ))}
          {resultado.deducciones.map((fila) => (
            <Fila key={`d-${fila.id}`} fila={fila} />
          ))}
        </tbody>
      </table>
      </div>

      <div className="mt-3 border-t-2 border-neutral-800 pt-3">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-semibold tracking-wide text-neutral-500 uppercase">
              Son
            </p>
            <p className="text-[11px] leading-snug">{pesosEnLetras(resultado.neto)}</p>
          </div>

          <div className="shrink-0 text-right">
            {resultado.noRemunerativo > 0 ? (
              <p className="text-[10px] text-neutral-600">
                No remunerativo {formatPesos(resultado.noRemunerativo)}
              </p>
            ) : null}
            <p className="text-[9px] font-semibold tracking-wide text-neutral-500 uppercase">
              Neto a cobrar
            </p>
            <p className="tabular text-lg font-bold">{formatPesos(resultado.neto)}</p>
          </div>
        </div>
      </div>

      {costoLaboral ? (
        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0e9fd8] px-3 py-1.5 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[10px] font-bold tracking-wide uppercase">
                Contribuciones a cargo del empleador
              </h2>
              <span className="rounded bg-[#f5a623] px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-neutral-900 uppercase">
                Nuevo · Ley 27.802
              </span>
            </div>
            <span className="text-[8px] font-semibold tracking-wide uppercase opacity-90">
              Art. 52 bis LCT
            </span>
          </div>

          <dl className="grid grid-cols-1 gap-x-6 border-x border-b border-neutral-300 px-3 py-2 sm:grid-cols-2">
            {costoLaboral.contribuciones.map((fila) => (
              <div
                key={fila.id}
                className="flex items-baseline justify-between gap-2 border-b border-neutral-100 py-1 last:border-0"
              >
                <dt className="text-[10px] font-semibold">{fila.detalle}</dt>
                <dd className="flex shrink-0 items-baseline gap-2">
                  <span className="tabular text-[9px] text-neutral-500">
                    {fila.alicuota === null ? "—" : formatAlicuota(fila.alicuota)}
                  </span>
                  <span className="tabular text-[10px] font-medium">
                    {formatPesos(fila.monto)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="flex items-baseline justify-between gap-2 bg-neutral-100 px-3 py-2">
              <span className="text-[9px] font-bold tracking-wide uppercase">
                Total contribuciones patronales
              </span>
              <span className="tabular text-[11px] font-bold">
                {formatPesos(costoLaboral.totalContribuciones)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2 bg-[#0e9fd8] px-3 py-2 text-white">
              <span className="text-[9px] font-bold tracking-wide uppercase">
                Costo total del empleador
              </span>
              <span className="tabular text-[11px] font-bold">
                {formatPesos(costoLaboral.costoTotal)}
              </span>
            </div>
          </div>

          <div className="border-x border-b border-neutral-300 px-3 py-3">
            <h3 className="mb-2 text-[9px] font-bold tracking-wide text-neutral-600 uppercase">
              Composición del costo laboral
            </h3>
            <GraficoCosto
              composicion={componerCostoLaboral(
                costoLaboral,
                resultado.neto,
                resultado.descuentos
              )}
            />
          </div>
        </section>
      ) : null}

      <footer className="mt-8 grid grid-cols-2 gap-8">
        <div>
          <div className="border-t border-neutral-500 pt-1">
            <p className="text-[9px] text-neutral-600">Firma y sello del empleador</p>
          </div>
        </div>
        <div>
          <div className="border-t border-neutral-500 pt-1">
            <p className="text-[9px] text-neutral-600">
              Recibí conforme · firma y aclaración
            </p>
          </div>
        </div>
      </footer>

      <p className="mt-3 text-[8px] text-neutral-400">
        Emitido el {formatFechaHora(liquidacion.created_at)} · SueldosPH
      </p>
    </article>
  )
}
