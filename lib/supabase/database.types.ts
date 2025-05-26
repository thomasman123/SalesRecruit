export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      applicants: {
        Row: {
          applied_date: string
          avatar_url: string | null
          created_at: string
          email: string
          experience: string
          highest_ticket: string
          id: number
          job_id: number
          location: string
          name: string
          notes: string | null
          sales_style: string
          starred: boolean
          status: string
          tools: string
          updated_at: string
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          applied_date?: string
          avatar_url?: string | null
          created_at?: string
          email: string
          experience: string
          highest_ticket: string
          id?: number
          job_id: number
          location: string
          name: string
          notes?: string | null
          sales_style: string
          starred?: boolean
          status: string
          tools: string
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          applied_date?: string
          avatar_url?: string | null
          created_at?: string
          email?: string
          experience?: string
          highest_ticket?: string
          id?: number
          job_id?: number
          location?: string
          name?: string
          notes?: string | null
          sales_style?: string
          starred?: boolean
          status?: string
          tools?: string
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applicants_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          applicant_id: number
          applicant_user_id: string
          created_at: string
          id: number
          job_id: number
          last_message_timestamp: string
          recruiter_id: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          applicant_id: number
          applicant_user_id: string
          created_at?: string
          id?: number
          job_id: number
          last_message_timestamp?: string
          recruiter_id: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          applicant_id?: number
          applicant_user_id?: string
          created_at?: string
          id?: number
          job_id?: number
          last_message_timestamp?: string
          recruiter_id?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_applicant_user_id_fkey"
            columns: ["applicant_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          applicants_count: number
          commission_breakdown: string | null
          commission_structure: string
          company_overview: string | null
          created_at: string
          id: number
          industry: string
          lead_source: string
          not_for: string | null
          price_range: string
          ramp_time: string | null
          recruiter_id: string
          remote_compatible: boolean
          sales_process: string | null
          status: string
          team_size: string
          title: string
          updated_at: string
          video_url: string | null
          views: number
          what_you_sell: string | null
          whats_provided: string[] | null
          working_hours: string | null
        }
        Insert: {
          applicants_count?: number
          commission_breakdown?: string | null
          commission_structure: string
          company_overview?: string | null
          created_at?: string
          id?: number
          industry: string
          lead_source: string
          not_for?: string | null
          price_range: string
          ramp_time?: string | null
          recruiter_id: string
          remote_compatible?: boolean
          sales_process?: string | null
          status: string
          team_size: string
          title: string
          updated_at?: string
          video_url?: string | null
          views?: number
          what_you_sell?: string | null
          whats_provided?: string[] | null
          working_hours?: string | null
        }
        Update: {
          applicants_count?: number
          commission_breakdown?: string | null
          commission_structure?: string
          company_overview?: string | null
          created_at?: string
          id?: number
          industry?: string
          lead_source?: string
          not_for?: string | null
          price_range?: string
          ramp_time?: string | null
          recruiter_id?: string
          remote_compatible?: boolean
          sales_process?: string | null
          status?: string
          team_size?: string
          title?: string
          updated_at?: string
          video_url?: string | null
          views?: number
          what_you_sell?: string | null
          whats_provided?: string[] | null
          working_hours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: number
          created_at: string
          id: number
          read: boolean
          sender_id: string
          sender_type: string
          timestamp: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: number
          created_at?: string
          id?: number
          read?: boolean
          sender_id: string
          sender_type: string
          timestamp?: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: number
          created_at?: string
          id?: number
          read?: boolean
          sender_id?: string
          sender_type?: string
          timestamp?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          role: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
