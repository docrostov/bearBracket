// Hand-written to match supabase/migrations/0001_init.sql.
// Regenerate with `supabase gen types typescript` once the Supabase CLI is linked
// to the project, and this file can be replaced wholesale.

export type CompetitionStatus = 'draft' | 'open' | 'locked' | 'complete'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          created_at: string
        }
        Insert: {
          id: string
          display_name: string
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          created_at?: string
        }
        Relationships: []
      }
      competitions: {
        Row: {
          id: string
          slug: string
          name: string
          year: number
          bracket_size: number
          status: CompetitionStatus
          picks_lock_at: string | null
          points_per_round: number[]
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          year: number
          bracket_size: number
          status?: CompetitionStatus
          picks_lock_at?: string | null
          points_per_round?: number[]
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          year?: number
          bracket_size?: number
          status?: CompetitionStatus
          picks_lock_at?: string | null
          points_per_round?: number[]
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      contestants: {
        Row: {
          id: string
          competition_id: string
          name: string
          seed: number | null
          image_url: string | null
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          competition_id: string
          name: string
          seed?: number | null
          image_url?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          competition_id?: string
          name?: string
          seed?: number | null
          image_url?: string | null
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Relationships: []
      }
      matchups: {
        Row: {
          id: string
          competition_id: string
          round: number
          slot_in_round: number
          contestant_a_id: string | null
          contestant_b_id: string | null
          winner_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          competition_id: string
          round: number
          slot_in_round: number
          contestant_a_id?: string | null
          contestant_b_id?: string | null
          winner_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          competition_id?: string
          round?: number
          slot_in_round?: number
          contestant_a_id?: string | null
          contestant_b_id?: string | null
          winner_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      entries: {
        Row: {
          id: string
          competition_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          competition_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          competition_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      picks: {
        Row: {
          id: string
          entry_id: string
          matchup_id: string
          picked_contestant_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          entry_id: string
          matchup_id: string
          picked_contestant_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          entry_id?: string
          matchup_id?: string
          picked_contestant_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      competition_status: CompetitionStatus
    }
    CompositeTypes: Record<string, never>
  }
}
