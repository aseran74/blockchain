import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { SupabaseDataService, BlockGroupRow, BookkeeperSlotRow } from '../../../core/supabase-data.service';
import type { Database } from '../../../core/supabase.types';

type Metric = {
  label: string;
  value: string;
  delta?: {
    value: string;
    positive: boolean;
  };
};

type BlockGroupView = {
  id: string;
  leader: string;
  latency: string;
  txCount: string;
  statusLabel: string;
  statusKind: 'confirmed' | 'in-progress';
};

type ValidatorView = {
  name: string;
  role: string;
  stake: string;
  performance: number;
};

type BlockGroupStatus = Database['public']['Enums']['pnv_block_group_status'];

interface MetricsPayload {
  tx_confirmed_24h?: unknown;
  tx_confirmed_delta_pct?: unknown;
  latency_avg_ms?: unknown;
  latency_delta_pct?: unknown;
  blocks_confirmed?: unknown;
  blocks_delta?: unknown;
  voter_participation_pct?: unknown;
  voter_participation_delta?: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.component.html',
})
export class OverviewComponent {
  private readonly dataService = inject(SupabaseDataService);

  private readonly blockGroupsData = toSignal(
    this.dataService.getRecentBlockGroups().pipe(
      map(({ data, error }) => (error ? [] : data ?? []))
    ),
    { initialValue: [] as BlockGroupRow[] }
  );

  private readonly bookkeepersData = toSignal(
    this.dataService.getActiveBookkeepers().pipe(
      map(({ data, error }) => (error ? [] : data ?? []))
    ),
    { initialValue: [] as BookkeeperSlotRow[] }
  );

  private readonly metricsSnapshot = toSignal(
    this.dataService.getLiveMetrics().pipe(
      map(({ data, error }) => (error ? null : data ?? null))
    ),
    { initialValue: null }
  );

