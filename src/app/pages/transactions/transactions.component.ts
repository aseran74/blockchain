import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="space-y-6">
      <header class="space-y-2">
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Transacciones</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Gestión y monitoreo de transacciones distribuidas. Aquí conectaremos filtros, colas pendientes y resultados confirmados usando Supabase como data lake.
        </p>
      </header>

      <div class="rounded-2xl border border-dashed border-gray-200 bg-white/60 p-10 text-center dark:border-gray-700 dark:bg-gray-900/60">
        <h2 class="text-lg font-medium text-gray-700 dark:text-gray-200">Listado pendiente</h2>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Próximamente incorporaremos tablas reactivas, filtros por estado y registros históricos persistentes.
        </p>
      </div>
    </section>
  `,
})
export class TransactionsComponent {}

