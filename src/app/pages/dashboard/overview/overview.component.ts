import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, forkJoin } from 'rxjs';
import { finalize, map, startWith, switchMap, take } from 'rxjs/operators';
import { SupabaseDataService, DemoDashboardState } from '../../../core/supabase-data.service';

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
  stake: string;
  performance: number;
  slotIndex: number;
  isCurrent: boolean;
};

type DemoSystem = NonNullable<DemoDashboardState['system']>;
type DemoStats = NonNullable<DemoDashboardState['stats']>;
type DemoBalance = DemoDashboardState['balances'][number];
type DemoCommissioner = DemoDashboardState['commissioners'][number];
type DemoCandidate = DemoDashboardState['candidates'][number];
type DemoButler = DemoDashboardState['butlers'][number];

type DemoTransaction = DemoDashboardState['pendingTransactions'][number];

type TxField = 'from' | 'to' | 'amount';

type TxFormState = {
  from: string;
  to: string;
  amount: string;
};

type RecipientMode = 'existing' | 'new';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overview.component.html',
})
export class OverviewComponent {
  private readonly dataService = inject(SupabaseDataService);
  private readonly refreshTrigger = new Subject<void>();

  private readonly demoState = toSignal(
    this.refreshTrigger.pipe(
      startWith(undefined),
      switchMap(() =>
        this.dataService
          .getDemoDashboardState()
          .pipe(map(({ data, error }) => (error ? null : data ?? null)))
      )
    ),
    { initialValue: null as DemoDashboardState | null }
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

  private readonly fallbackSystem: DemoSystem = {
    id: true,
    nc: 5,
    nb: 2,
    nbc: 5,
    tb: 15,
    tw: 100,
    bw: 10,
    current_tenure: 1,
    blocks_in_tenure: 0,
    alliance_fund: '50000',
    current_butler_slot: 0,
    last_random_number: 0,
    updated_at: new Date().toISOString(),
  };

  private readonly fallbackStats: DemoStats = {
    id: true,
    total_blocks: 1,
    total_tx: 0,
    avg_consensus_time: '0',
    tps: '0',
    network_health: '100',
    updated_at: new Date().toISOString(),
  };

  private readonly fallbackBalances: DemoBalance[] = [
    { account: 'Alice', balance: '1000', updated_at: new Date().toISOString() },
    { account: 'Bob', balance: '500', updated_at: new Date().toISOString() },
    { account: 'Charlie', balance: '750', updated_at: new Date().toISOString() },
    { account: 'Diana', balance: '300', updated_at: new Date().toISOString() },
    { account: 'Eve', balance: '1200', updated_at: new Date().toISOString() },
  ];

  private readonly fallbackCommissioners: DemoCommissioner[] = [
    {
      id: 'commissioner-demo-1',
      name: 'Banco A',
      region: 'Europa',
      online: true,
      vote_weight: '1',
      created_at: new Date().toISOString(),
    },
  ];

  private readonly fallbackCandidates: DemoCandidate[] = [
    {
      id: 'candidate-demo-1',
      name: 'Candidate Delta',
      stake: '1500',
      score: '75',
      recommended: true,
      created_at: new Date().toISOString(),
    },
  ];

  private readonly fallbackButlers: DemoButler[] = [
    {
      slot_index: 0,
      bookkeeper_id: null,
      score: '90',
      active: true,
      last_seen_at: null,
      blocks_produced: 0,
      stake: '2000',
      name: 'Butler Alpha',
      status: 'active',
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

  private readonly fallbackMetrics: Metric[] = [
    { label: 'Bloques confirmados', value: '1' },
    { label: 'Transacciones totales', value: '0' },
    { label: 'Latencia media', value: '0 ms' },
    { label: 'Salud de la red', value: '100%' },
  ];

  readonly newTransaction = signal<TxFormState>({ from: '', to: '', amount: '' });
  readonly isSubmitting = signal(false);
  readonly formErrors = signal<string[]>([]);
  readonly formSuccess = signal<string | null>(null);
  readonly isConsensusBusy = signal(false);
  readonly consensusMessage = signal<string | null>(null);
  readonly consensusError = signal<string | null>(null);
  readonly recipientMode = signal<RecipientMode>('existing');

  readonly system = computed(() => this.demoState()?.system ?? this.fallbackSystem);
  readonly stats = computed(() => this.demoState()?.stats ?? this.fallbackStats);
  readonly balances = computed(() => this.demoState()?.balances ?? this.fallbackBalances);
  readonly pendingTransactions = computed(
    () => this.demoState()?.pendingTransactions ?? []
  );
  readonly commissioners = computed(
    () => this.demoState()?.commissioners ?? this.fallbackCommissioners
  );
  readonly candidates = computed(
    () => this.demoState()?.candidates ?? this.fallbackCandidates
  );
  readonly butlers = computed(() => this.demoState()?.butlers ?? this.fallbackButlers);
  readonly currentVotingBlock = computed(() => {
    const groups = this.demoState()?.blockGroups ?? [];
    return groups.find((group) => group.status === 'voting') ?? null;
  });
  readonly canStartConsensus = computed(
    () => this.pendingTransactions().length > 0 && !this.currentVotingBlock()
  );
  readonly requiredVotes = computed(() => {
    const nc = this.system().nc ?? 0;
    return Math.floor(nc / 2) + 1;
  });

  readonly metrics = computed(() => this.buildMetrics());
  readonly blockGroups = computed(() => this.buildBlockGroups());
  readonly validators = computed(() => this.buildValidators());
  readonly knownAccounts = computed(() =>
    this.balances().map((balance) => ({
      name: balance.account,
      balance: this.formatNumber(balance.balance),
    }))
  );

  private buildMetrics(): Metric[] {
    const stats = this.stats();

    const avgConsensus = this.asNumber(stats.avg_consensus_time);
    const tps = this.asNumber(stats.tps);
    const networkHealth = this.asNumber(stats.network_health);

    return [
      {
        label: 'Bloques confirmados',
        value: this.integerFormatter.format(stats.total_blocks ?? 0),
      },
      {
        label: 'Transacciones totales',
        value: this.integerFormatter.format(stats.total_tx ?? 0),
      },
      {
        label: 'Latencia media',
        value: avgConsensus !== null ? this.formatLatency(avgConsensus) : '—',
      },
      {
        label: 'Salud de la red',
        value:
          networkHealth !== null
            ? this.percentFormatter.format(networkHealth / 100)
            : this.percentFormatter.format(1),
        delta: tps !== null ? { value: `${tps} TPS`, positive: true } : undefined,
      },
    ];
  }

  private buildBlockGroups(): BlockGroupView[] {
    const groups = this.demoState()?.blockGroups ?? [];
    if (groups.length === 0) {
      return this.fallbackBlockGroups;
    }

    return groups.map((group) => {
      const leaderSlot = group.leader_slot;
      const leaderName = group.butler_name ?? (leaderSlot !== null ? `Slot ${leaderSlot}` : '—');

      return {
        id: `#${group.height}`,
        leader: leaderName,
        latency: group.consensus_time_ms ? this.formatLatency(group.consensus_time_ms) : '—',
        txCount: this.integerFormatter.format(group.tx_count ?? 0),
        statusLabel: this.mapStatusLabel(group.status),
        statusKind: this.isConfirmed(group.status) ? 'confirmed' : 'in-progress',
      };
    });
  }

  private buildValidators(): ValidatorView[] {
    const system = this.system();
    const currentSlot = system.current_butler_slot ?? 0;
    const butlers = this.butlers();
    if (butlers.length === 0) {
      return [
        {
          name: 'Butler Alpha',
          stake: '2000 PNV',
          performance: 90,
          slotIndex: 0,
          isCurrent: true,
        },
      ];
    }

    return butlers.map((butler) => {
      const stakeValue = this.asNumber(butler.stake);
      const performanceValue = this.asNumber(butler.score) ?? 0;

      return {
        name: butler.name ?? `Slot ${butler.slot_index}`,
        stake:
          stakeValue !== null ? `${this.integerFormatter.format(stakeValue)} PNV` : '—',
        performance: performanceValue,
        slotIndex: butler.slot_index,
        isCurrent: butler.slot_index === currentSlot,
      };
    });
  }

  onTransactionFieldChange(field: TxField, value: string) {
    this.newTransaction.update((current) => ({ ...current, [field]: value }));
  }

  onRecipientSelectChange(value: string) {
    if (value === '__new') {
      this.recipientMode.set('new');
      this.newTransaction.update((current) => ({ ...current, to: '' }));
      return;
    }

    this.recipientMode.set('existing');
    this.newTransaction.update((current) => ({ ...current, to: value }));
  }

  submitTransaction() {
    const tx = this.newTransaction();
    const amount = Number(tx.amount);
    const errors: string[] = [];

    if (!tx.from) {
      errors.push('Seleccione el remitente');
    }
    if (!tx.to) {
      errors.push('Ingrese el destinatario');
    }
    if (tx.from && tx.to && tx.from === tx.to) {
      errors.push('El remitente y destinatario deben ser distintos');
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push('La cantidad debe ser un número positivo');
    }

    if (errors.length > 0) {
      this.formErrors.set(errors);
      this.formSuccess.set(null);
      return;
    }

    this.isSubmitting.set(true);
    this.formErrors.set([]);
    this.formSuccess.set(null);

    this.dataService
      .addDemoTransaction({ from: tx.from, to: tx.to, amount })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.newTransaction.set({ from: '', to: '', amount: '' });
          this.formSuccess.set('Transacción registrada en Supabase');
          this.refreshDemoState();
          setTimeout(() => this.formSuccess.set(null), 4000);
        },
        error: (error) => {
          const message = error?.message ?? 'No se pudo registrar la transacción';
          this.formErrors.set([message]);
        },
        complete: () => {
          this.isSubmitting.set(false);
        },
      });
  }

