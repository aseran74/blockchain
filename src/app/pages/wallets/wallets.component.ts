import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  SupabaseDataService,
  VotaliaAsset,
  VotaliaWallet,
  VotaliaWalletTransaction,
} from '../../core/supabase-data.service';

interface CreateWalletForm {
  ownerId: string;
  label: string;
}

interface MintForm {
  walletId: string;
  amount: string;
}

interface TransferForm {
  fromWallet: string;
  toWallet: string;
  amount: string;
  memo: string;
}

@Component({
  selector: 'app-wallets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wallets.component.html',
})
export class WalletsComponent {
  private readonly supabase = inject(SupabaseDataService);
  private readonly numberFormatter = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly asset = signal<VotaliaAsset | null>(null);
  readonly wallets = signal<VotaliaWallet[]>([]);
  readonly transactions = signal<VotaliaWalletTransaction[]>([]);

  readonly createForm = signal<CreateWalletForm>({ ownerId: '', label: '' });
  readonly mintForm = signal<MintForm>({ walletId: '', amount: '' });
  readonly transferForm = signal<TransferForm>({
    fromWallet: '',
    toWallet: '',
    amount: '',
    memo: '',
  });

  constructor() {
    this.refreshAll();
  }

  refreshAll() {
    this.isLoading.set(true);
    this.error.set(null);
    forkJoin({
      asset: this.supabase.listVotaliaAssets(),
      wallets: this.supabase.listVotaliaWallets(),
      transactions: this.supabase.listVotaliaWalletTransactions(100),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ asset, wallets, transactions }) => {
          this.asset.set(asset ?? null);
          this.wallets.set(wallets);
          this.transactions.set(transactions);
        },
        error: (err) => {
          this.error.set(err?.message ?? 'No se pudieron cargar los datos de la wallet.');
        },
      });
  }

  submitCreateWallet() {
    const form = this.createForm();
    const ownerId = form.ownerId.trim();
    const label = form.label.trim();

    this.isLoading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.supabase
      .createVotaliaWallet(ownerId || null, label || undefined)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.success.set('Wallet creada.');
          this.createForm.set({ ownerId: '', label: '' });
          this.refreshAll();
        },
        error: (err) => {
          this.error.set(err?.message ?? 'No se pudo crear la wallet.');
        },
      });
  }

  submitMint() {
    const form = this.mintForm();
    const walletId = form.walletId;
    const amount = Number(form.amount);

    if (!walletId) {
      this.error.set('Selecciona una wallet destino.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      this.error.set('La cantidad a mintear debe ser un número positivo.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.supabase
      .mintVotalia(walletId, amount)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.success.set('Tokens VTL emitidos.');
          this.mintForm.set({ walletId, amount: '' });
          this.refreshAll();
        },
        error: (err) => {
          this.error.set(err?.message ?? 'No se pudo mintear VTL.');
        },
      });
  }

  submitTransfer() {
    const form = this.transferForm();
    const fromWallet = form.fromWallet;
    const toWallet = form.toWallet;
    const amount = Number(form.amount);

    if (!fromWallet || !toWallet) {
      this.error.set('Selecciona wallets de origen y destino.');
      return;
    }
    if (fromWallet === toWallet) {
      this.error.set('Las wallets de origen y destino deben ser diferentes.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      this.error.set('La cantidad a transferir debe ser un número positivo.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.supabase
      .transferVotalia(fromWallet, toWallet, amount, form.memo || undefined)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.success.set('Transferencia aplicada.');
          this.transferForm.set({ fromWallet: '', toWallet: '', amount: '', memo: '' });
          this.refreshAll();
        },
        error: (err) => {
          this.error.set(err?.message ?? 'No se pudo transferir VTL.');
        },
      });
  }

  formatAmount(value: string | number | null | undefined) {
    if (value === null || value === undefined) {
      return '0.00';
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return '0.00';
    }
    return this.numberFormatter.format(numeric);
  }
}
