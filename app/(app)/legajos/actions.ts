"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { traducirError } from "@/lib/datos/errores"
import {
  ADICIONALES_INICIALES,
  APORTES_INICIALES,
  CAMPOS_ADICIONAL,
  CAMPOS_APORTE,
  parsearAjustes,
  type Categoria,
} from "@/lib/liquidacion"
import { parsearHorasFijas } from "@/lib/horas-fijas"
import { PLANILLAS, PLANILLA_POR_DEFECTO } from "@/lib/planillas"

export type EstadoLegajo = { error?: string; ok?: boolean }

const texto = (formData: FormData, campo: string) => {
  const valor = String(formData.get(campo) ?? "").trim()
  return valor === "" ? null : valor
}

const numero = (formData: FormData, campo: string) => {
  const valor = Number(String(formData.get(campo) ?? "").replace(",", "."))
  return Number.isFinite(valor) && valor >= 0 ? valor : 0
}

/** Los checkboxes ausentes en el FormData son "false", no "sin definir". */
const banderas = (formData: FormData, prefijo: string, claves: string[]) =>
  Object.fromEntries(claves.map((k) => [k, formData.get(`${prefijo}-${k}`) === "on"]))

export async function guardarLegajo(formData: FormData): Promise<EstadoLegajo> {
  const id = texto(formData, "id")
  const nombre = texto(formData, "nombre")
  const cargoId = texto(formData, "cargo_id")
  const categoria = Number(formData.get("categoria") ?? 1) as Categoria

  if (!nombre) return { error: "El nombre del empleado es obligatorio." }
  if (!cargoId) return { error: "Elegí un cargo." }

  const cargosValidos = PLANILLAS[PLANILLA_POR_DEFECTO].cargos.map((c) => c.id)
  if (!cargosValidos.includes(cargoId)) {
    return { error: "Ese cargo no existe en la planilla vigente." }
  }

  if (![1, 2, 3, 4].includes(categoria)) {
    return { error: "La categoría debe ser 1, 2, 3 o 4." }
  }

  const fila = {
    nombre,
    cuil: texto(formData, "cuil"),
    cargo_id: cargoId,
    categoria,
    fecha_ingreso: texto(formData, "fecha_ingreso"),
    consorcio_nombre: texto(formData, "consorcio_nombre"),
    consorcio_cuit: texto(formData, "consorcio_cuit"),
    uf: numero(formData, "uf"),
    adicionales: {
      ...ADICIONALES_INICIALES,
      ...banderas(formData, "adic", CAMPOS_ADICIONAL.map((c) => c.key)),
    },
    aportes: {
      ...APORTES_INICIALES,
      ...banderas(formData, "aporte", CAMPOS_APORTE.map((c) => c.key)),
    },
    // Llegan como JSON desde los editores del diálogo: se validan antes de guardar.
    horas_fijas: parsearHorasFijas(formData.get("horas_fijas")),
    ajustes: parsearAjustes(formData.get("ajustes")),
    art_alicuota: numero(formData, "art_alicuota"),
    art_monto_fijo: numero(formData, "art_monto_fijo"),
    seguro_vida: numero(formData, "seguro_vida"),
    detraccion: numero(formData, "detraccion"),
    contribucion_solidaria: numero(formData, "contribucion_solidaria"),
    activo: formData.get("activo") === "on",
    notas: texto(formData, "notas"),
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Sesión vencida. Volvé a ingresar." }

  const { error } = id
    ? await supabase.from("legajos").update(fila).eq("id", id)
    : await supabase.from("legajos").insert({ ...fila, user_id: user.id })

  if (error) return { error: traducirError(error).message }

  revalidatePath("/legajos")
  revalidatePath("/sueldos")

  return { ok: true }
}

export async function borrarLegajo(id: string): Promise<EstadoLegajo> {
  const supabase = await createClient()
  const { error } = await supabase.from("legajos").delete().eq("id", id)

  if (error) return { error: traducirError(error).message }

  revalidatePath("/legajos")
  revalidatePath("/sueldos")

  return { ok: true }
}
