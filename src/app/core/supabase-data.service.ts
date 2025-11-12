import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { injectSupabase } from './supabase.client';
import { Database, Tables } from './supabase.types';

export type BlockGroupRow = Tables<'pnv_block_groups'> & {
  term: Pick<Tables<'pnv_terms'>, 'cycle_number' | 'status'> | null;
};

export type BookkeeperSlotRow = Tables<'pnv_bookkeeper_slots'> & {
  actor: Pick<Tables<'pnv_actors'>, 'id' | 'display_name' | 'stake' | 'status'> | null;
};

export interface DemoDashboardState {
  system: {
    id: boolean;
    nc: number;
    nb: number;
    nbc: number;
    tb: number;
    tw: number;
    bw: number;
    current_tenure: number;
    blocks_in_tenure: number;
    alliance_fund: string;
    current_butler_slot: number;
    last_random_number: number;
    updated_at: string;
  } | null;
  stats: {
    id: boolean;
    total_blocks: number;
    total_tx: number;
    avg_consensus_time: string;
    tps: string;
    network_health: string;
    updated_at: string;
  } | null;
  balances: Array<{ account: string; balance: string; updated_at: string }>;
  commissioners: Array<{ id: string; name: string; region: string | null; online: boolean; vote_weight: string; created_at: string }>;
  candidates: Array<{ id: string; name: string; stake: string; score: string; recommended: boolean; created_at: string }>;
  pendingTransactions: Array<{ id: string; from_account: string; to_account: string; amount: string; signature: string; status: string; created_at: string }>;
  blockGroups: Array<{
    id: string;
    height: number;
    status: Database['public']['Enums']['pnv_block_group_status'];
    leader_slot: number | null;
    butler_id: string | null;
    butler_name: string | null;
    created_at: string;
    confirmed_at: string | null;
    consensus_start_at: string | null;
    tcut_at: string | null;
    approved_count: number | null;
    consensus_time_ms: number | null;
    tx_count: number;
  }>;
  votes: Array<{ id: string; block_group_id: string; commissioner_id: string; approve: boolean; voted_at: string }>;
  butlers: Array<{
    slot_index: number;
    bookkeeper_id: string | null;
    score: string;
    active: boolean;
    last_seen_at: string | null;
    blocks_produced: number;
    stake: string | null;
    name: string | null;
    status: string | null;
  }>;
  parameters?: Tables<'pnv_parameters'>[];
}

export interface DemoTransactionInput {
  from: string;
  to: string;
  amount: number;
}

export type VotaliaAsset = Tables<'pnv_assets'>;
export type VotaliaWallet = Tables<'pnv_wallets'> & {
  owner?: Pick<Tables<'pnv_actors'>, 'id' | 'display_name'> | null;
};

export type VotaliaWalletTransaction = Tables<'pnv_wallet_transactions'> & {
  from?: Pick<Tables<'pnv_wallets'>, 'id' | 'label' | 'owner_id'> | null;
  to?: Pick<Tables<'pnv_wallets'>, 'id' | 'label' | 'owner_id'> | null;
};

@Injectable({ providedIn: 'root' })
export class SupabaseDataService {
  private readonly supabase = injectSupabase();
  private readonly unwrapResponse = <T>(response: PostgrestSingleResponse<T>): T => {
    if (response.error) {
      throw new Error(response.error.message ?? 'Error en Supabase');
    }
    return (response.data ?? null) as T;
  };

  // ----- Demo RPCs -----

  getDemoDashboardState(): Observable<PostgrestSingleResponse<DemoDashboardState>> {
    return from(
      this.supabase
        .rpc('demo_get_dashboard_state')
        .single<DemoDashboardState>()
    );
  }

  addDemoTransaction(input: DemoTransactionInput) {
    return from(
      this.supabase.rpc('demo_add_transaction', {
        _from: input.from,
        _to: input.to,
        _amount: input.amount,
      })
    ).pipe(map(this.unwrapResponse));
  }

  startDemoConsensus(): Observable<string> {
    return from(
      this.supabase.rpc('demo_start_consensus')
    ).pipe(map(this.unwrapResponse));
  }

  castDemoVote(blockGroupId: string, commissionerId: string, approve: boolean) {
    return from(
      this.supabase.rpc('demo_cast_vote', {
        _block_group_id: blockGroupId,
        _commissioner_id: commissionerId,
        _approve: approve,
      })
    ).pipe(map(this.unwrapResponse));
  }

  finalizeDemoBlock(blockGroupId: string, force = false) {
    return from(
      this.supabase.rpc('demo_finalize_block', {
        _block_group_id: blockGroupId,
        force,
      })
    ).pipe(map(this.unwrapResponse));
  }

  getDemoTransactions(limit = 200) {
    const query = this.supabase
      .from('pnv_demo_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    return from(query).pipe(
      map((response) => {
        if (response.error) {
          throw new Error(response.error.message ?? 'Error en Supabase');
        }
        return (response.data ?? []) as Tables<'pnv_demo_transactions'>[];
      })
    );
  }

