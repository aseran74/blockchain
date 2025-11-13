# Configuración para Vercel

## Variables de Entorno Requeridas

En el dashboard de Vercel, configura las siguientes variables de entorno:

1. `NG_APP_SUPABASE_URL` - URL de tu proyecto Supabase
2. `NG_APP_SUPABASE_ANON_KEY` - Clave anónima de Supabase

### Pasos para configurar en Vercel:

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega las variables:
   - `NG_APP_SUPABASE_URL` = `https://yqixbognyxgpjuzzrefo.supabase.co`
   - `NG_APP_SUPABASE_ANON_KEY` = (tu clave anónima de Supabase)

## Build Command

Vercel detectará automáticamente Angular y usará:
- Build Command: `ng build --configuration production`
- Output Directory: `dist/ng-tailadmin/browser` (Angular 17+ genera archivos en la subcarpeta `browser`)

## Rutas

El archivo `vercel.json` está configurado para redirigir todas las rutas a `index.html` para que Angular Router funcione correctamente.

## Solución de Problemas 404

Si experimentas errores 404 en producción:

1. **Verifica la configuración del proyecto en Vercel Dashboard:**
   - Ve a Settings → General
   - Verifica que "Output Directory" esté configurado como `dist/ng-tailadmin/browser`
   - Verifica que "Build Command" sea `ng build --configuration production`

2. **Promociona el deployment correcto:**
   - Ve a Deployments
   - Encuentra el deployment que funciona (preview)
   - Haz clic en los tres puntos (⋯) → "Promote to Production"

3. **Verifica que el index.html se genere correctamente:**
   - En los logs de build, busca "Output location"
   - Debe mostrar `/vercel/path0/dist/ng-tailadmin`
   - El archivo `index.html` debe estar en esa ubicación

4. **Limpia la caché:**
   - En Vercel Dashboard → Settings → General
   - Haz clic en "Clear Build Cache"
   - Realiza un nuevo deployment

## Componentes Incluidos

- ✅ Dashboard
- ✅ Grupos de Bloques
- ✅ Transacciones
- ✅ Nodos y Roles
- ✅ Gobernanza
- ✅ Parámetros
- ✅ Wallet Votalia
- ✅ Proyección TPS Global
- ✅ Simulación Solar
- ✅ Simulador Notaría
- ✅ Simulador Elecciones (5 fases)
- ✅ Simulación Smart Contracts

