import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { register as registerSwiperElements } from 'swiper/element/bundle';

// Save original method
// const originalAddEventListener = EventTarget.prototype.addEventListener;

// // Override
// EventTarget.prototype.addEventListener = function (
//   type: string,
//   listener: EventListenerOrEventListenerObject,
//   options?: boolean | AddEventListenerOptions
// ) {
//   // Force passive: false for specific events
//   const needsPassiveFalse = ['touchstart', 'touchmove', 'wheel'].includes(type);

//   if (needsPassiveFalse) {
//     if (typeof options === 'boolean' || options === undefined) {
//       options = { passive: false };
//     } else if (typeof options === 'object') {
//       options.passive = false;
//     }
//   }

//   return originalAddEventListener.call(this, type, listener, options);
// };

registerSwiperElements();

const assignEnvToGlobals = (source: Record<string, string | undefined> = {}) => {
  const globalRef =
    (globalThis as unknown as Record<string, string | undefined>) ?? {};
  const windowRef =
    (globalThis as unknown as { __env?: Record<string, string | undefined> });

  windowRef.__env = {
    ...(windowRef.__env ?? {}),
    ...source,
  };

  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'string' && value.length > 0) {
      globalRef[key] = value;
    }
  }
};

const loadRuntimeEnv = async (): Promise<void> => {
  try {
    const response = await fetch('/env-config.json', { cache: 'no-cache' });
    if (!response.ok) {
      console.warn(`⚠️ No se pudo cargar env-config.json (status: ${response.status}), usando variables de entorno del build`);
      return;
    }
    const runtimeEnv = (await response.json()) as Record<string, string | undefined>;
    if (runtimeEnv && Object.keys(runtimeEnv).length > 0) {
      assignEnvToGlobals(runtimeEnv);
      console.log('✅ Variables de entorno cargadas desde env-config.json');
      console.log('📋 Variables disponibles:', Object.keys(runtimeEnv).join(', '));
    } else {
      console.warn('⚠️ env-config.json está vacío o no contiene variables');
    }
  } catch (error) {
    console.error('❌ Error al cargar env-config.json:', error);
    console.warn('💡 Verifica que el archivo exista y que las variables estén configuradas en Vercel');
  }
};

const metaEnv =
  ((import.meta as unknown as { env?: Record<string, string | undefined> })?.env) ??
  {};

if (metaEnv) {
assignEnvToGlobals({
  NG_APP_SUPABASE_URL:
    metaEnv['NG_APP_SUPABASE_URL'] ??
    metaEnv['SUPABASE_URL'],
  NG_APP_SUPABASE_ANON_KEY:
    metaEnv['NG_APP_SUPABASE_ANON_KEY'] ??
    metaEnv['SUPABASE_ANON_KEY'],
});
}

// Cargar variables de entorno ANTES de inicializar Angular
const bootstrap = async () => {
  // Cargar env-config.json primero
  await loadRuntimeEnv();
  
  // Verificar que las variables estén disponibles antes de continuar
  const url = (globalThis as unknown as Record<string, string | undefined>)['NG_APP_SUPABASE_URL'] ||
              (globalThis as unknown as Record<string, string | undefined>)['SUPABASE_URL'];
  const key = (globalThis as unknown as Record<string, string | undefined>)['NG_APP_SUPABASE_ANON_KEY'] ||
              (globalThis as unknown as Record<string, string | undefined>)['SUPABASE_ANON_KEY'];
  
  if (!url || !key) {
    console.error('❌ Variables de entorno no disponibles después de cargar env-config.json');
    console.error('URL:', url ? '✓' : '✗');
    console.error('KEY:', key ? '✓' : '✗');
    
    // Intentar leer desde window.__env como último recurso
    const windowEnv = (globalThis as unknown as { __env?: Record<string, string | undefined> }).__env;
    if (windowEnv) {
      console.log('🔄 Intentando cargar desde window.__env...');
      assignEnvToGlobals(windowEnv);
      const retryUrl = (globalThis as unknown as Record<string, string | undefined>)['NG_APP_SUPABASE_URL'] ||
                      (globalThis as unknown as Record<string, string | undefined>)['SUPABASE_URL'];
      const retryKey = (globalThis as unknown as Record<string, string | undefined>)['NG_APP_SUPABASE_ANON_KEY'] ||
                      (globalThis as unknown as Record<string, string | undefined>)['SUPABASE_ANON_KEY'];
      if (retryUrl && retryKey) {
        console.log('✅ Variables cargadas desde window.__env');
        return;
      }
    }
    
    console.error('💡 Asegúrate de configurar las variables en Vercel Dashboard → Settings → Environment Variables');
    console.error('💡 Variables requeridas: NG_APP_SUPABASE_URL y NG_APP_SUPABASE_ANON_KEY');
  } else {
    console.log('✅ Variables de entorno disponibles correctamente');
  }
  
  bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
};

bootstrap();