  checkConnection(): Observable<'online' | 'offline'> {
    return from(
      this.supabase
        .from('pnv_demo_system_state')
        .select('id')
        .limit(1)
        .maybeSingle()
    ).pipe(
      map((response) => (response.error ? 'offline' : 'online')),
      catchError(() => of<'offline'>('offline'))
    );
  }

  // ----- Wallet Votalia (modo demo) -----

  listVotaliaAssets() {
    return from(
      this.supabase
        .from('pnv_assets')
        .select('*')
        .eq('code', 'VTL')
        .maybeSingle()
    ).pipe(map(this.unwrapResponse));
  }

  listVotaliaWallets() {
    return from(
      this.supabase
        .from('pnv_wallets')
        .select('*, owner:pnv_actors(id,display_name)')
        .order('created_at', { ascending: false })
    ).pipe(
      map((response) => {
        if (response.error) {
          throw new Error(response.error.message ?? 'Error en Supabase');
        }
        return (response.data ?? []) as VotaliaWallet[];
      })
    );
  }

  listVotaliaWalletTransactions(limit = 100) {
    return from(
      this.supabase
        .from('pnv_wallet_transactions')
        .select('*, from:pnv_wallets!pnv_wallet_transactions_from_wallet_fkey(id,label,owner_id), to:pnv_wallets!pnv_wallet_transactions_to_wallet_fkey(id,label,owner_id)')
        .order('created_at', { ascending: false })
        .limit(limit)
    ).pipe(
      map((response) => {
        if (response.error) {
          throw new Error(response.error.message ?? 'Error en Supabase');
        }
        return (response.data ?? []) as VotaliaWalletTransaction[];
      })
    );
  }

  createVotaliaWallet(ownerId: string | null, label?: string) {
    return from(
      this.supabase.rpc('demo_create_wallet', {
        _owner: ownerId,
        _label: label,
      })
    ).pipe(map(this.unwrapResponse));
  }

  mintVotalia(walletId: string, amount: number) {
    return from(
      this.supabase.rpc('demo_mint_votalia', {
        _wallet: walletId,
        _amount: amount,
      })
    ).pipe(map(this.unwrapResponse));
  }

  transferVotalia(fromWallet: string, toWallet: string, amount: number, memo?: string) {
    return from(
      this.supabase.rpc('demo_transfer_votalia', {
        _from: fromWallet,
        _to: toWallet,
        _amount: amount,
        _memo: memo,
      })
    ).pipe(map(this.unwrapResponse));
  }

  // ----- Base helpers (pnv_* tables) -----

  getRecentBlockGroups(limit = 10): Observable<PostgrestSingleResponse<BlockGroupRow[]>> {
    return from(
      this.supabase
        .from('pnv_block_groups')
        .select('*, term:pnv_terms(cycle_number,status)')
        .order('height', { ascending: false })
        .limit(limit)
    );
  }

  getActiveBookkeepers(): Observable<PostgrestSingleResponse<BookkeeperSlotRow[]>> {
    return from(
      this.supabase
        .from('pnv_bookkeeper_slots')
        .select('*, actor:pnv_actors(id,display_name,stake,status)')
        .eq('active', true)
        .order('slot_index', { ascending: true })
    );
  }

  getLiveMetrics(): Observable<PostgrestSingleResponse<Tables<'pnv_metrics_snapshots'> | null>> {
    return from(
      this.supabase
        .from('pnv_metrics_snapshots')
        .select('*')
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    );
  }

  getParameters(): Observable<PostgrestSingleResponse<Tables<'pnv_parameters'>[]>> {
    return from(
      this.supabase
        .from('pnv_parameters')
        .select('*')
        .order('key', { ascending: true })
    );
  }

  upsertMetricsSnapshot(payload: Tables<'pnv_metrics_snapshots'>['data']): Observable<PostgrestSingleResponse<Tables<'pnv_metrics_snapshots'> | null>> {
    const capturedAt = new Date().toISOString();

    return from(
      this.supabase
        .from('pnv_metrics_snapshots')
        .upsert(
          { captured_at: capturedAt, data: payload },
          { onConflict: 'captured_at' }
        )
        .select('*')
        .maybeSingle()
    );
  }

  // ----- Election RPCs -----

  initElectionPollingStations() {
    return from(
      this.supabase.rpc('init_election_polling_stations')
    ).pipe(map(this.unwrapResponse));
  }

  initElectionVoters() {
    return from(
      this.supabase.rpc('init_election_voters')
    ).pipe(map(this.unwrapResponse));
  }

  registerVote(voterId: string, party: string, method: string = 'online') {
    return from(
      this.supabase.rpc('register_vote', {
        p_voter_id: voterId,
        p_party: party,
        p_method: method
      })
    ).pipe(map(this.unwrapResponse));
  }

  verifyVoteBySms(smsCode: string, voterId?: string) {
    return from(
      this.supabase.rpc('verify_vote_by_sms', {
        p_sms_code: smsCode,
        p_voter_id: voterId || null
      })
    ).pipe(map(this.unwrapResponse));
  }

