import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { SupabaseDataService, DemoDashboardState } from '../../core/supabase-data.service';
import type { Tables } from '../../core/supabase.types';

type ParameterRow = Tables<'pnv_parameters'>;

type ParameterStatus = ParameterRow['status'];

type StatusFilter = 'all' | ParameterStatus;

interface ParameterView {
  id: string;
  key: string;
  value: unknown;
  status: ParameterStatus;
  statusLabel: string;
  version: number;
  activatedAt: string | null;
  updatedAt: string | null;
}

interface ParametersSummary {
  total: number;
  active: number;
  draft: number;
  pending: number;
  retired: number;
}

type ParametersPayload = {
  state: DemoDashboardState | null;
  parameters: ParameterRow[];
};

@Component({
  selector: 'app-parameters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parameters.component.html',
})
export class ParametersComponent {
  private readonly supabase = inject(SupabaseDataService);
  private readonly refreshTrigger = new Subject<void>();

  readonly loadError = signal<string | null>(null);
  readonly selectedStatus = signal<StatusFilter>('all');
  readonly searchTerm = signal('');

  private readonly stateWithParameters = toSignal(
    this.refreshTrigger.pipe(
      startWith(undefined),
      switchMap(() =>
        forkJoin({
          state: this.supabase.getDemoDashboardState().pipe(
            map(({ data, error }) => {
              if (error) {
                throw new Error(error.message ?? 'No se pudo cargar el estado');
              }
              return data ?? null;
            })
          ),
          parameters: this.supabase.getParameters().pipe(
            map((response) => {
              if (response.error) {
                throw new Error(response.error.message ?? 'No se pudieron cargar los parámetros');
              }
              return (response.data ?? []) as ParameterRow[];
            })
          ),
        }).pipe(
          catchError((err) => {
            this.loadError.set(err?.message ?? 'No se pudieron cargar los parámetros');
            return of({ state: null, parameters: [] as ParameterRow[] });
          })
        )
      )
    ),
    { initialValue: { state: null, parameters: [] as ParameterRow[] } as ParametersPayload }
  );

  private readonly combined = computed<ParametersPayload>(() =>
    this.stateWithParameters() ?? { state: null, parameters: [] }
  );

  readonly dashboardState = computed(() => this.combined().state);

  readonly parameters = computed<ParameterView[]>(() => {
    const parameters = this.combined().parameters;

    return parameters.map((parameter) => ({
      id: parameter.id,
      key: parameter.key,
      value: parameter.value,
      status: parameter.status,
      statusLabel: this.statusLabel(parameter.status),
      version: parameter.version,
      activatedAt: parameter.activated_at,
      updatedAt: parameter.updated_at,
    } satisfies ParameterView));
  });

  readonly filteredParameters = computed(() => {
    const status = this.selectedStatus();
    const term = this.searchTerm().trim().toLowerCase();

    return this.parameters().filter((parameter) => {
      const matchesStatus = status === 'all' ? true : parameter.status === status;
      const matchesTerm = term ? parameter.key.toLowerCase().includes(term) : true;
      return matchesStatus && matchesTerm;
    });
  });

  readonly summary = computed<ParametersSummary>(() => {
    const params = this.parameters();
    return {
      total: params.length,
      active: params.filter((p) => p.status === 'active').length,
      draft: params.filter((p) => p.status === 'draft').length,
      pending: params.filter((p) => p.status === 'pending').length,
      retired: params.filter((p) => p.status === 'retired').length,
    } satisfies ParametersSummary;
  });

  readonly majorityThreshold = computed(() => {
    const nc = Number(this.dashboardState()?.system?.nc ?? 0);
    return Math.floor(nc / 2) + 1;
  });

  constructor() {
    this.refresh();
  }

  refresh() {
    this.loadError.set(null);
    this.refreshTrigger.next();
  }

  setStatus(filter: StatusFilter) {
    this.selectedStatus.set(filter);
  }

  onSearchChange(value: string) {
    this.searchTerm.set(value);
  }

  clearSearch() {
    this.searchTerm.set('');
  }

  formatTimestamp(value: string | null) {
    if (!value) {
      return '—';
    }
    return new Date(value).toLocaleString();
  }

  statusBadgeClass(status: ParameterStatus) {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300';
      case 'draft':
        return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300';
      case 'pending':
        return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300';
      case 'retired':
        return 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400';
    }
  }

  private statusLabel(status: ParameterStatus) {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'draft':
        return 'Borrador';
      case 'pending':
        return 'Pendiente';
      case 'retired':
        return 'Retirado';
      default:
        return status;
    }
  }
}

