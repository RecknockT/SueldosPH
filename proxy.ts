import type { NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/proxy"

export default async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Todas las rutas salvo estáticos e imágenes, para que el token se refresque
     * en cada navegación real.
     */
    "/((?!_next/static|_next/image|favicon.svg|icons.svg|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
