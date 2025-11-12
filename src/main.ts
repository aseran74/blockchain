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
      console.warn('No se pudo cargar env-config.json, usando variables de entorno del build');
      return;
    }
    const runtimeEnv = (await response.json()) as Record<string, string | undefined>;
    assignEnvToGlobals(runtimeEnv);
    console.log('✅ Variables de entorno cargadas desde env-config.json');
  } catch (error) {
    console.warn('No se pudo cargar env-config.json:', error);
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
      assignEnvToGlobals(windowEnv);
    }
  }
  
  bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
};

bootstrap();
