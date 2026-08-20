#!/bin/bash
# Verifica que un proyecto de Supabase este listo para SueldosPH.
# Uso: bash verificar-supabase.sh <URL_DEL_PROYECTO> <CLAVE_PUBLICABLE>
U="$1"; K="$2"
[ -z "$U" ] || [ -z "$K" ] && { echo "Faltan argumentos: <url> <clave>"; exit 1; }

echo "Proyecto: $U"
echo ""
echo "=== tablas y columnas que usa la app ==="
LEG="id,nombre,cuil,cargo_id,categoria,fecha_ingreso,consorcio_nombre,consorcio_cuit,uf,adic_rem,adic_no_rem,adicionales,aportes,activo,notas,art_alicuota,art_monto_fijo,seguro_vida,detraccion,contribucion_solidaria,created_at,updated_at"
LIQ="id,legajo_id,periodo,snapshot,empleado_nombre,bruto,descuentos,neto,created_at"
printf "  legajos        %s\n" "$(curl -s -o /dev/null -w '%{http_code}' "$U/rest/v1/legajos?select=$LEG" -H "apikey: $K")"
printf "  liquidaciones  %s\n" "$(curl -s -o /dev/null -w '%{http_code}' "$U/rest/v1/liquidaciones?select=$LIQ" -H "apikey: $K")"

echo ""
echo "=== RLS (sin sesion no debe devolver filas) ==="
printf "  legajos        %s\n" "$(curl -s "$U/rest/v1/legajos?select=id" -H "apikey: $K")"
printf "  liquidaciones  %s\n" "$(curl -s "$U/rest/v1/liquidaciones?select=id" -H "apikey: $K")"

echo ""
echo "=== auth ==="
curl -s "$U/auth/v1/settings" -H "apikey: $K" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.log('  registro publico deshabilitado :', j.disable_signup);console.log('  proveedor email activo         :', j.external?.email);})"

echo ""
echo "=== latencia (3 intentos) ==="
for i in 1 2 3; do curl -s -o /dev/null -w "  %{time_total}s\n" "$U/auth/v1/settings" -H "apikey: $K"; done
