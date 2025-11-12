import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { SupabaseDataService, DemoDashboardState } from '../../core/supabase-data.service';
import type { Tables } from '../../core/supabase.types';

type VoteOutcomeFilter = 'all' | 'approved' | 'rejected';

type BlockStatus = Tables<'pnv_block_groups'>['status'];

type VoteRecord = {
  id: string;
  blockId: string;
  blockHeight: number | null;
  blockStatus: BlockStatus | null;
  commissionerId: string;
  commissionerName: string;
  approve: boolean;
  votedAt: string;
};

@Component({
  selector: 'app-governance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './governance.component.html',
})
export class GovernanceComponent {
  private readonly supabase = inject(SupabaseDataService);
  private readonly refreshTrigger = new Subject<void>();

  readonly loadError = signal<string | null>(null);
  readonly selectedOutcome = signal<VoteOutcomeFilter>('all');
  readonly searchTerm = signal('');

  readonly dashboardState = toSignal(
    this.refreshTrigger.pipe(
      startWith(undefined),
      switchMap(() =>
        this.supabase.getDemoDashboardState().pipe(
          map(({ data, error }) => {
            if (error) {
              throw new Error(error.message ?? 'No se pudo cargar la gobernanza');
            }
            return data ?? null;
          }),
          catchError((err) => {
            this.loadError.set(err?.message ?? 'No se pudo cargar la gobernanza');
            return [null];
          })
        )
      )
    ),
    { initialValue: null as DemoDashboardState | null }
  );

  readonly commissioners = computed(() => {
    const state = this.dashboardState();
    return (state?.commissioners ?? []).map((commissioner) => ({
      ...commissioner,
      voteWeight: Number(commissioner.vote_weight ?? 0),
    }));
  });

  readonly blockGroups = computed(() => this.dashboardState()?.blockGroups ?? []);

  readonly votes = computed<VoteRecord[]>(() => {
    const state = this.dashboardState();
    const blockMap = new Map((state?.blockGroups ?? []).map((block) => [block.id, block]));
    const commissionerMap = new Map((state?.commissioners ?? []).map((comm) => [comm.id, comm]));

    return (state?.votes ?? []).map((vote) => {
      const block = blockMap.get(vote.block_group_id) ?? null;
      const commissioner = commissionerMap.get(vote.commissioner_id) ?? null;
      return {
        id: vote.id,
        blockId: vote.block_group_id,
        blockHeight: block?.height ?? null,
        blockStatus: block?.status ?? null,
        commissionerId: vote.commissioner_id,
        commissionerName: commissioner?.name ?? '—',
        approve: vote.approve,
        votedAt: vote.voted_at,
      } satisfies VoteRecord;
    });
  });

  readonly filteredVotes = computed(() => {
    const outcome = this.selectedOutcome();
    const term = this.searchTerm().trim().toLowerCase();

    return this.votes()
      .filter((vote) => {
        if (outcome === 'approved') {
          return vote.approve === true;
        }
        if (outcome === 'rejected') {
          return vote.approve === false;
        }
        return true;
      })
      .filter((vote) => {
        if (!term) {
          return true;
        }
        const matchesCommissioner = vote.commissionerName.toLowerCase().includes(term);
        const matchesBlock = vote.blockHeight?.toString().includes(term) || vote.blockId.toLowerCase().includes(term);
        return matchesCommissioner || matchesBlock;
      })
      .sort((a, b) => b.votedAt.localeCompare(a.votedAt));
  });

  readonly activeRound = computed(() => {
    const blocks = this.blockGroups();
    return (
      blocks.find((block) => block.status === 'voting') ??
      blocks.find((block) => block.status === 'pending') ??
      null
    );
  });

  readonly activeVotes = computed(() => {
    const round = this.activeRound();
    if (!round) {
      return [] as VoteRecord[];
    }
    return this.votes().filter((vote) => vote.blockId === round.id);
  });

  readonly summary = computed(() => {
    const comms = this.commissioners();
    const blocks = this.blockGroups();
    const votes = this.votes();
    const activeVotes = this.activeVotes();
    const onlineCommissioners = comms.filter((comm) => comm.online).length;
    const activeRound = this.activeRound();
    const participation = comms.length > 0 ? Math.round((votes.length / comms.length) * 100) : 0;
    const activeParticipation = comms.length > 0 ? Math.round((activeVotes.length / comms.length) * 100) : 0;

    return {
      commissionersTotal: comms.length,
      commissionersOnline: onlineCommissioners,
      blocksConfirmed: blocks.filter((block) => block.status === 'confirmed').length,
      blocksVoting: blocks.filter((block) => block.status === 'voting').length,
      totalVotes: votes.length,
      majorityThreshold: this.majorityThreshold(),
      participation,
      activeParticipation,
      activeRoundStatus: activeRound?.status ?? null,
    };
  });

  readonly majorityThreshold = computed(() => {
    const nc = Number(this.dashboardState()?.system?.nc ?? 0);
    return Math.floor(nc / 2) + 1;
  });

  readonly lastUpdated = computed(() => this.dashboardState()?.system?.updated_at ?? null);

  constructor() {
    this.refresh();
  }

  refresh() {
    this.loadError.set(null);
    this.refreshTrigger.next();
  }

  setOutcome(filter: VoteOutcomeFilter) {
    this.selectedOutcome.set(filter);
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
    const date = new Date(value);
    return date.toLocaleString();
  }

  formatNumber(value: string | number | null | undefined) {
    if (value === null || value === undefined) {
      return '0';
    }
    const numeric = typeof value === 'string' ? Number(value) : value;
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(numeric);
  }

  voteStatusClass(approve: boolean) {
    return approve
      ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300'
      : 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300';
  }
}

