import { inject, InjectionToken } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './supabase.types';

declare const process:
  | undefined
  | {
      env: Record<string, string | undefined>;
    };

const readEnv = (key: string): string | undefined => {
  // 1. Intentar desde globalThis (donde main.ts las coloca)
  const fromGlobal = (globalThis as unknown as Record<string, string | undefined>)[key];
  if (fromGlobal) {
    return fromGlobal;
  }

  // 2. Intentar desde window.__env
  const windowEnv = (globalThis as unknown as { __env?: Record<string, string | undefined> }).__env;
  if (windowEnv?.[key]) {
    return windowEnv[key];
  }

  // 3. Intentar desde process.env (build time)
  const fromProcess = typeof process !== 'undefined' ? process?.env?.[key] : undefined;
  if (fromProcess) {
    return fromProcess;
  }

  // 4. Intentar desde import.meta.env (Vite/Angular)
  const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env;
  if (metaEnv?.[key]) {
    return metaEnv[key];
  }

  return undefined;
};

const resolveConfig = () => {
  const url =
    readEnv('NG_APP_SUPABASE_URL') ??
    readEnv('SUPABASE_URL');
  const anonKey =
    readEnv('NG_APP_SUPABASE_ANON_KEY') ??
    readEnv('SUPABASE_ANON_KEY');

  if (!url) {
    throw new Error('No se encontró la variable NG_APP_SUPABASE_URL (o SUPABASE_URL).');
  }

  if (!anonKey) {
    throw new Error('No se encontró la variable NG_APP_SUPABASE_ANON_KEY (o SUPABASE_ANON_KEY).');
  }

  return { url, anonKey };
};

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient<Database>>('SUPABASE_CLIENT', {
  providedIn: 'root',
  factory: () => {
    const { url, anonKey } = resolveConfig();
    return createClient<Database>(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  },
});

export const injectSupabase = () => inject(SUPABASE_CLIENT);

