import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { merge, interval, of, Subject } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { SupabaseDataService } from '../../../../core/supabase-data.service';

type ConnectionState = 'checking' | 'online' | 'offline';

@Component({
  selector: 'app-supabase-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition"
      [ngClass]="statusClass()"
    >
      <span class="inline-flex h-2 w-2 rounded-full" [ngClass]="dotClass()"></span>
      <span class="capitalize">Supabase: {{ statusLabel() }}</span>
      @if (lastUpdated()) {
        <span class="text-[10px] text-gray-400 dark:text-gray-500">
          {{ lastUpdated() | date: 'HH:mm:ss' }}
        </span>
      }
      <button
        type="button"
        class="rounded-full bg-transparent px-2 py-1 text-[10px] font-semibold text-brand-500 hover:bg-brand-500/10"
        (click)="refresh()"
      >
        Reintentar
      </button>
    </div>
  `,
})
export class SupabaseStatusComponent {
  private readonly dataService = inject(SupabaseDataService);
  private readonly manualRefresh$ = new Subject<void>();

  private readonly status$ = merge(
    of<ConnectionState>('checking'),
    merge(of(void 0), interval(15000), this.manualRefresh$).pipe(
      map(() => void 0),
      startWith(void 0),
      switchMap(() => this.dataService.checkConnection())
    )
  );

  readonly status = toSignal(this.status$, { initialValue: 'checking' as ConnectionState });
  readonly lastUpdated = signal<Date | null>(null);

  constructor() {
    effect(() => {
      const current = this.status();
      if (current !== 'checking') {
        this.lastUpdated.set(new Date());
      }
    }, { allowSignalWrites: true });
  }

  readonly statusLabel = computed(() => {
    switch (this.status()) {
      case 'online':
        return 'en línea';
      case 'offline':
        return 'offline';
      default:
        return 'verificando';
    }
  });

  readonly statusClass = computed(() => {
    switch (this.status()) {
      case 'online':
        return 'border-emerald-400/60 bg-emerald-500/10 text-emerald-500 dark:border-emerald-500/40 dark:text-emerald-300';
      case 'offline':
        return 'border-rose-400/60 bg-rose-500/10 text-rose-500 dark:border-rose-500/40 dark:text-rose-300';
      default:
        return 'border-amber-400/60 bg-amber-500/10 text-amber-500 dark:border-amber-500/40 dark:text-amber-300';
    }
  });

  readonly dotClass = computed(() => {
    switch (this.status()) {
      case 'online':
        return 'bg-emerald-500 animate-pulse';
      case 'offline':
        return 'bg-rose-500';
      default:
        return 'bg-amber-400 animate-pulse';
    }
  });

  refresh() {
    this.manualRefresh$.next();
  }
}
