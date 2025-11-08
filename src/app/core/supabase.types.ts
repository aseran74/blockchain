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
          assigned_height: number | null;
          assigned_slot: number | null;
          block_id: string | null;
          created_at: string;
          fee: string;
          hash: string;
          id: string;
          packed_at: string | null;
          payload: Json | null;
          sender_id: string | null;
          status: Database['public']['Enums']['pnv_transaction_status'];
        };
        Insert: {
          assigned_height?: number | null;
          assigned_slot?: number | null;
          block_id?: string | null;
          created_at?: string;
          fee?: string;
          hash: string;
          id?: string;
          packed_at?: string | null;
          payload?: Json | null;
          sender_id?: string | null;
          status?: Database['public']['Enums']['pnv_transaction_status'];
        };
        Update: {
          assigned_height?: number | null;
          assigned_slot?: number | null;
          block_id?: string | null;
          created_at?: string;
          fee?: string;
          hash?: string;
          id?: string;
          packed_at?: string | null;
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
    };
    Views: {};
    Functions: {};
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
  };
}

export type Tables<TName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TName]['Row'];

export type TablesInsert<TName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TName]['Insert'];

export type TablesUpdate<TName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TName]['Update'];

