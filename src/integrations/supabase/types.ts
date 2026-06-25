export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          available_balance: number | null
          created_at: string
          currency: string | null
          current_balance: number | null
          elder_id: string
          id: string
          mask: string | null
          name: string
          official_name: string | null
          plaid_account_id: string
          plaid_item_id: string
          subtype: string | null
          updated_at: string
        }
        Insert: {
          available_balance?: number | null
          created_at?: string
          currency?: string | null
          current_balance?: number | null
          elder_id: string
          id?: string
          mask?: string | null
          name: string
          official_name?: string | null
          plaid_account_id: string
          plaid_item_id: string
          subtype?: string | null
          updated_at?: string
        }
        Update: {
          available_balance?: number | null
          created_at?: string
          currency?: string | null
          current_balance?: number | null
          elder_id?: string
          id?: string
          mask?: string | null
          name?: string
          official_name?: string | null
          plaid_account_id?: string
          plaid_item_id?: string
          subtype?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_elder_id_fkey"
            columns: ["elder_id"]
            isOneToOne: false
            referencedRelation: "elders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_plaid_item_id_fkey"
            columns: ["plaid_item_id"]
            isOneToOne: false
            referencedRelation: "plaid_items"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          category: Database["public"]["Enums"]["alert_category"]
          created_at: string
          detail: string
          elder_id: string
          id: string
          resolved_at: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          source_excerpt: string | null
          suggested_action: string | null
          title: string
        }
        Insert: {
          category: Database["public"]["Enums"]["alert_category"]
          created_at?: string
          detail: string
          elder_id: string
          id?: string
          resolved_at?: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          source_excerpt?: string | null
          suggested_action?: string | null
          title: string
        }
        Update: {
          category?: Database["public"]["Enums"]["alert_category"]
          created_at?: string
          detail?: string
          elder_id?: string
          id?: string
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          source_excerpt?: string | null
          suggested_action?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_elder_id_fkey"
            columns: ["elder_id"]
            isOneToOne: false
            referencedRelation: "elders"
            referencedColumns: ["id"]
          },
        ]
      }
      elders: {
        Row: {
          caregiver_id: string
          consent_acknowledged_at: string
          created_at: string
          display_name: string
          id: string
          phone: string | null
          relationship: string
        }
        Insert: {
          caregiver_id: string
          consent_acknowledged_at?: string
          created_at?: string
          display_name: string
          id?: string
          phone?: string | null
          relationship: string
        }
        Update: {
          caregiver_id?: string
          consent_acknowledged_at?: string
          created_at?: string
          display_name?: string
          id?: string
          phone?: string | null
          relationship?: string
        }
        Relationships: []
      }
      known_payees: {
        Row: {
          created_at: string
          elder_id: string
          first_seen: string
          id: string
          last_seen: string
          name: string
          normalized_name: string
          transaction_count: number
        }
        Insert: {
          created_at?: string
          elder_id: string
          first_seen: string
          id?: string
          last_seen: string
          name: string
          normalized_name: string
          transaction_count?: number
        }
        Update: {
          created_at?: string
          elder_id?: string
          first_seen?: string
          id?: string
          last_seen?: string
          name?: string
          normalized_name?: string
          transaction_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "known_payees_elder_id_fkey"
            columns: ["elder_id"]
            isOneToOne: false
            referencedRelation: "elders"
            referencedColumns: ["id"]
          },
        ]
      }
      monitors: {
        Row: {
          created_at: string
          elder_id: string
          enabled: boolean
          id: string
          kind: Database["public"]["Enums"]["monitor_kind"]
          status: Database["public"]["Enums"]["monitor_status"]
        }
        Insert: {
          created_at?: string
          elder_id: string
          enabled?: boolean
          id?: string
          kind: Database["public"]["Enums"]["monitor_kind"]
          status?: Database["public"]["Enums"]["monitor_status"]
        }
        Update: {
          created_at?: string
          elder_id?: string
          enabled?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["monitor_kind"]
          status?: Database["public"]["Enums"]["monitor_status"]
        }
        Relationships: [
          {
            foreignKeyName: "monitors_elder_id_fkey"
            columns: ["elder_id"]
            isOneToOne: false
            referencedRelation: "elders"
            referencedColumns: ["id"]
          },
        ]
      }
      plaid_items: {
        Row: {
          caregiver_id: string
          created_at: string
          elder_id: string
          id: string
          institution_id: string | null
          institution_name: string | null
          plaid_access_token: string | null
          plaid_item_id: string
          status: string
          updated_at: string
        }
        Insert: {
          caregiver_id: string
          created_at?: string
          elder_id: string
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          plaid_access_token?: string | null
          plaid_item_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          caregiver_id?: string
          created_at?: string
          elder_id?: string
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          plaid_access_token?: string | null
          plaid_item_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plaid_items_elder_id_fkey"
            columns: ["elder_id"]
            isOneToOne: false
            referencedRelation: "elders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category: Json | null
          created_at: string
          date: string
          elder_id: string
          id: string
          iso_currency_code: string | null
          location: Json | null
          merchant_name: string | null
          name: string
          payment_channel: string | null
          pending: boolean
          plaid_transaction_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category?: Json | null
          created_at?: string
          date: string
          elder_id: string
          id?: string
          iso_currency_code?: string | null
          location?: Json | null
          merchant_name?: string | null
          name: string
          payment_channel?: string | null
          pending?: boolean
          plaid_transaction_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category?: Json | null
          created_at?: string
          date?: string
          elder_id?: string
          id?: string
          iso_currency_code?: string | null
          location?: Json | null
          merchant_name?: string | null
          name?: string
          payment_channel?: string | null
          pending?: boolean
          plaid_transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_elder_id_fkey"
            columns: ["elder_id"]
            isOneToOne: false
            referencedRelation: "elders"
            referencedColumns: ["id"]
          },
        ]
      }
      triage_checks: {
        Row: {
          caregiver_id: string
          confidence: number
          created_at: string
          elder_id: string | null
          id: string
          input_text: string
          recommendation: string
          signals: Json
          verdict: Database["public"]["Enums"]["triage_verdict"]
        }
        Insert: {
          caregiver_id: string
          confidence: number
          created_at?: string
          elder_id?: string | null
          id?: string
          input_text: string
          recommendation: string
          signals?: Json
          verdict: Database["public"]["Enums"]["triage_verdict"]
        }
        Update: {
          caregiver_id?: string
          confidence?: number
          created_at?: string
          elder_id?: string | null
          id?: string
          input_text?: string
          recommendation?: string
          signals?: Json
          verdict?: Database["public"]["Enums"]["triage_verdict"]
        }
        Relationships: [
          {
            foreignKeyName: "triage_checks_elder_id_fkey"
            columns: ["elder_id"]
            isOneToOne: false
            referencedRelation: "elders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      alert_category:
        | "scam_call"
        | "suspicious_transaction"
        | "identity"
        | "forwarded_message"
      alert_severity: "info" | "watch" | "urgent"
      monitor_kind: "calls_sms" | "financial" | "identity"
      monitor_status: "active" | "setup_needed" | "paused"
      triage_verdict: "safe" | "suspicious" | "scam"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_category: [
        "scam_call",
        "suspicious_transaction",
        "identity",
        "forwarded_message",
      ],
      alert_severity: ["info", "watch", "urgent"],
      monitor_kind: ["calls_sms", "financial", "identity"],
      monitor_status: ["active", "setup_needed", "paused"],
      triage_verdict: ["safe", "suspicious", "scam"],
    },
  },
} as const
