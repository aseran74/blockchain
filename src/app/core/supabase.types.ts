export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      pnv_actors: {
        Row: {
          created_at: string;
          display_name: string;
          id: string;
          metadata: Json;
          public_key: string | null;
          stake: string;
          status: Database['public']['Enums']['pnv_actor_status'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          id?: string;
          metadata?: Json;
          public_key?: string | null;
          stake?: string;
          status?: Database['public']['Enums']['pnv_actor_status'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          id?: string;
          metadata?: Json;
          public_key?: string | null;
          stake?: string;
          status?: Database['public']['Enums']['pnv_actor_status'];
          updated_at?: string;
        };
        Relationships: [];
      };
      pnv_actor_roles: {
        Row: {
          actor_id: string;
          assigned_at: string;
          id: string;
          role: Database['public']['Enums']['pnv_role_type'];
          revoked_at: string | null;
          term_id: string | null;
        };
        Insert: {
          actor_id: string;
          assigned_at?: string;
          id?: string;
          role: Database['public']['Enums']['pnv_role_type'];
          revoked_at?: string | null;
          term_id?: string | null;
        };
        Update: {
          actor_id?: string;
          assigned_at?: string;
          id?: string;
          role?: Database['public']['Enums']['pnv_role_type'];
          revoked_at?: string | null;
          term_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pnv_actor_roles_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_actors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pnv_actor_roles_term_id_fkey';
            columns: ['term_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_terms';
            referencedColumns: ['id'];
          }
        ];
      };
      pnv_audit_log: {
        Row: {
          action: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          payload: Json | null;
          performed_by: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          payload?: Json | null;
          performed_by?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          payload?: Json | null;
          performed_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pnv_audit_log_performed_by_fkey';
            columns: ['performed_by'];
            isOneToOne: false;
            referencedRelation: 'pnv_actors';
            referencedColumns: ['id'];
          }
        ];
      };
      pnv_block_groups: {
        Row: {
          confirmed_at: string | null;
          created_at: string;
          height: number;
          id: string;
          leader_slot: number | null;
          next_leader_slot: number | null;
          prev_group_hash: string | null;
          random_seed: number | null;
          status: Database['public']['Enums']['pnv_block_group_status'];
          term_id: string | null;
          timeout_at: string | null;
        };
        Insert: {
          confirmed_at?: string | null;
          created_at?: string;
          height: number;
          id?: string;
          leader_slot?: number | null;
          next_leader_slot?: number | null;
          prev_group_hash?: string | null;
          random_seed?: number | null;
          status?: Database['public']['Enums']['pnv_block_group_status'];
          term_id?: string | null;
          timeout_at?: string | null;
        };
        Update: {
          confirmed_at?: string | null;
          created_at?: string;
          height?: number;
          id?: string;
          leader_slot?: number | null;
          next_leader_slot?: number | null;
          prev_group_hash?: string | null;
          random_seed?: number | null;
          status?: Database['public']['Enums']['pnv_block_group_status'];
          term_id?: string | null;
          timeout_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pnv_block_groups_term_id_fkey';
            columns: ['term_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_terms';
            referencedColumns: ['id'];
          }
        ];
      };
      pnv_block_votes: {
        Row: {
          block_id: string;
          id: string;
          opinion: Database['public']['Enums']['pnv_vote_opinion'];
          received_at: string;
          signature: string | null;
          voter_id: string;
          weight: string;
        };
        Insert: {
          block_id: string;
          id?: string;
          opinion: Database['public']['Enums']['pnv_vote_opinion'];
          received_at?: string;
          signature?: string | null;
          voter_id: string;
          weight?: string;
        };
        Update: {
          block_id?: string;
          id?: string;
          opinion?: Database['public']['Enums']['pnv_vote_opinion'];
          received_at?: string;
          signature?: string | null;
          voter_id?: string;
          weight?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pnv_block_votes_block_id_fkey';
            columns: ['block_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_blocks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pnv_block_votes_voter_id_fkey';
            columns: ['voter_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_actors';
            referencedColumns: ['id'];
          }
        ];
      };
      pnv_blocks: {
        Row: {
          bookkeeper_id: string | null;
          confirmed_at: string | null;
          failure_reason: string | null;
          group_id: string;
          hash: string | null;
          id: string;
          payload_root: string | null;
          produced_at: string | null;
          slot_index: number;
          status: Database['public']['Enums']['pnv_block_status'];
          timeout_at: string | null;
          tx_count: number;
        };
        Insert: {
          bookkeeper_id?: string | null;
          confirmed_at?: string | null;
          failure_reason?: string | null;
          group_id: string;
          hash?: string | null;
          id?: string;
          payload_root?: string | null;
          produced_at?: string | null;
          slot_index: number;
          status?: Database['public']['Enums']['pnv_block_status'];
          timeout_at?: string | null;
          tx_count?: number;
        };
        Update: {
          bookkeeper_id?: string | null;
          confirmed_at?: string | null;
          failure_reason?: string | null;
          group_id?: string;
          hash?: string | null;
          id?: string;
          payload_root?: string | null;
          produced_at?: string | null;
          slot_index?: number;
          status?: Database['public']['Enums']['pnv_block_status'];
          timeout_at?: string | null;
          tx_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'pnv_blocks_bookkeeper_id_fkey';
            columns: ['bookkeeper_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_actors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pnv_blocks_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_block_groups';
            referencedColumns: ['id'];
          }
        ];
      };
      pnv_bookkeeper_slots: {
        Row: {
          actor_id: string | null;
          id: string;
          last_seen_at: string | null;
          score: string;
          slot_index: number;
          term_id: string;
          active: boolean;
          updated_at: string;
        };
        Insert: {
          actor_id?: string | null;
          id?: string;
          last_seen_at?: string | null;
          score?: string;
          slot_index: number;
          term_id: string;
          active?: boolean;
          updated_at?: string;
        };
        Update: {
          actor_id?: string | null;
          id?: string;
          last_seen_at?: string | null;
          score?: string;
          slot_index?: number;
          term_id?: string;
          active?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pnv_bookkeeper_slots_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_actors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pnv_bookkeeper_slots_term_id_fkey';
            columns: ['term_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_terms';
            referencedColumns: ['id'];
          }
        ];
      };
      pnv_governance_proposals: {
        Row: {
          created_at: string;
          created_by: string | null;
          executed_at: string | null;
          id: string;
          payload: Json | null;
          status: Database['public']['Enums']['pnv_proposal_status'];
          term_id: string | null;
          type: Database['public']['Enums']['pnv_proposal_type'];
          voting_end_at: string | null;
          voting_start_at: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          executed_at?: string | null;
          id?: string;
          payload?: Json | null;
          status?: Database['public']['Enums']['pnv_proposal_status'];
          term_id?: string | null;
          type: Database['public']['Enums']['pnv_proposal_type'];
          voting_end_at?: string | null;
          voting_start_at?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          executed_at?: string | null;
          id?: string;
          payload?: Json | null;
          status?: Database['public']['Enums']['pnv_proposal_status'];
          term_id?: string | null;
          type?: Database['public']['Enums']['pnv_proposal_type'];
          voting_end_at?: string | null;
          voting_start_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pnv_governance_proposals_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'pnv_actors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pnv_governance_proposals_term_id_fkey';
            columns: ['term_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_terms';
            referencedColumns: ['id'];
          }
        ];
      };
      pnv_governance_votes: {
        Row: {
          choice: Database['public']['Enums']['pnv_governance_choice'];
          id: string;
          proposal_id: string;
          signature: string | null;
          voter_id: string;
          voted_at: string;
          weight: string;
        };
        Insert: {
          choice: Database['public']['Enums']['pnv_governance_choice'];
          id?: string;
          proposal_id: string;
          signature?: string | null;
          voter_id: string;
          voted_at?: string;
          weight?: string;
        };
        Update: {
          choice?: Database['public']['Enums']['pnv_governance_choice'];
          id?: string;
          proposal_id?: string;
          signature?: string | null;
          voter_id?: string;
          voted_at?: string;
          weight?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pnv_governance_votes_proposal_id_fkey';
            columns: ['proposal_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_governance_proposals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pnv_governance_votes_voter_id_fkey';
            columns: ['voter_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_actors';
            referencedColumns: ['id'];
          }
        ];
      };
      pnv_metrics_snapshots: {
        Row: {
          captured_at: string;
          data: Json;
          id: string;
        };
        Insert: {
          captured_at: string;
          data: Json;
          id?: string;
        };
        Update: {
          captured_at?: string;
          data?: Json;
          id?: string;
        };
        Relationships: [];
      };
      pnv_parameter_history: {
        Row: {
          changed_at: string;
          changed_by: string | null;
          id: string;
          new_value: Json | null;
          parameter_id: string;
          previous_value: Json | null;
        };
        Insert: {
          changed_at?: string;
          changed_by?: string | null;
          id?: string;
          new_value?: Json | null;
          parameter_id: string;
          previous_value?: Json | null;
        };
        Update: {
          changed_at?: string;
          changed_by?: string | null;
          id?: string;
          new_value?: Json | null;
          parameter_id?: string;
          previous_value?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pnv_parameter_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'pnv_actors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pnv_parameter_history_parameter_id_fkey';
            columns: ['parameter_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_parameters';
            referencedColumns: ['id'];
          }
        ];
      };
      pnv_parameters: {
        Row: {
          activated_at: string | null;
          created_at: string;
          id: string;
          key: string;
          status: Database['public']['Enums']['pnv_parameter_status'];
          updated_at: string;
          value: Json;
          version: number;
        };
        Insert: {
          activated_at?: string | null;
          created_at?: string;
          id?: string;
          key: string;
          status?: Database['public']['Enums']['pnv_parameter_status'];
          updated_at?: string;
          value: Json;
          version?: number;
        };
        Update: {
          activated_at?: string | null;
          created_at?: string;
          id?: string;
          key?: string;
          status?: Database['public']['Enums']['pnv_parameter_status'];
          updated_at?: string;
          value?: Json;
          version?: number;
        };
        Relationships: [];
      };
      pnv_terms: {
        Row: {
          bw: number;
          created_at: string;
          cycle_number: number;
          ends_at: string | null;
          id: string;
          nb: number;
          random_seed: number | null;
          starts_at: string | null;
          status: Database['public']['Enums']['pnv_term_status'];
        };
        Insert: {
          bw: number;
          created_at?: string;
          cycle_number: number;
          ends_at?: string | null;
          id?: string;
          nb: number;
          random_seed?: number | null;
          starts_at?: string | null;
          status?: Database['public']['Enums']['pnv_term_status'];
        };
        Update: {
          bw?: number;
          created_at?: string;
          cycle_number?: number;
          ends_at?: string | null;
          id?: string;
          nb?: number;
          random_seed?: number | null;
          starts_at?: string | null;
          status?: Database['public']['Enums']['pnv_term_status'];
        };
        Relationships: [];
      };
      pnv_timeout_events: {
        Row: {
          block_group_id: string | null;
          block_id: string | null;
          created_at: string;
          epoch: number | null;
          handled_by: string | null;
          id: string;
          type: Database['public']['Enums']['pnv_timeout_type'];
        };
        Insert: {
          block_group_id?: string | null;
          block_id?: string | null;
          created_at?: string;
          epoch?: number | null;
          handled_by?: string | null;
          id?: string;
          type: Database['public']['Enums']['pnv_timeout_type'];
        };
        Update: {
          block_group_id?: string | null;
          block_id?: string | null;
          created_at?: string;
          epoch?: number | null;
          handled_by?: string | null;
          id?: string;
          type?: Database['public']['Enums']['pnv_timeout_type'];
        };
        Relationships: [
          {
            foreignKeyName: 'pnv_timeout_events_block_group_id_fkey';
            columns: ['block_group_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_block_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pnv_timeout_events_block_id_fkey';
            columns: ['block_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_blocks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pnv_timeout_events_handled_by_fkey';
            columns: ['handled_by'];
            isOneToOne: false;
            referencedRelation: 'pnv_actors';
            referencedColumns: ['id'];
          }
        ];
      };
      pnv_transaction_events: {
        Row: {
          created_at: string;
          data: Json | null;
          event_type: Database['public']['Enums']['pnv_tx_event_type'];
          id: string;
          transaction_id: string;
        };
        Insert: {
          created_at?: string;
          data?: Json | null;
          event_type: Database['public']['Enums']['pnv_tx_event_type'];
          id?: string;
          transaction_id: string;
        };
        Update: {
          created_at?: string;
          data?: Json | null;
          event_type?: Database['public']['Enums']['pnv_tx_event_type'];
          id?: string;
          transaction_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pnv_transaction_events_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_transactions';
            referencedColumns: ['id'];
          }
        ];
      };
      pnv_transactions: {
        Row: {
          block_id: string | null;
          created_at: string;
          fee: string;
          hash: string;
          id: string;
          payload: Json | null;
          sender_id: string | null;
          status: Database['public']['Enums']['pnv_transaction_status'];
        };
        Insert: {
          block_id?: string | null;
          created_at?: string;
          fee?: string;
          hash: string;
          id?: string;
          payload?: Json | null;
          sender_id?: string | null;
          status?: Database['public']['Enums']['pnv_transaction_status'];
        };
        Update: {
          block_id?: string | null;
          created_at?: string;
          fee?: string;
          hash?: string;
          id?: string;
          payload?: Json | null;
          sender_id?: string | null;
          status?: Database['public']['Enums']['pnv_transaction_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'pnv_transactions_block_id_fkey';
            columns: ['block_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_blocks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pnv_transactions_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_actors';
            referencedColumns: ['id'];
          }
        ];
      };
      pnv_assets: {
        Row: {
          code: string;
          created_at: string;
          decimals: number;
          id: string;
          max_supply: string | null;
          metadata: Json | null;
          name: string;
          total_supply: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          decimals?: number;
          id?: string;
          max_supply?: string | null;
          metadata?: Json | null;
          name: string;
          total_supply?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          decimals?: number;
          id?: string;
          max_supply?: string | null;
          metadata?: Json | null;
          name?: string;
          total_supply?: string;
        };
        Relationships: [];
      };
      pnv_wallets: {
        Row: {
          asset_id: string;
          balance: string;
          created_at: string;
          id: string;
          label: string | null;
          owner_id: string | null;
          updated_at: string;
        };
        Insert: {
          asset_id: string;
          balance?: string;
          created_at?: string;
          id?: string;
          label?: string | null;
          owner_id?: string | null;
          updated_at?: string;
        };
        Update: {
          asset_id?: string;
          balance?: string;
          created_at?: string;
          id?: string;
          label?: string | null;
          owner_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pnv_wallets_asset_id_fkey';
            columns: ['asset_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_assets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pnv_wallets_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_actors';
            referencedColumns: ['id'];
          }
        ];
      };
      pnv_wallet_transactions: {
        Row: {
          amount: string;
          asset_id: string;
          created_at: string;
          from_wallet: string | null;
          id: string;
          memo: string | null;
          to_wallet: string | null;
        };
        Insert: {
          amount: string;
          asset_id: string;
          created_at?: string;
          from_wallet?: string | null;
          id?: string;
          memo?: string | null;
          to_wallet?: string | null;
        };
        Update: {
          amount?: string;
          asset_id?: string;
          created_at?: string;
          from_wallet?: string | null;
          id?: string;
          memo?: string | null;
          to_wallet?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pnv_wallet_transactions_asset_id_fkey';
            columns: ['asset_id'];
            isOneToOne: false;
            referencedRelation: 'pnv_assets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pnv_wallet_transactions_from_wallet_fkey';
            columns: ['from_wallet'];
            isOneToOne: false;
            referencedRelation: 'pnv_wallets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pnv_wallet_transactions_to_wallet_fkey';
            columns: ['to_wallet'];
            isOneToOne: false;
            referencedRelation: 'pnv_wallets';
            referencedColumns: ['id'];
          }
        ];
      };
      pnv_demo_transactions: {
        Row: {
          amount: string;
          block_group_id: string | null;
          created_at: string | null;
          from_account: string;
          id: string;
          status: string;
          to_account: string;
        };
        Insert: {
          amount: string;
          block_group_id?: string | null;
          created_at?: string | null;
          from_account: string;
          id?: string;
          status?: string;
          to_account: string;
        };
        Update: {
          amount?: string;
          block_group_id?: string | null;
          created_at?: string | null;
          from_account?: string;
          id?: string;
          status?: string;
          to_account?: string;
        };
        Relationships: [];
      };
      pnv_demo_system_state: {
        Row: {
          id: boolean;
        };
        Insert: {
          id?: boolean;
        };
        Update: {
          id?: boolean;
        };
        Relationships: [];
      };
      election_polling_stations: {
        Row: {
          id: string;
          name: string;
          address: string;
          city: string;
          latitude: number;
          longitude: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          city: string;
          latitude: number;
          longitude: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          city?: string;
          latitude?: number;
          longitude?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      election_voters: {
        Row: {
          id: string;
          nombre: string;
          apellido: string;
          dni: string;
          telefono: string;
          direccion: string;
          polling_station_id: string | null;
          latitude: number | null;
          longitude: number | null;
          registered: boolean;
          voted: boolean;
          vote_party: 'PSOE' | 'PP' | 'Podemos' | 'Vox' | 'PnV' | null;
          vote_method: 'online' | 'presential' | null;
          sms_code: string;
          vote_hash: string | null;
          block_hash: string | null;
          block_number: number | null;
          status: 'registered' | 'voted' | 'verified' | 'counted' | 'audited' | 'challenged';
          user_verified: boolean;
          first_sms_sent: boolean;
          chain_downloaded: boolean;
          second_sms_sent: boolean;
          challenged: boolean;
          audit_match: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          apellido: string;
          dni: string;
          telefono: string;
          direccion: string;
          polling_station_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          registered?: boolean;
          voted?: boolean;
          vote_party?: 'PSOE' | 'PP' | 'Podemos' | 'Vox' | 'PnV' | null;
          vote_method?: 'online' | 'presential' | null;
          sms_code?: string;
          vote_hash?: string | null;
          block_hash?: string | null;
          block_number?: number | null;
          status?: 'registered' | 'voted' | 'verified' | 'counted' | 'audited' | 'challenged';
          user_verified?: boolean;
          first_sms_sent?: boolean;
          chain_downloaded?: boolean;
          second_sms_sent?: boolean;
          challenged?: boolean;
          audit_match?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          apellido?: string;
          dni?: string;
          telefono?: string;
          direccion?: string;
          polling_station_id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          registered?: boolean;
          voted?: boolean;
          vote_party?: 'PSOE' | 'PP' | 'Podemos' | 'Vox' | 'PnV' | null;
          vote_method?: 'online' | 'presential' | null;
          sms_code?: string;
          vote_hash?: string | null;
          block_hash?: string | null;
          block_number?: number | null;
          status?: 'registered' | 'voted' | 'verified' | 'counted' | 'audited' | 'challenged';
          user_verified?: boolean;
          first_sms_sent?: boolean;
          chain_downloaded?: boolean;
          second_sms_sent?: boolean;
          challenged?: boolean;
          audit_match?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'election_voters_polling_station_id_fkey';
            columns: ['polling_station_id'];
            isOneToOne: false;
            referencedRelation: 'election_polling_stations';
            referencedColumns: ['id'];
          }
        ];
      };
      election_partial_results: {
        Row: {
          id: string;
          phase: number;
          party: 'PSOE' | 'PP' | 'Podemos' | 'Vox' | 'PnV';
          votes: number;
          percentage: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          phase: number;
          party: 'PSOE' | 'PP' | 'Podemos' | 'Vox' | 'PnV';
          votes?: number;
          percentage?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          phase?: number;
          party?: 'PSOE' | 'PP' | 'Podemos' | 'Vox' | 'PnV';
          votes?: number;
          percentage?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      election_audits: {
        Row: {
          id: string;
          auditor_name: string;
          total_votes_checked: number;
          matches: number;
          mismatches: number;
          match_percentage: number | null;
          status: 'pending' | 'completed' | 'failed';
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          auditor_name: string;
          total_votes_checked?: number;
          matches?: number;
          mismatches?: number;
          match_percentage?: number | null;
          status?: 'pending' | 'completed' | 'failed';
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          auditor_name?: string;
          total_votes_checked?: number;
          matches?: number;
          mismatches?: number;
          match_percentage?: number | null;
          status?: 'pending' | 'completed' | 'failed';
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      demo_get_dashboard_state: {
        Args: Record<string, never>;
        Returns: Database['public']['CompositeTypes']['demo_dashboard_state'];
      };
      demo_add_transaction: {
        Args: { _from: string; _to: string; _amount: number };
        Returns: string;
      };
      demo_start_consensus: {
        Args: Record<string, never>;
        Returns: string;
      };
      demo_cast_vote: {
        Args: { _block_group_id: string; _commissioner_id: string; _approve: boolean };
        Returns: string;
      };
      demo_finalize_block: {
        Args: { _block_group_id: string; force?: boolean };
        Returns: string;
      };
      demo_create_wallet: {
        Args: { _owner: string | null; _label?: string | null };
        Returns: string;
      };
      demo_mint_votalia: {
        Args: { _wallet: string; _amount: number };
        Returns: void;
      };
      demo_transfer_votalia: {
        Args: { _from: string; _to: string; _amount: number; _memo?: string | null };
        Returns: void;
      };
      init_election_polling_stations: {
        Args: Record<string, never>;
        Returns: void;
      };
      init_election_voters: {
        Args: Record<string, never>;
        Returns: void;
      };
      register_vote: {
        Args: { p_voter_id: string; p_party: string; p_method?: string };
        Returns: { success: boolean; vote_hash: string; voter_id: string };
      };
      send_sms_phase3: {
        Args: { p_voter_id: string };
        Returns: {
          success: boolean;
          sms_sent: boolean;
          sms_code: string;
          encryption_key: string;
          encrypted_data: string;
          sms_message: string;
          voter: {
            id: string;
            nombre: string;
            apellido: string;
            telefono: string;
            vote_party: string;
            vote_hash: string;
            vote_method: string;
          };
        };
      };
      verify_vote_by_sms: {
        Args: { p_sms_code: string; p_voter_id?: string | null };
        Returns: { success: boolean; voter?: { id: string; nombre: string; apellido: string; vote_party: string; vote_hash: string; vote_method: string }; error?: string };
      };
      send_first_sms: {
        Args: Record<string, never>;
        Returns: { success: boolean; sms_sent: number };
      };
      download_blockchain_chain: {
        Args: Record<string, never>;
        Returns: { success: boolean; chain_downloaded: number; block_number: number };
      };
      send_second_sms: {
        Args: Record<string, never>;
        Returns: { success: boolean; sms_sent: number };
      };
      perform_external_audit: {
        Args: { p_auditor_name: string };
        Returns: { success: boolean; audit_id: string; total_votes: number; matches: number; match_percentage: number };
      };
      get_partial_results: {
        Args: Record<string, never>;
        Returns: Array<{ party: string; votes: number; percentage: number }>;
      };
      create_election_voter: {
        Args: { p_nombre: string; p_apellido: string; p_dni: string; p_telefono: string; p_direccion: string; p_polling_station_id?: string | null };
        Returns: { success: boolean; voter_id: string };
      };
      assign_random_votes: {
        Args: Record<string, never>;
        Returns: { success: boolean; votes_assigned: number };
      };
      simulate_sms_send: {
        Args: { p_voter_id: string };
        Returns: { success: boolean; sms_sent: boolean; sms_code: string; voter: { id: string; nombre: string; apellido: string; telefono: string; vote_party: string; vote_hash: string }; error?: string };
      };
      get_total_results: {
        Args: Record<string, never>;
        Returns: Array<{ party: string; votes: number; percentage: number }>;
      };
          get_final_results: {
            Args: Record<string, never>;
            Returns: Array<{ party: string; votes: number; percentage: number; audited_votes: number }>;
          };
          create_voter_random: {
            Args: Record<string, never>;
            Returns: { success: boolean; voter_id: string; nombre: string; apellido: string; dni: string; telefono: string; direccion: string };
          };
          simulate_individual_sms: {
            Args: { p_voter_id: string };
            Returns: { success: boolean; sms_sent: boolean; sms_code: string; voter: { id: string; nombre: string; apellido: string; telefono: string; vote_party: string; vote_hash: string }; is_correct: boolean; message: string; error?: string };
          };
          verify_individual_result: {
            Args: { p_voter_id: string; p_is_correct: boolean };
            Returns: { success: boolean; verified: boolean; is_correct: boolean; status: string; error?: string };
          };
          perform_second_audit: {
            Args: Record<string, never>;
            Returns: { success: boolean; total_votes: number; matches: number; match_percentage: number; sms_sent: number };
          };
          delete_vote: {
            Args: { p_voter_id: string };
            Returns: { success: boolean; message: string; error?: string };
          };
        };
    Enums: {
      pnv_actor_status: 'active' | 'inactive' | 'banned';
      pnv_block_group_status: 'pending' | 'voting' | 'confirmed' | 'timeout';
      pnv_block_status: 'unsubmitted' | 'submitted' | 'confirmed' | 'invalidated' | 'timeout';
      pnv_governance_choice: 'yes' | 'no' | 'abstain';
      pnv_parameter_status: 'draft' | 'pending' | 'active' | 'retired';
      pnv_proposal_status: 'draft' | 'voting' | 'accepted' | 'rejected' | 'executed';
      pnv_proposal_type: 'parameter_change' | 'role_change' | 'treasury' | 'other';
      pnv_role_type: 'voter' | 'bookkeeper' | 'candidate' | 'leader' | 'user';
      pnv_term_status: 'scheduled' | 'active' | 'closed';
      pnv_timeout_type: 'voter' | 'bookkeeper' | 'leader';
      pnv_transaction_status: 'queued' | 'assigned' | 'packed' | 'confirmed' | 'rejected';
      pnv_tx_event_type:
        | 'queued'
        | 'allocated'
        | 'broadcasted'
        | 'packed'
        | 'confirmed'
        | 'rejected';
      pnv_vote_opinion: 'approve' | 'reject';
    };
    CompositeTypes: {
      demo_dashboard_state: Json;
    };
  };
}

export type Tables<TName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TName]['Row'];

export type TablesInsert<TName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TName]['Insert'];

export type TablesUpdate<TName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TName]['Update'];

