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
- Output Directory: `dist/ng-tailadmin`

## Rutas

El archivo `vercel.json` está configurado para redirigir todas las rutas a `index.html` para que Angular Router funcione correctamente.

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

