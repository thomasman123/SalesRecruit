export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          score: number | null
          score_reasons: string[] | null
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
          score?: number | null
          score_reasons?: string[] | null
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
          score?: number | null
          score_reasons?: string[] | null
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
      email_notification_history: {
        Row: {
          created_at: string
          error_message: string | null
          id: number
          job_id: number
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: number
          job_id: number
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: number
          job_id?: number
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_notification_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_notification_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notification_preferences: {
        Row: {
          created_at: string
          id: number
          job_notifications_enabled: boolean | null
          last_notification_sent: string | null
          notification_frequency: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          job_notifications_enabled?: boolean | null
          last_notification_sent?: string | null
          notification_frequency?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          job_notifications_enabled?: boolean | null
          last_notification_sent?: string | null
          notification_frequency?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
          role: string | null
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
          role?: string | null
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
          role?: string | null
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
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          href: string | null
          id: string
          read: boolean | null
          title: string
          user_id: string
          metadata: Record<string, any> | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          href?: string | null
          id?: string
          read?: boolean | null
          title: string
          user_id: string
          metadata?: Record<string, any> | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          href?: string | null
          id?: string
          read?: boolean | null
          title?: string
          user_id?: string
          metadata?: Record<string, any> | null
        }
        Relationships: []
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
      calendar_connections: {
        Row: {
          id: number
          user_id: string
          provider: string
          access_token: string | null
          refresh_token: string | null
          token_expiry: string | null
          calendar_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          provider?: string
          access_token?: string | null
          refresh_token?: string | null
          token_expiry?: string | null
          calendar_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          provider?: string
          access_token?: string | null
          refresh_token?: string | null
          token_expiry?: string | null
          calendar_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      calendar_availability: {
        Row: {
          id: number
          user_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      scheduled_interviews: {
        Row: {
          id: number
          job_id: number
          applicant_id: number
          recruiter_id: string
          sales_rep_id: string
          scheduled_date: string
          scheduled_time: string
          duration_minutes: number
          meeting_link: string | null
          calendar_event_id: string | null
          status: string
          additional_message: string | null
          created_at: string
          updated_at: string
          day_reminder_sent: string | null
          hour_reminder_sent: string | null
        }
        Insert: {
          id?: number
          job_id: number
          applicant_id: number
          recruiter_id: string
          sales_rep_id: string
          scheduled_date: string
          scheduled_time: string
          duration_minutes?: number
          meeting_link?: string | null
          calendar_event_id?: string | null
          status?: string
          additional_message?: string | null
          created_at?: string
          updated_at?: string
          day_reminder_sent?: string | null
          hour_reminder_sent?: string | null
        }
        Update: {
          id?: number
          job_id?: number
          applicant_id?: number
          recruiter_id?: string
          sales_rep_id?: string
          scheduled_date?: string
          scheduled_time?: string
          duration_minutes?: number
          meeting_link?: string | null
          calendar_event_id?: string | null
          status?: string
          additional_message?: string | null
          created_at?: string
          updated_at?: string
          day_reminder_sent?: string | null
          hour_reminder_sent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_interviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_interviews_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_interviews_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_interviews_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_logs: {
        Row: {
          id: number
          user_id: string
          user_role: string
          user_email: string
          action_type: string
          entity_type: string
          entity_id: string | null
          metadata: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          user_role: string
          user_email: string
          action_type: string
          entity_type: string
          entity_id?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          user_role?: string
          user_email?: string
          action_type?: string
          entity_type?: string
          entity_id?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      admin_dashboard_stats: {
        Row: {
          total_recruiters: number
          total_sales_professionals: number
          total_admins: number
          active_jobs: number
          total_applicants: number
          upcoming_interviews: number
          messages_today: number
          active_users_today: number
        }
      }
      admin_user_activity_summary: {
        Row: {
          user_id: string
          email: string
          name: string
          role: string
          total_actions: number
          last_activity: string | null
          actions_today: number
          actions_this_week: number
        }
      }
    }
    Functions: {
      record_notification_sent: {
        Args: {
          p_user_id: string
          p_job_id: number
          p_status?: string
          p_error_message?: string
        }
        Returns: undefined
      }
      update_notification_preferences: {
        Args: {
          p_user_id: string
          p_job_notifications_enabled: boolean
          p_notification_frequency: string
        }
        Returns: undefined
      }
      log_activity: {
        Args: {
          p_action_type: string
          p_entity_type: string
          p_entity_id?: string
          p_metadata?: Json
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
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
  public: {
    Enums: {},
  },
} as const