  startConsensusRound() {
    if (!this.canStartConsensus()) {
      this.showConsensusError('Necesitas transacciones pendientes y ningún bloque en curso.');
      return;
    }

    this.isConsensusBusy.set(true);
    this.consensusError.set(null);
    this.consensusMessage.set(null);

    this.dataService
      .startDemoConsensus()
      .pipe(
        take(1),
        finalize(() => this.isConsensusBusy.set(false))
      )
      .subscribe({
        next: (blockId) => {
          this.showConsensusMessage(`Ronda iniciada (bloque ${blockId.slice(0, 8)}…)`);
          this.refreshDemoState();
        },
        error: (error) => {
          this.showConsensusError(error?.message ?? 'No se pudo iniciar el consenso');
        },
      });
  }

  approveCurrentBlock() {
    const block = this.currentVotingBlock();
    if (!block) {
      this.showConsensusError('No hay un bloque en votación.');
      return;
    }

    const commissioners = this.commissioners();
    const required = this.requiredVotes();
    const voters = commissioners.slice(0, required);

    if (voters.length === 0) {
      this.showConsensusError('No hay commissioners registrados.');
      return;
    }

    this.isConsensusBusy.set(true);
    this.consensusError.set(null);
    this.consensusMessage.set(null);

    forkJoin(
      voters.map((commissioner) =>
        this.dataService
          .castDemoVote(block.id, commissioner.id, true)
          .pipe(take(1))
      )
    )
      .pipe(finalize(() => this.isConsensusBusy.set(false)))
      .subscribe({
        next: () => {
          this.showConsensusMessage('Bloque aprobado y finalizado.');
          this.refreshDemoState();
        },
        error: (error) => {
          this.showConsensusError(error?.message ?? 'No se pudo registrar el voto');
        },
      });
  }