  sendFirstSms() {
    return from(
      this.supabase.rpc('send_first_sms')
    ).pipe(map(this.unwrapResponse));
  }

  downloadBlockchainChain() {
    return from(
      this.supabase.rpc('download_blockchain_chain')
    ).pipe(map(this.unwrapResponse));
  }

  deleteVote(voterId: string) {
    return from(
      this.supabase.rpc('delete_vote', {
        p_voter_id: voterId
      })
    ).pipe(map(this.unwrapResponse));
  }

  // Smart Contracts
  initSmartContracts() {
    return from(
      this.supabase.rpc('init_smart_contracts')
    ).pipe(map(this.unwrapResponse));
  }

  getSmartContractsWithCertificates() {
    return from(
      this.supabase.rpc('get_smart_contracts_with_certificates')
    ).pipe(map(this.unwrapResponse));
  }

  validateCertificate(certificateId: string) {
    return from(
      this.supabase.rpc('validate_certificate', {
        p_certificate_id: certificateId
      })
    ).pipe(map(this.unwrapResponse));
  }

  sendSecondSms() {
    return from(
      this.supabase.rpc('send_second_sms')
    ).pipe(map(this.unwrapResponse));
  }

  performExternalAudit(auditorName: string) {
    return from(
      this.supabase.rpc('perform_external_audit', {
        p_auditor_name: auditorName
      })
    ).pipe(map(this.unwrapResponse));
  }

  getPartialResults() {
    return from(
      this.supabase.rpc('get_partial_results')
    ).pipe(map(this.unwrapResponse));
  }

  // ----- Election Queries -----

  getPollingStations() {
    return from(
      this.supabase
        .from('election_polling_stations')
        .select('*')
        .order('name')
    ).pipe(
      map((response) => {
        if (response.error) throw new Error(response.error.message);
        return response.data ?? [];
      })
    );
  }

  getVoters(filters?: { nombre?: string; dni?: string }) {
    let query = this.supabase
      .from('election_voters')
      .select('*, election_polling_stations(*)')
      .order('nombre');
    
    if (filters?.nombre) {
      query = query.ilike('nombre', `%${filters.nombre}%`);
    }
    if (filters?.dni) {
      query = query.eq('dni', filters.dni);
    }
    
    return from(query).pipe(
      map((response) => {
        if (response.error) throw new Error(response.error.message);
        return response.data ?? [];
      })
    );
  }

  getVoterById(id: string) {
    return from(
      this.supabase
        .from('election_voters')
        .select('*, election_polling_stations(*)')
        .eq('id', id)
        .maybeSingle()
    ).pipe(
      map((response) => {
        if (response.error) throw new Error(response.error.message);
        return response.data;
      })
    );
  }

  getElectionAudits() {
    return from(
      this.supabase
        .from('election_audits')
        .select('*')
        .order('created_at', { ascending: false })
    ).pipe(
      map((response) => {
        if (response.error) throw new Error(response.error.message);
        return response.data ?? [];
      })
    );
  }

  createElectionVoter(nombre: string, apellido: string, dni: string, telefono: string, direccion: string, pollingStationId?: string) {
    return from(
      this.supabase.rpc('create_election_voter', {
        p_nombre: nombre,
        p_apellido: apellido,
        p_dni: dni,
        p_telefono: telefono,
        p_direccion: direccion,
        p_polling_station_id: pollingStationId || null
      })
    ).pipe(map(this.unwrapResponse));
  }

  createVoterRandom() {
    return from(
      this.supabase.rpc('create_voter_random')
    ).pipe(map(this.unwrapResponse));
  }

  simulateIndividualSms(voterId: string) {
    return from(
      this.supabase.rpc('simulate_individual_sms', {
        p_voter_id: voterId
      })
    ).pipe(map(this.unwrapResponse));
  }

  sendSmsPhase3(voterId: string) {
    return from(
      this.supabase.rpc('send_sms_phase3', {
        p_voter_id: voterId
      })
    ).pipe(map(this.unwrapResponse));
  }

  verifyIndividualResult(voterId: string, isCorrect: boolean) {
    return from(
      this.supabase.rpc('verify_individual_result', {
        p_voter_id: voterId,
        p_is_correct: isCorrect
      })
    ).pipe(map(this.unwrapResponse));
  }

  performSecondAudit() {
    return from(
      this.supabase.rpc('perform_second_audit')
    ).pipe(map(this.unwrapResponse));
  }

  assignRandomVotes() {
    return from(
      this.supabase.rpc('assign_random_votes')
    ).pipe(map(this.unwrapResponse));
  }

  simulateSmsSend(voterId: string) {
    return from(
      this.supabase.rpc('simulate_sms_send', {
        p_voter_id: voterId
      })
    ).pipe(map(this.unwrapResponse));
  }

  getTotalResults() {
    return from(
      this.supabase.rpc('get_total_results')
    ).pipe(map(this.unwrapResponse));
  }

  getFinalResults() {
    return from(
      this.supabase.rpc('get_final_results')
    ).pipe(map(this.unwrapResponse));
  }
}

