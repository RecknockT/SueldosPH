import { GraficoCosto } from "@/components/recibo/grafico-costo"
import { componerCostoLaboral } from "@/lib/composicion-costo"
import {
  letraDeBase,
  referenciasDeBase,
  type FilaContribucion,
  type ReferenciaBase,
} from "@/lib/costo-laboral"
import { formatPesos } from "@/lib/format"
import { pesosEnLetras } from "@/lib/letras"
import { formatFecha, formatFechaHora } from "@/lib/periodos"
import type { FilaRecibo } from "@/lib/liquidacion"
import type { LiquidacionGuardada } from "@/lib/tipos"

/**
 * Recibo de haberes.
 *
 * Se imprime, así que va siempre con colores de papel: blanco y negro
 * explícitos, no los tokens del tema oscuro de la app.
 *
 * El orden es deliberado: primero la liquidación, que es lo que el trabajador
 * firma, y después el costo del empleador que exige la Ley 27.802. El modelo
 * publicado por el gobierno lo pone al revés; la ley pide que la información
 * esté, no que encabece.
 */

const BANDA = "#0b6d96"

const formatAlicuota = (valor: number) => `${valor.toFixed(2).replace(".", ",")}%`

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] font-semibold tracking-[0.09em] text-neutral-500 uppercase">
      {children}
    </span>
  )
}

function Banda({ titulo, referencia }: { titulo: string; referencia: string }) {
  return (
    <div
      className="flex flex-wrap items-baseline justify-between gap-2 px-2.5 py-1 text-white"
      style={{ backgroundColor: BANDA }}
    >
      <h2 className="text-[10px] font-bold tracking-[0.1em] uppercase">{titulo}</h2>
      <span className="text-[9px] tracking-[0.08em] uppercase opacity-80">
        {referencia}
      </span>
    </div>
  )
}

/** Cierre de sección: sólo el número que no está en la tabla de arriba. */
function Cierre({ rotulo, monto }: { rotulo: string; monto: number }) {
  return (
    <div
      className="flex flex-wrap items-baseline justify-between gap-2 px-2.5 py-1.5 text-white"
      style={{ backgroundColor: BANDA }}
    >
      <span className="text-[9px] font-bold tracking-[0.09em] uppercase opacity-80">
        {rotulo}
      </span>
      <span className="tabular text-base font-bold">{formatPesos(monto)}</span>
    </div>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="min-w-0">
      <Rotulo>{etiqueta}</Rotulo>
      <p className="truncate text-[11px] font-medium text-neutral-900">{valor}</p>
    </div>
  )
}

/** Marcador de base: tiene que engancharse a simple vista con la nota al pie. */
function Marca({ letra }: { letra: string }) {
  return (
    <span className="font-bold" style={{ color: BANDA }}>
      {letra}
    </span>
  )
}

