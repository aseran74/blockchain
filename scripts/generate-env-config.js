const fs = require('fs');
const path = require('path');

// Leer variables de entorno de Vercel
const supabaseUrl = process.env.NG_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NG_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Log para debugging
console.log('🔍 Verificando variables de entorno...');
console.log('NG_APP_SUPABASE_URL:', supabaseUrl ? '✓ Encontrada' : '✗ No encontrada');
console.log('NG_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Encontrada' : '✗ No encontrada');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Variables de entorno no encontradas');
  console.error('NG_APP_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('NG_APP_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
  console.error('💡 Asegúrate de configurar las variables en Vercel Dashboard → Settings → Environment Variables');
  process.exit(1);
}

// Crear objeto de configuración
const envConfig = {
  NG_APP_SUPABASE_URL: supabaseUrl,
  NG_APP_SUPABASE_ANON_KEY: supabaseAnonKey,
  SUPABASE_URL: supabaseUrl,
  SUPABASE_ANON_KEY: supabaseAnonKey
};

// Directorio de salida (public para que sea accesible)
const outputDir = path.join(__dirname, '..', 'public');
const outputFile = path.join(outputDir, 'env-config.json');

// Crear directorio si no existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Escribir archivo
fs.writeFileSync(outputFile, JSON.stringify(envConfig, null, 2), 'utf8');

console.log('✅ env-config.json generado exitosamente');
console.log('📁 Ubicación:', outputFile);
console.log('🔑 URL:', supabaseUrl.substring(0, 30) + '...');
console.log('🔑 Key:', supabaseAnonKey.substring(0, 20) + '...');
