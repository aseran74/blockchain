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

const loadRuntimeEnv = async () => {
  try {
    const response = await fetch('/env-config.json', { cache: 'no-cache' });
    if (!response.ok) {
      return;
    }
    const runtimeEnv = (await response.json()) as Record<string, string | undefined>;
    assignEnvToGlobals(runtimeEnv);
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

const bootstrap = async () => {
  await loadRuntimeEnv();
  bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
};

bootstrap();