  finalizeCurrentBlock() {
    const block = this.currentVotingBlock();
    if (!block) {
      this.showConsensusError('No hay bloque para finalizar.');
      return;
    }

    this.isConsensusBusy.set(true);
    this.consensusError.set(null);
    this.consensusMessage.set(null);

    this.dataService
      .finalizeDemoBlock(block.id, true)
      .pipe(
        take(1),
        finalize(() => this.isConsensusBusy.set(false))
      )
      .subscribe({
        next: () => {
          this.showConsensusMessage('Bloque finalizado manualmente.');
          this.refreshDemoState();
        },
        error: (error) => {
          this.showConsensusError(error?.message ?? 'No se pudo finalizar el bloque');
        },
      });
  }

  formatNumber(value: unknown): string {
    const numeric = this.asNumber(value);
    if (numeric === null) {
      return '—';
    }
    return this.integerFormatter.format(numeric);
  }

  formatLatency(latencyMs: number): string {
    if (latencyMs >= 1000) {
      return `${(latencyMs / 1000).toFixed(1)} s`;
    }

    return `${latencyMs.toFixed(0)} ms`;
  }

  formatTimestamp(timestamp: string | null): string {
    if (!timestamp) {
      return '—';
    }
    return new Date(timestamp).toLocaleString();
  }

  private refreshDemoState() {
    this.refreshTrigger.next();
  }

  private showConsensusMessage(message: string) {
    this.consensusMessage.set(message);
    setTimeout(() => {
      if (this.consensusMessage() === message) {
        this.consensusMessage.set(null);
      }
    }, 4000);
  }

  private showConsensusError(message: string) {
    this.consensusError.set(message);
    setTimeout(() => {
      if (this.consensusError() === message) {
        this.consensusError.set(null);
      }
    }, 5000);
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

  private mapStatusLabel(status: string): string {
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

  private isConfirmed(status: string): boolean {
    return status === 'confirmed';
  }
}