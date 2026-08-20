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
| `npm test` | Tests del cálculo y del parser de planillas (`node --test`) |
| `npm run sync:planillas` | Baja las escalas salariales de SUTERH |

## Variables de entorno

Ambas son publicables (viajan al navegador) y salen de Supabase → Project Settings → API:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

En Vercel hay que cargarlas en Settings → Environment Variables para Production,
Preview y Development. Sin ellas el build falla con un mensaje explícito.

## Deploy en Vercel

`vercel.json` fija `"framework": "nextjs"`, y eso pisa el preset del panel — de
otro modo el proyecto seguiría buildeando como Vite, que es lo que era antes.

Lo único que hay que hacer a mano es cargar las dos variables de entorno de
arriba. Después, cada push a la rama de producción despliega solo.

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
data/planillas/       Escalas salariales por período (JSON generado)
scripts/
  parse-planilla.ts   Parser de las tablas de SUTERH
  sync-planillas.ts   Descarga y escritura de los JSON
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

## Planillas salariales

Las escalas se sincronizan desde
[suterh.org.ar/planillas-salariales](https://suterh.org.ar/planillas-salariales/).
No se editan a mano.

```bash
npm run sync:planillas            # año corriente
npm run sync:planillas -- 2025 2026
```

El script baja cada período, lo parsea y escribe un JSON en `data/planillas/`,
más el manifiesto `data/planillas/index.ts` que consume `lib/planillas.ts`. La
primera clave del manifiesto — el período más reciente — es la seleccionada por
defecto en la app.

Además hay una GitHub Action (`.github/workflows/sync-planillas.yml`) que corre
los lunes y **abre un PR** si aparecen planillas nuevas o cambian montos. Nunca
commitea a `main` directamente: el diff es la revisión antes de liquidar con
datos nuevos.

Dos cosas a tener en cuenta:

- **Los aportes no vienen de SUTERH.** Jubilatorio, INSSJP, obra social y demás
  son alícuotas de ley y viven en `APORTES_POR_LEY`, en `scripts/parse-planilla.ts`.
- **El parser es estricto a propósito.** Si el sitio cambia el nombre de una
  función, agrega un concepto o deja un importe ilegible, falla con un mensaje
  concreto en vez de escribir una planilla incompleta. Cuando eso pase, hay que
  actualizar las tablas de mapeo en `scripts/parse-planilla.ts`.

## Cálculo

`lib/liquidacion.ts` concentra todas las reglas: básico por cargo y categoría,
plus de antigüedad (reducido para media jornada), vivienda, adicionales por tarea,
horas extra sobre el valor hora (básico / 200) y aportes tomados de la planilla.

Los tests (`npm test`) verifican, entre otras cosas, que las filas del recibo
sumen exactamente sus totales y que el neto cierre con bruto − descuentos +
adicional no remunerativo.
