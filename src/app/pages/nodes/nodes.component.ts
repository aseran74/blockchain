import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { SupabaseDataService, DemoDashboardState } from '../../core/supabase-data.service';

interface ButlerView {
  slot: number;
  name: string;
  stake: number;
  score: number;
  status: string | null;
  blocksProduced: number;
  lastSeen: string | null;
  isCurrent: boolean;
}

interface CommissionerView {
  id: string;
  name: string;
  region: string | null;
  online: boolean;
  voteWeight: number;
}

interface CandidateView {
  id: string;
  name: string;
  stake: number;
  score: number;
  recommended: boolean;
  createdAt: string;
}

interface RoleSummary {
  totalButlers: number;
  activeButlers: number;
  onlineCommissioners: number;
  totalCommissioners: number;
  totalCandidates: number;
}

@Component({
  selector: 'app-nodes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nodes.component.html',
})
export class NodesComponent {
  private readonly supabase = inject(SupabaseDataService);
  private readonly refreshTrigger = new Subject<void>();

  readonly loadError = signal<string | null>(null);

  readonly dashboardState = toSignal(
    this.refreshTrigger.pipe(
      startWith(undefined),
      switchMap(() =>
        this.supabase.getDemoDashboardState().pipe(
          map(({ data, error }) => {
            if (error) {
              throw new Error(error.message ?? 'No se pudo cargar la información de nodos');
            }
            return data ?? null;
          }),
          catchError((err) => {
            this.loadError.set(err?.message ?? 'No se pudo cargar la información de nodos');
            return [null];
          })
        )
      )
    ),
    { initialValue: null as DemoDashboardState | null }
  );

  readonly butlers = computed<ButlerView[]>(() => {
    const state = this.dashboardState();
    const system = state?.system;
    if (!state?.butlers) {
      return [];
    }
    return state.butlers.map((butler) => ({
      slot: butler.slot_index,
      name: butler.name ?? `Slot ${butler.slot_index}`,
      stake: Number(butler.stake ?? 0),
      score: Number(butler.score ?? 0),
      status: butler.status,
      blocksProduced: Number(butler.blocks_produced ?? 0),
      lastSeen: butler.last_seen_at,
      isCurrent: system ? butler.slot_index === system.current_butler_slot : false,
    }));
  });

  readonly commissioners = computed<CommissionerView[]>(() => {
    const state = this.dashboardState();
    return (state?.commissioners ?? []).map((comm) => ({
      id: comm.id,
      name: comm.name,
      region: comm.region,
      online: comm.online,
      voteWeight: Number(comm.vote_weight ?? 0),
    }));
  });

  readonly candidates = computed<CandidateView[]>(() => {
    const state = this.dashboardState();
    return (state?.candidates ?? []).map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      stake: Number(candidate.stake ?? 0),
      score: Number(candidate.score ?? 0),
      recommended: candidate.recommended,
      createdAt: candidate.created_at,
    }));
  });

  readonly summary = computed<RoleSummary>(() => {
    const butlers = this.butlers();
    const commissioners = this.commissioners();
    const candidates = this.candidates();

    return {
      totalButlers: butlers.length,
      activeButlers: butlers.filter((butler) => butler.status === 'active').length,
      onlineCommissioners: commissioners.filter((comm) => comm.online).length,
      totalCommissioners: commissioners.length,
      totalCandidates: candidates.length,
    } satisfies RoleSummary;
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

  formatNumber(value: number) {
    return new Intl.NumberFormat('es-ES', {
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatTimestamp(value: string | null) {
    if (!value) {
      return '—';
    }
    return new Date(value).toLocaleString();
  }

  commissionerStatusClass(online: boolean) {
    return online
      ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300'
      : 'bg-gray-500/10 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400';
  }

  scoreBadgeClass(score: number) {
    if (score >= 90) {
      return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300';
    }
    if (score >= 75) {
      return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300';
    }
    return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300';
  }
}

