import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { injectSupabase } from './supabase.client';
import { Database, Tables } from './supabase.types';

export type BlockGroupRow = Tables<'pnv_block_groups'> & {
  term: Pick<Tables<'pnv_terms'>, 'cycle_number' | 'status'> | null;
};

export type BookkeeperSlotRow = Tables<'pnv_bookkeeper_slots'> & {
  actor: Pick<Tables<'pnv_actors'>, 'id' | 'display_name' | 'stake' | 'status'> | null;
};

@Injectable({ providedIn: 'root' })
export class SupabaseDataService {
  private readonly supabase = injectSupabase();

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

  createTransaction(input: Pick<Tables<'pnv_transactions'>, 'hash' | 'payload' | 'sender_id' | 'fee'>): Observable<PostgrestSingleResponse<Tables<'pnv_transactions'>>> {
    return from(
      this.supabase
        .from('pnv_transactions')
        .insert({
          hash: input.hash,
          payload: input.payload ?? null,
          sender_id: input.sender_id ?? null,
          fee: input.fee ?? '0',
          status: 'queued',
        })
        .select('*')
        .single()
    );
  }

  /**
   * Ejemplo de RPC futuro: centraliza las llamadas para forzar tipado homogéneo.
   */
  rpc<T extends keyof Database['public']['Functions']>(_fn: T, _args?: Record<string, unknown>) {
    throw new Error('Aún no hay funciones definidas. Añade la RPC en Supabase y actualiza los tipos.');
  }
}

