# SueldosPH

Liquidación de sueldos para personal de Propiedad Horizontal.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase Auth.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completá las claves de Supabase
npm run dev
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en http://localhost:3000 |
| `npm run build` | Build de producción |
| `npm start` | Sirve el build |
| `npm run lint` | ESLint |
| `npm test` | Tests de la lógica de liquidación (`node --test`) |

## Variables de entorno

Ambas son publicables (viajan al navegador) y salen de Supabase → Project Settings → API:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

En Vercel hay que cargarlas en Settings → Environment Variables para Production,
Preview y Development. Sin ellas el build falla con un mensaje explícito.

## Estructura

```
app/
  page.tsx            Landing pública
  login/              Login (Server Action + formulario cliente)
  sueldos/            Panel de liquidación (requiere sesión)
components/
  sueldos/            Componentes del panel
  ui/                 shadcn/ui (se regeneran con la CLI, no se editan a mano)
lib/
  liquidacion.ts      Cálculo de haberes, descuentos y neto (funciones puras)
  liquidacion.test.ts Tests del cálculo
  planillas.ts        Carga y tipado de las planillas
  format.ts           Formato de moneda es-AR
  supabase/           Clientes de Supabase (browser / server / proxy)
data/planillas/       Escalas salariales por período (JSON)
proxy.ts              Refresco de sesión y guarda de rutas privadas
```

## Autenticación

`proxy.ts` (el middleware de Next 16) refresca el token de Supabase en cada request
y redirige:

- sin sesión y entrando a `/sueldos` → `/login?redirectTo=/sueldos`
- con sesión y entrando a `/login` → `/sueldos`

`app/sueldos/page.tsx` vuelve a verificar la sesión del lado del servidor como
segunda barrera.

Los usuarios se dan de alta desde el panel de Supabase (Authentication → Users);
la app no tiene registro público.

## Agregar una planilla nueva

1. Copiar el JSON del período a `data/planillas/`, con la misma forma que
   `junio2026.json`.
2. Sumar la entrada en `PLANILLAS` dentro de `lib/planillas.ts`. La primera clave
   del objeto es la que queda seleccionada por defecto.

## Cálculo

`lib/liquidacion.ts` concentra todas las reglas: básico por cargo y categoría,
plus de antigüedad (reducido para media jornada), vivienda, adicionales por tarea,
horas extra sobre el valor hora (básico / 200) y aportes tomados de la planilla.

Los tests (`npm test`) verifican, entre otras cosas, que las filas del recibo
sumen exactamente sus totales y que el neto cierre con bruto − descuentos +
adicional no remunerativo.
