import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { BarraRecibo } from "@/components/recibo/barra-recibo"
import { DocumentoRecibo } from "@/components/recibo/documento-recibo"
import { requerirUsuario } from "@/lib/datos/auth"
import { obtenerLiquidacion } from "@/lib/datos/liquidaciones"

export const metadata: Metadata = { title: "Recibo" }

export default async function ReciboPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requerirUsuario(`/recibo/${id}`)

  const liquidacion = await obtenerLiquidacion(id)
  if (!liquidacion) notFound()

  return (
    <div className="min-h-dvh">
      <BarraRecibo
        empleado={liquidacion.empleado_nombre}
        periodo={liquidacion.periodo}
      />

      <div className="hoja-recibos mx-auto flex max-w-4xl flex-col gap-6 p-5 lg:p-8">
        <DocumentoRecibo liquidacion={liquidacion} copia="ORIGINAL" />
        <DocumentoRecibo liquidacion={liquidacion} copia="DUPLICADO" />
      </div>
    </div>
  )
}
