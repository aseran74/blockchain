import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-block-groups',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="space-y-6">
      <header class="space-y-2">
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Grupos de bloques</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Visualiza el histórico de grupos generados por el consenso paralelo PnV.
          Aquí integraremos datos persistentes de Supabase para trazabilidad completa.
        </p>
      </header>

      <div class="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-10 text-center dark:border-gray-700 dark:bg-gray-900/60">
        <h2 class="text-lg font-medium text-gray-700 dark:text-gray-200">Diseño en progreso</h2>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Esta vista mostrará el timeline de finalización, métricas de latencia y auditoría de cada bloque almacenado en Supabase.
        </p>
      </div>
    </section>
  `,
})
export class BlockGroupsComponent {}