  private readonly compactFormatter = new Intl.NumberFormat('es-ES', {
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  private readonly percentFormatter = new Intl.NumberFormat('es-ES', {
    style: 'percent',
    maximumFractionDigits: 1,
  });

  private readonly integerFormatter = new Intl.NumberFormat('es-ES');

  private readonly fallbackMetrics: Metric[] = [
    {
      label: 'Tx confirmadas (24h)',
      value: '128.4K',
      delta: { value: '+12.4%', positive: true },
    },
    {
      label: 'Latencia media',
      value: '1.8 s',
      delta: { value: '-8.1%', positive: true },
    },
    {
      label: 'Bloques finalizados',
      value: '512',
      delta: { value: '+5 bloques', positive: true },
    },
    {
      label: 'Participación votantes',
      value: '91%',
      delta: { value: '-2.2%', positive: false },
    },
  ];

  private readonly fallbackBlockGroups: BlockGroupView[] = [
    {
      id: '#1024',
      leader: 'Node-07',
      latency: '1.4 s',
      statusLabel: 'Finalizado',
      statusKind: 'confirmed',
      txCount: this.integerFormatter.format(2560),
    },
    {
      id: '#1025',
      leader: 'Node-02',
      latency: '1.6 s',
      statusLabel: 'Finalizado',
      statusKind: 'confirmed',
      txCount: this.integerFormatter.format(2488),
    },
    {
      id: '#1026',
      leader: 'Node-11',
      latency: '1.5 s',
      statusLabel: 'Finalizado',
      statusKind: 'confirmed',
      txCount: this.integerFormatter.format(2512),
    },
    {
      id: '#1027',
      leader: 'Node-05',
      latency: '—',
      statusLabel: 'En curso',
      statusKind: 'in-progress',
      txCount: this.integerFormatter.format(181),
    },
  ];

  private readonly fallbackValidators: ValidatorView[] = [
    { name: 'Node-02', role: 'Líder actual', stake: '120K PNV', performance: 98 },
    { name: 'Node-07', role: 'Bookkeeper', stake: '95K PNV', performance: 94 },
    { name: 'Node-11', role: 'Votante', stake: '80K PNV', performance: 91 },
    { name: 'Node-19', role: 'Candidato', stake: '55K PNV', performance: 87 },
  ];

  readonly metrics = computed(() => this.buildMetrics());
  readonly blockGroups = computed(() => this.buildBlockGroups());
  readonly validators = computed(() => this.buildValidators());

  private buildMetrics(): Metric[] {
    const snapshot = this.metricsSnapshot();
    if (!snapshot || !isRecord(snapshot.data)) {
      return this.fallbackMetrics;
    }

    const payload = snapshot.data as MetricsPayload;
    const txConfirmed = this.asNumber(payload.tx_confirmed_24h);
    const txDelta = this.asNumber(payload.tx_confirmed_delta_pct);
    const latencyMs = this.asNumber(payload.latency_avg_ms);
    const latencyDelta = this.asNumber(payload.latency_delta_pct);
    const blocksConfirmed = this.asNumber(payload.blocks_confirmed);
    const blocksDelta = this.asNumber(payload.blocks_delta);
    const voterParticipation = this.asNumber(payload.voter_participation_pct);
    const voterDelta = this.asNumber(payload.voter_participation_delta);

    return [
      {
        label: 'Tx confirmadas (24h)',
        value: txConfirmed !== null ? this.compactFormatter.format(txConfirmed) : '—',
        delta: this.formatDelta(txDelta, true),
      },
      {
        label: 'Latencia media',
        value: latencyMs !== null ? this.formatLatency(latencyMs) : '—',
        delta: this.formatDelta(latencyDelta, true),
      },
      {
        label: 'Bloques finalizados',
        value: blocksConfirmed !== null ? this.integerFormatter.format(blocksConfirmed) : '—',
        delta: this.formatDelta(blocksDelta ?? null, false, ' bloques'),
      },
      {
        label: 'Participación votantes',
        value:
          voterParticipation !== null
            ? this.percentFormatter.format(voterParticipation / 100)
            : '—',
        delta: this.formatDelta(voterDelta, true),
      },
    ];
  }

  private buildBlockGroups(): BlockGroupView[] {
    const groups = this.blockGroupsData();
    if (groups.length === 0) {
      return this.fallbackBlockGroups;
    }

    const slots = this.bookkeepersData();
    const slotMap = new Map<number, BookkeeperSlotRow>();
    for (const slot of slots) {
      slotMap.set(slot.slot_index, slot);
    }

    return groups.map((group) => {
      const leaderSlot = group.leader_slot ?? undefined;
      const leaderRecord = leaderSlot !== undefined ? slotMap.get(leaderSlot) : undefined;
      const leaderName =
        leaderRecord?.actor?.display_name ??
        (typeof leaderSlot === 'number' ? `Slot ${leaderSlot}` : '—');

      return {
        id: `#${group.height}`,
        leader: leaderName,
        latency: '—',
        txCount: '—',
        statusLabel: this.mapStatusLabel(group.status),
        statusKind: this.isConfirmed(group.status) ? 'confirmed' : 'in-progress',
      };
    });
  }

  private buildValidators(): ValidatorView[] {
    const slots = this.bookkeepersData();
    if (slots.length === 0) {
      return this.fallbackValidators;
    }

    return slots.map((slot) => {
      const stakeValue = this.asNumber(slot.actor?.stake);
      const performanceValue = this.asNumber(slot.score);

      return {
        name: slot.actor?.display_name ?? `Slot ${slot.slot_index}`,
        role: 'Bookkeeper',
        stake:
          stakeValue !== null ? `${this.integerFormatter.format(stakeValue)} PNV` : '—',
        performance: performanceValue ?? 0,
      };
    });
  }

  private asNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private formatLatency(latencyMs: number): string {
    if (latencyMs >= 1000) {
      return `${(latencyMs / 1000).toFixed(1)} s`;
    }

    return `${latencyMs.toFixed(0)} ms`;
  }

  private formatDelta(
    value: number | null,
    asPercent: boolean,
    suffix = ''
  ): Metric['delta'] | undefined {
    if (value === null || !Number.isFinite(value)) {
      return undefined;
    }

    const positive = value >= 0;
    const formatted = asPercent
      ? `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
      : `${value >= 0 ? '+' : ''}${this.integerFormatter.format(Math.abs(value))}${suffix}`;

    return { value: formatted, positive };
  }

  private mapStatusLabel(status: BlockGroupStatus): string {
    switch (status) {
      case 'confirmed':
        return 'Finalizado';
      case 'timeout':
        return 'Timeout';
      case 'pending':
      case 'voting':
      default:
        return 'En curso';
    }
  }

  private isConfirmed(status: BlockGroupStatus): boolean {
    return status === 'confirmed';
  }
}