function TablaContribuciones({
  filas,
  referencias,
}: {
  filas: FilaContribucion[]
  referencias: ReferenciaBase[]
}) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-neutral-300">
          <th className="w-[52%] px-1.5 py-1.5 text-left">
            <Rotulo>Concepto</Rotulo>
          </th>
          <th className="px-1.5 py-1.5 text-right">
            <Rotulo>Alícuota</Rotulo>
          </th>
          <th className="px-1.5 py-1.5 text-center">
            <Rotulo>Base</Rotulo>
          </th>
          <th className="px-1.5 py-1.5 text-right">
            <Rotulo>Monto</Rotulo>
          </th>
        </tr>
      </thead>
      <tbody>
        {filas.map((fila) => {
          const letra = letraDeBase(fila, referencias)

          return (
            <tr key={fila.id} className="border-b border-neutral-100 even:bg-neutral-50/70">
              <td className="px-1.5 py-1 text-[10.5px]">{fila.detalle}</td>
              <td className="tabular px-1.5 py-1 text-right text-[10px] text-neutral-500">
                {fila.alicuota === null ? "—" : formatAlicuota(fila.alicuota)}
              </td>
              <td className="px-1.5 py-1 text-center text-[10px]">
                {letra ? <Marca letra={letra} /> : <span className="text-neutral-400">—</span>}
              </td>
              <td className="tabular px-1.5 py-1 text-right text-[10.5px]">
                {formatPesos(fila.monto)}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function FilaLiquidacion({ fila }: { fila: FilaRecibo }) {
  return (
    <tr className="border-b border-neutral-100 even:bg-neutral-50/70">
      <td className="px-2 py-1 text-[11px]">{fila.detalle}</td>
      <td className="px-2 py-1 text-[10px] whitespace-nowrap text-neutral-500">
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

  // Las filas de total ya cierran dentro de cada tabla; no se repiten afuera.
  const haberes = resultado.haberes.filter((f) => !f.esTotal)
  const deducciones = resultado.deducciones.filter((f) => !f.esTotal)

  const composicion = costoLaboral
    ? componerCostoLaboral(costoLaboral, resultado.neto, resultado.descuentos)
    : null

  // Las contribuciones van en dos columnas: once filas en una sola son media
  // hoja. El corte deja la columna izquierda con la de más.
  const contribuciones = costoLaboral?.contribuciones ?? []
  const referencias = referenciasDeBase(contribuciones)
  const corte = Math.ceil(contribuciones.length / 2)

  return (
    <article className="recibo-copia mx-auto w-full max-w-[190mm] bg-white p-4 text-neutral-900 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-neutral-900 pb-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold">
            {empleador.nombre || "Consorcio de Propietarios"}
          </p>
          <p className="text-[10px] text-neutral-500">
            {empleador.cuit ? `CUIT ${empleador.cuit}` : "CUIT —"}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[14px] font-bold tracking-[0.06em] uppercase">
            Recibo de Haberes
          </p>
          <p className="text-[10px] text-neutral-500">
            Ley 20.744 · Período {snapshot.periodo} · {copia}
          </p>

          <div className="mt-1.5 flex items-stretch justify-end gap-1.5">
            {costoLaboral ? (
              <span
                className="inline-flex -rotate-1 items-center rounded-sm border-[1.5px] px-1.5 text-[9px] font-bold tracking-[0.1em] uppercase"
                style={{ borderColor: "#a8441a", color: "#a8441a" }}
              >
                Ley 27.802
              </span>
            ) : null}

            {/* El jornal es la base de las horas extras: sin él no hay forma de
                verificarlas desde el recibo. */}
            {resultado.valorHora > 0 ? (
              <span className="inline-block rounded-sm border-[1.5px] border-neutral-900 px-2 py-0.5 text-right">
                <Rotulo>Jornal · hora</Rotulo>
                <span className="tabular block text-[12px] leading-tight font-bold">
                  {formatPesos(resultado.valorHora)}
                </span>
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-b border-neutral-300 py-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2">
          <Dato etiqueta="Apellido y nombre" valor={empleado.nombre} />
        </div>
        <Dato etiqueta="CUIL" valor={empleado.cuil || "—"} />
        <div className="col-span-2">
          <Dato etiqueta="Cargo" valor={empleado.cargoNombre} />
        </div>
        <Dato etiqueta="Categoría" valor={`${empleado.categoria}ª`} />
        <Dato etiqueta="Fecha de ingreso" valor={formatFecha(empleado.fechaIngreso)} />
        <Dato
          etiqueta="Antigüedad"
          valor={`${empleado.antiguedadAnios} ${empleado.antiguedadAnios === 1 ? "año" : "años"}`}
        />
      </div>

      {/* ---------- liquidación ---------- */}
      <div className="mt-4">
        <Banda titulo="Liquidación" referencia="Art. 140 LCT" />
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full min-w-[340px] border-collapse">
          <thead>
            <tr className="border-b border-neutral-300">
              <th className="w-[44%] px-2 py-1.5 text-left">
                <Rotulo>Concepto</Rotulo>
              </th>
              <th className="px-2 py-1.5 text-left">
                <Rotulo>Unidad</Rotulo>
              </th>
              <th className="px-2 py-1.5 text-right">
                <Rotulo>Haberes</Rotulo>
              </th>
              <th className="px-2 py-1.5 text-right">
                <Rotulo>Descuentos</Rotulo>
              </th>
            </tr>
          </thead>
          <tbody>
            {haberes.map((fila) => (
              <FilaLiquidacion key={`h-${fila.id}`} fila={fila} />
            ))}
            {deducciones.map((fila) => (
              <FilaLiquidacion key={`d-${fila.id}`} fila={fila} />
            ))}
            <tr className="border-t-[1.5px] border-neutral-900 font-bold">
              <td className="px-2 pt-1.5 text-[11px]">Totales</td>
              <td />
              <td className="tabular px-2 pt-1.5 text-right text-[11px]">
                {formatPesos(resultado.bruto)}
              </td>
              <td className="tabular px-2 pt-1.5 text-right text-[11px]">
                {formatPesos(resultado.descuentos)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 border-b border-neutral-300 pb-2.5 text-[11px] text-neutral-600">
        <Rotulo>Son</Rotulo>
        <span className="block">{pesosEnLetras(resultado.neto)}</span>
      </p>

      {resultado.noRemunerativo > 0 ? (
        <p className="mt-2 text-[10px] text-neutral-500">
          Incluye {formatPesos(resultado.noRemunerativo)} de adicional no remunerativo,
          que no integra la base de aportes.
        </p>
      ) : null}

      <div className="mt-2">
        <Cierre rotulo="Neto a cobrar" monto={resultado.neto} />
      </div>

      {/* ---------- contribuciones ---------- */}
      {costoLaboral ? (
        <>
          <div className="mt-5">
            <Banda
              titulo="Contribuciones a cargo del empleador"
              referencia="Art. 52 bis LCT · Ley 27.802"
            />
          </div>

          <div className="overflow-x-auto print:overflow-visible">
            <div className="grid min-w-[320px] gap-x-6 sm:grid-cols-2 print:grid-cols-2">
              <TablaContribuciones
                filas={contribuciones.slice(0, corte)}
                referencias={referencias}
              />
              <TablaContribuciones
                filas={contribuciones.slice(corte)}
                referencias={referencias}
              />
            </div>

            <div className="mt-1.5 flex items-baseline justify-between gap-3 border-t-[1.5px] border-neutral-900 px-1.5 pt-1.5 font-bold">
              <span className="text-[11px]">Subtotal contribuciones</span>
              <span className="tabular text-[11px]">
                {formatPesos(costoLaboral.totalContribuciones)}
              </span>
            </div>
          </div>

          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 px-1.5 text-[10px] text-neutral-500">
            {referencias.map((ref) => (
              <span key={ref.letra}>
                <Marca letra={ref.letra} /> {formatPesos(ref.base)}
              </span>
            ))}
          </p>

          <p className="mt-2 border-t border-neutral-200 pt-2 text-[10px] leading-relaxed text-neutral-500">
            La base de las contribuciones nacionales —jubilación, INSSJP y asignaciones
            familiares— es el bruto menos la detracción del art. 4 del Decreto 814/2001.
            Las restantes se liquidan sobre el bruto completo.
          </p>

          <div className="mt-2">
            <Cierre rotulo="Costo total del empleador" monto={costoLaboral.costoTotal} />
          </div>

          {/* ---------- composición ---------- */}
          {composicion ? (
            <>
              <div className="mt-5">
                <Banda
                  titulo="Composición del costo laboral"
                  referencia="Decreto 407/2026"
                />
              </div>

              <div className="pt-3">
                <GraficoCosto composicion={composicion} />
              </div>

              <p className="mt-2 border-t border-neutral-200 pt-2 text-[10px] text-neutral-500">
                Seguridad social del empleador incluye SIPA y asignaciones familiares. Los
                porcentajes se calculan sobre el costo total del empleador.
              </p>
            </>
          ) : null}
        </>
      ) : null}

      <footer className="mt-8 grid grid-cols-2 gap-8">
        <div className="border-t border-neutral-500 pt-1">
          <p className="text-[9px] text-neutral-500">Firma y sello del empleador</p>
        </div>
        <div className="border-t border-neutral-500 pt-1">
          <p className="text-[9px] text-neutral-500">Recibí conforme · firma y aclaración</p>
        </div>
      </footer>

      <p className="mt-3 text-[8px] text-neutral-400">
        Emitido el {formatFechaHora(liquidacion.created_at)} · SueldosPH
      </p>
    </article>
  )
}
