import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, of } from 'rxjs';
import { catchError, map, startWith, switchMap, tap } from 'rxjs/operators';
import { SupabaseDataService } from '../../core/supabase-data.service';
import type { Tables } from '../../core/supabase.types';

type TransactionStatus = Tables<'pnv_demo_transactions'>['status'];
type TransactionRow = Tables<'pnv_demo_transactions'>;
type TransactionView = TransactionRow & {
  amountNumber: number;
  createdAt: string | null;
};

type StatusFilter = 'all' | TransactionStatus;

type StatusOption = {
  key: StatusFilter;
  label: string;
};

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transactions.component.html',
})
export class TransactionsComponent {
  private readonly supabaseData = inject(SupabaseDataService);
  private readonly refreshTrigger = new Subject<void>();

  readonly loadError = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly selectedStatus = signal<StatusFilter>('all');

  private readonly transactionsSource = toSignal(
    this.refreshTrigger.pipe(
      startWith(undefined),
      switchMap(() =>
        this.supabaseData.getDemoTransactions().pipe(
          tap(() => this.loadError.set(null)),
          catchError((error: Error) => {
            this.loadError.set(error?.message ?? 'No se pudieron cargar las transacciones');
            return of([] as TransactionRow[]);
          })
        )
      )
    ),
    { initialValue: [] as TransactionRow[] }
  );

  readonly statusOptions: StatusOption[] = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'voting', label: 'En votación' },
    { key: 'confirmed', label: 'Confirmadas' },
  ];

  readonly transactions = computed<TransactionView[]>(() =>
    this.transactionsSource().map((tx) => ({
      ...tx,
      amountNumber: Number(tx.amount ?? 0),
      createdAt: tx.created_at,
    }))
  );

  readonly statusCounters = computed(() => {
    const counters: Record<TransactionStatus, number> = {
      pending: 0,
      voting: 0,
      confirmed: 0,
    };

    for (const tx of this.transactions()) {
      if (tx.status in counters) {
        counters[tx.status] += 1;
      }
    }

    return counters;
  });

  readonly filteredTransactions = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const statusFilter = this.selectedStatus();

    return this.transactions().filter((tx) => {
      const matchesStatus =
        statusFilter === 'all' ? true : tx.status === statusFilter;
      const matchesTerm = term
        ? [tx.from_account, tx.to_account, tx.id]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(term))
        : true;
      return matchesStatus && matchesTerm;
    });
  });

  readonly totalAmount = computed(() =>
    this.filteredTransactions().reduce((acc, tx) => acc + tx.amountNumber, 0)
  );

  constructor() {
    this.refresh();
  }

  setStatus(filter: StatusFilter) {
    this.selectedStatus.set(filter);
  }

  statusCount(filter: StatusFilter) {
    if (filter === 'all') {
      return this.transactions().length;
    }
    return this.statusCounters()[filter] ?? 0;
  }

  onSearchChange(value: string) {
    this.searchTerm.set(value);
  }

  clearSearch() {
    this.searchTerm.set('');
  }

  refresh() {
    this.refreshTrigger.next();
  }

  formatAmount(amount: number) {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  formatTimestamp(value: string | null) {
    if (!value) {
      return '—';
    }
    return new Date(value).toLocaleString();
  }

  statusLabel(status: TransactionStatus) {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'voting':
        return 'En votación';
      case 'confirmed':
        return 'Confirmada';
      default:
        return status;
    }
  }

  statusBadgeClass(status: TransactionStatus) {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300';
      case 'voting':
        return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300';
      case 'confirmed':
        return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300';
    }
  }

  shortenId(id: string) {
    return id.length > 10 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
  }
}

