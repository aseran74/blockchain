import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-nodes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="space-y-6">
      <header class="space-y-2">
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Nodos y roles</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Administración de bookkeepers, votantes, candidatos y usuarios conectados al consenso PnV.
        </p>
      </header>

      <div class="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-10 text-center dark:border-gray-700 dark:bg-gray-900/60">
        <h2 class="text-lg font-medium text-gray-700 dark:text-gray-200">Configuración pendiente</h2>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Integraremos vistas para altas/bajas, métricas de desempeño y sincronización con Supabase.
        </p>
      </div>
    </section>
  `,
})
export class NodesComponent {}

