import { formatPesos } from "@/lib/format"
import { pesosEnLetras } from "@/lib/letras"
import { formatFecha, formatFechaHora } from "@/lib/periodos"
import type { FilaRecibo } from "@/lib/liquidacion"
import type { LiquidacionGuardada } from "@/lib/tipos"

/**
 * El recibo se imprime, así que va siempre con colores de papel: blanco y negro
 * explícitos, no los tokens del tema oscuro de la app.
 */

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
  const { empleado, empleador, resultado } = snapshot

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
