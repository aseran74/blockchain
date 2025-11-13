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

// Escribir archivo JSON
fs.writeFileSync(outputFile, JSON.stringify(envConfig, null, 2), 'utf8');

// También inyectar las variables directamente en index.html como script inline
const indexHtmlPath = path.join(__dirname, '..', 'src', 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  
  // Remover script anterior si existe
  indexHtml = indexHtml.replace(/<script[^>]*window\.__ENV_CONFIG__[^<]*<\/script>/gi, '');
  
  // Crear script inline con las variables (debe ejecutarse ANTES de que Angular cargue)
  const envScript = `  <script>
    (function() {
      window.__ENV_CONFIG__ = ${JSON.stringify(envConfig)};
      // Asignar directamente a globalThis y window para máxima compatibilidad
      if (typeof globalThis !== 'undefined') {
        Object.assign(globalThis, window.__ENV_CONFIG__);
      }
      // También asignar individualmente para acceso directo
      globalThis.NG_APP_SUPABASE_URL = window.__ENV_CONFIG__.NG_APP_SUPABASE_URL;
      globalThis.NG_APP_SUPABASE_ANON_KEY = window.__ENV_CONFIG__.NG_APP_SUPABASE_ANON_KEY;
      globalThis.SUPABASE_URL = window.__ENV_CONFIG__.SUPABASE_URL;
      globalThis.SUPABASE_ANON_KEY = window.__ENV_CONFIG__.SUPABASE_ANON_KEY;
      console.log('🔧 Variables de entorno inyectadas en HTML:', Object.keys(window.__ENV_CONFIG__).join(', '));
    })();
  </script>`;
  
  // Insertar antes del cierre de </head>
  if (indexHtml.includes('</head>')) {
    indexHtml = indexHtml.replace('</head>', `${envScript}\n</head>`);
  } else if (indexHtml.includes('<app-root>')) {
    indexHtml = indexHtml.replace('<app-root>', `${envScript}\n  <app-root>`);
  }
  
  fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
  console.log('✅ Variables inyectadas en index.html');
}

console.log('✅ env-config.json generado exitosamente');
console.log('📁 Ubicación:', outputFile);
console.log('🔑 URL:', supabaseUrl.substring(0, 30) + '...');
console.log('🔑 Key:', supabaseAnonKey.substring(0, 20) + '...');
