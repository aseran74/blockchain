import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-parameters',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="space-y-6">
      <header class="space-y-2">
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Parámetros del consenso</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Ajustes de tolerancia, ventanas de epoch, timeout y distribución de transacciones para el protocolo PnV.
        </p>
      </header>

      <div class="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-10 text-center dark:border-gray-700 dark:bg-gray-900/60">
        <h2 class="text-lg font-medium text-gray-700 dark:text-gray-200">Configurador en construcción</h2>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Permitirá sincronizar parámetros con Supabase y versionarlos por rama o entorno.
        </p>
      </div>
    </section>
  `,
})
export class ParametersComponent {}

