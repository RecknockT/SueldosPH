# SueldosPH

Liquidación de sueldos para personal de Propiedad Horizontal.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase Auth.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completá las claves de Supabase
npm run dev
```

En Supabase → SQL Editor hay que ejecutar, en orden, los archivos de
`supabase/migrations/`. El primero crea las tablas de legajos e historial con
RLS por usuario; el segundo suma los datos de póliza para el costo laboral.
Sin el primero la app liquida igual, pero no guarda nada y avisa en pantalla.

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
  (app)/sueldos/      Panel de liquidación
  (app)/legajos/      Fichas de empleados
  (app)/historial/    Recibos emitidos
  recibo/[id]/        Recibo imprimible (sin navegación, va a papel)
components/
  sueldos/            Componentes del panel
  legajos/            Alta y listado de legajos
  historial/          Tabla de liquidaciones
  recibo/             Documento imprimible
  ui/                 shadcn/ui (se regeneran con la CLI, no se editan a mano)
lib/
  liquidacion.ts      Cálculo de haberes, descuentos y neto (funciones puras)
  planillas.ts        Carga y tipado de las planillas
  periodos.ts         Antigüedad y fechas por período
  letras.ts           Importes en letras para el recibo
  format.ts           Formato de moneda es-AR
  tipos.ts            Legajo, snapshot y liquidación guardada
  datos/              Lecturas de Supabase (server-only)
  supabase/           Clientes de Supabase (browser / server / proxy)
supabase/migrations/  Esquema de la base
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

## Legajos, recibos e historial

**Legajos.** La ficha de cada persona que liquidás: cargo, categoría, fecha de
ingreso, consorcio y los valores habituales (UF, adicionales, aportes). Al
liquidar se elige de una lista y el formulario se precarga solo. La antigüedad
sale de la fecha de ingreso, no se carga a mano, y se recalcula según el período.

**Cálculo rápido.** Un botón arriba del panel apaga todo eso: no pide empleado,
no guarda y no toca el historial. Es la calculadora suelta, para sacar un número
de una persona puntual.

**Recibo.** "Guardar y emitir recibo" persiste la liquidación y lleva a
`/recibo/[id]`: una hoja A4 con original y duplicado, importe en letras y
espacios de firma. El PDF sale del diálogo de impresión eligiendo "Guardar como
PDF" — así el mismo documento sirve para imprimir y firmar por duplicado.

**Historial.** Todo recibo emitido queda listado, buscable por empleado, período
o consorcio.

Dos decisiones que conviene conocer:

- **El historial guarda un snapshot completo**, no los datos de entrada. Si
  mañana se corrige una planilla o cambia una regla de cálculo, un recibo ya
  emitido no se mueve: es el registro de lo que efectivamente se pagó.
- **El guardado recalcula en el servidor.** La acción no acepta los totales que
  manda el navegador: vuelve a llamar a `calcularLiquidacion` con los mismos
  datos de entrada, así lo que queda emitido siempre es lo que produce el motor
  de cálculo.

## Contribuciones patronales

Desde el 1° de junio de 2026 el recibo debe informar, por trabajador, las
contribuciones a cargo del empleador y el costo laboral total: lo estableció la
Ley 27.802 (inciso j del art. 140 LCT) y lo reglamentó el Decreto 407/2026. En
el recibo se imprime bajo "ART. 52 BIS LCT".

`lib/costo-laboral.ts` calcula los diez conceptos. Las alícuotas son las del
régimen reducido del Decreto 814/2001 —el que aplica a los consorcios— más los
conceptos del CCT 589/10:

| Concepto | Alícuota |
| --- | --- |
| Jubilación (SIPA) | 10,77% |
| I.N.S.S.J.P (Ley 19.032) | 1,59% |
| Asignaciones familiares (SUAF) | 5,64% |
| Obra social (adicional) | 6% |
| ART (alícuota) | de la póliza |
| Caja protección familia | 1,50% |
| FATERYH (F.M.V.D.D) | 4,75% |
| SERACARH | 0,50% |
| ART (monto fijo) | importe fijo |
| Seguro de vida obligatorio | importe fijo |

Los tres valores que dependen de la póliza de cada consorcio —alícuota de ART,
monto fijo de ART y seguro de vida— se cargan en el legajo. El resto no se
configura: son de ley o de convenio.

Los tests reproducen al centavo las contribuciones de un recibo real de
propiedad horizontal del período 06-2026.

## Cálculo

`lib/liquidacion.ts` concentra todas las reglas: básico por cargo y categoría,
plus de antigüedad (reducido para media jornada), vivienda, adicionales por tarea,
horas extra sobre el valor hora (básico / 200) y aportes tomados de la planilla.

Los tests (`npm test`) verifican, entre otras cosas, que las filas del recibo
sumen exactamente sus totales y que el neto cierre con bruto − descuentos +
adicional no remunerativo.
