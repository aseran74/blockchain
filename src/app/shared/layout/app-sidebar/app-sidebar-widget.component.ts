import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar-widget',
  template: `
    <div
      class="mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03]"
    >
      <div class="mb-3 flex justify-center">
        <img
          src="/images/logo/Votalia.png"
          alt="Votalia"
          class="h-14 w-14 object-contain filter brightness-0 invert"
        />
      </div>
      <h3 class="mb-2 font-semibold text-gray-900 dark:text-white">
        Votalia PnV Demo
      </h3>
      <p class="text-gray-500 text-theme-sm dark:text-gray-400">
        Visualiza consenso paralelo, nodos y transacciones sobre Supabase con un estilo Tailwind grids-first.
      </p>
    </div>
  `
})
export class SidebarWidgetComponent {} 