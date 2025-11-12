import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { SupabaseDataService, DemoDashboardState } from '../../core/supabase-data.service';
import type { Database } from '../../core/supabase.types';

type BlockGroupStatus = Database['public']['Enums']['pnv_block_group_status'];

interface BlockGroupView {
  id: string;
  height: number;
  status: BlockGroupStatus;
  statusLabel: string;
  leaderSlot: number | null;
  leaderName: string;
  txCount: number;
  approvals: number;
  rejections: number;
  consensusTimeMs: number | null;
  createdAt: string;
  confirmedAt: string | null;
  consensusStartAt: string | null;
  tcutAt: string | null;
  isActive: boolean;
}

interface VoteRecord {
  block_group_id: string;
  approve: boolean;
}

type StatusFilter = 'all' | BlockGroupStatus;

@Component({
  selector: 'app-block-groups',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './block-groups.component.html',
})
export class BlockGroupsComponent {
  private readonly supabase = inject(SupabaseDataService);
  private readonly refreshTrigger = new Subject<void>();

  readonly loadError = signal<string | null>(null);
  readonly selectedStatus = signal<StatusFilter>('all');
  readonly searchTerm = signal('');

  readonly dashboardState = toSignal(
    this.refreshTrigger.pipe(
      startWith(undefined),
      switchMap(() =>
        this.supabase.getDemoDashboardState().pipe(
          map(({ data, error }) => {
            if (error) {
              throw new Error(error.message ?? 'No se pudo cargar el estado de bloques');
            }
            return data ?? null;
          }),
          catchError((err) => {
            this.loadError.set(err?.message ?? 'No se pudo cargar el estado de bloques');
            return [null];
          })
        )
      )
    ),
    { initialValue: null as DemoDashboardState | null }
  );

  readonly blockGroups = computed<BlockGroupView[]>(() => {
    const data = this.dashboardState();
    if (!data) {
      return [];
    }
    const votesByGroup = new Map<string, VoteRecord[]>();
    for (const vote of data.votes ?? []) {
      const list = votesByGroup.get(vote.block_group_id) ?? [];
      list.push(vote as VoteRecord);
      votesByGroup.set(vote.block_group_id, list);
    }

    return (data.blockGroups ?? []).map((group) => {
      const groupVotes = votesByGroup.get(group.id) ?? [];
      const approvals = groupVotes.filter((vote) => vote.approve).length;
      const rejections = groupVotes.filter((vote) => !vote.approve).length;

      return {
        id: group.id,
        height: group.height,
        status: group.status,
        statusLabel: this.statusLabel(group.status),
        leaderSlot: group.leader_slot,
        leaderName: group.butler_name ?? (group.leader_slot !== null ? `Slot ${group.leader_slot}` : '—'),
        txCount: Number(group.tx_count ?? 0),
        approvals,
        rejections,
        consensusTimeMs: group.consensus_time_ms,
        createdAt: group.created_at,
        confirmedAt: group.confirmed_at,
        consensusStartAt: group.consensus_start_at,
        tcutAt: group.tcut_at,
        isActive: group.status === 'voting' || group.status === 'pending',
      } satisfies BlockGroupView;
    });
  });

  readonly filteredBlockGroups = computed(() => {
    const status = this.selectedStatus();
    const term = this.searchTerm().trim().toLowerCase();

    return this.blockGroups()
      .filter((group) =>
        (status === 'all' ? true : group.status === status) &&
        (term
          ? `${group.height}${group.id}${group.leaderName}`
              .toLowerCase()
              .includes(term)
          : true)
      )
      .sort((a, b) => b.height - a.height);
  });

  readonly summary = computed(() => {
    const groups = this.blockGroups();
    const total = groups.length;
    const confirmed = groups.filter((group) => group.status === 'confirmed').length;
    const active = groups.filter((group) => group.isActive).length;
    const averageConsensus = this.averageConsensus(groups);

    return { total, confirmed, active, averageConsensus };
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

  statusLabel(status: BlockGroupStatus) {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'voting':
        return 'En votación';
      case 'pending':
        return 'Pendiente';
      case 'timeout':
        return 'Timeout';
      default:
        return status;
    }
  }

  statusBadgeClass(status: BlockGroupStatus) {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300';
      case 'voting':
        return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300';
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300';
      case 'timeout':
        return 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300';
    }
  }

  consensusDurationLabel(group: BlockGroupView) {
    if (group.consensusTimeMs && group.consensusTimeMs > 0) {
      if (group.consensusTimeMs >= 1000) {
        return `${(group.consensusTimeMs / 1000).toFixed(2)} s`;
      }
      return `${group.consensusTimeMs} ms`;
    }
    if (group.consensusStartAt && group.isActive) {
      return 'En progreso';
    }
    return '—';
  }

  formatTimestamp(value: string | null) {
    if (!value) {
      return '—';
    }
    return new Date(value).toLocaleString();
  }

  private averageConsensus(groups: BlockGroupView[]) {
    const finalized = groups.filter((group) => (group.consensusTimeMs ?? 0) > 0);
    if (finalized.length === 0) {
      return '—';
    }
    const avg = finalized.reduce((acc, group) => acc + (group.consensusTimeMs ?? 0), 0) / finalized.length;
    return this.consensusDurationLabel({ ...finalized[0], consensusTimeMs: Math.round(avg) });
  }
}

