export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_invite_links: {
        Row: {
          active: boolean
          classroom_id: string
          created_at: string
          for_role: Database["public"]["Enums"]["app_role"]
          id: string
          invite_code: string
        }
        Insert: {
          active?: boolean
          classroom_id: string
          created_at?: string
          for_role: Database["public"]["Enums"]["app_role"]
          id?: string
          invite_code: string
        }
        Update: {
          active?: boolean
          classroom_id?: string
          created_at?: string
          for_role?: Database["public"]["Enums"]["app_role"]
          id?: string
          invite_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_invite_links_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      daily_words: {
        Row: {
          approved: boolean
          classroom_id: string
          created_at: string
          created_by: string | null
          date: string
          id: string
          image_alt: string | null
          image_url: string | null
          norwegian: string
          theme: string | null
        }
        Insert: {
          approved?: boolean
          classroom_id: string
          created_at?: string
          created_by?: string | null
          date: string
          id?: string
          image_alt?: string | null
          image_url?: string | null
          norwegian: string
          theme?: string | null
        }
        Update: {
          approved?: boolean
          classroom_id?: string
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          image_alt?: string | null
          image_url?: string | null
          norwegian?: string
          theme?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_words_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_recordings: {
        Row: {
          audio_url: string
          created_at: string
          dailyword_id: string
          id: string
          learner_id: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          dailyword_id: string
          id?: string
          learner_id: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          dailyword_id?: string
          id?: string
          learner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_recordings_dailyword_id_fkey"
            columns: ["dailyword_id"]
            isOneToOne: false
            referencedRelation: "daily_words"
            referencedColumns: ["id"]
          },
        ]
      }
      level_texts: {
        Row: {
          dailyword_id: string
          id: string
          image_alt: string | null
          image_url: string | null
          level: number
          text: string
        }
        Insert: {
          dailyword_id: string
          id?: string
          image_alt?: string | null
          image_url?: string | null
          level: number
          text: string
        }
        Update: {
          dailyword_id?: string
          id?: string
          image_alt?: string | null
          image_url?: string | null
          level?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "level_texts_dailyword_id_fkey"
            columns: ["dailyword_id"]
            isOneToOne: false
            referencedRelation: "daily_words"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          classroom_id: string | null
          created_at: string
          difficulty_level: number
          email: string | null
          id: string
          l1: string | null
          name: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          classroom_id?: string | null
          created_at?: string
          difficulty_level?: number
          email?: string | null
          id: string
          l1?: string | null
          name: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          classroom_id?: string | null
          created_at?: string
          difficulty_level?: number
          email?: string | null
          id?: string
          l1?: string | null
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      pronunciations: {
        Row: {
          audio_url: string
          dailyword_id: string
          id: string
          language_code: string
        }
        Insert: {
          audio_url: string
          dailyword_id: string
          id?: string
          language_code: string
        }
        Update: {
          audio_url?: string
          dailyword_id?: string
          id?: string
          language_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "pronunciations_dailyword_id_fkey"
            columns: ["dailyword_id"]
            isOneToOne: false
            referencedRelation: "daily_words"
            referencedColumns: ["id"]
          },
        ]
      }
      task_results: {
        Row: {
          created_at: string
          id: string
          learner_id: string
          response: Json | null
          score: number | null
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          learner_id: string
          response?: Json | null
          score?: number | null
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          learner_id?: string
          response?: Json | null
          score?: number | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_results_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          answer: Json | null
          dailyword_id: string
          data: Json | null
          id: string
          level: number
          prompt: string | null
          type: Database["public"]["Enums"]["task_type"]
        }
        Insert: {
          answer?: Json | null
          dailyword_id: string
          data?: Json | null
          id?: string
          level: number
          prompt?: string | null
          type: Database["public"]["Enums"]["task_type"]
        }
        Update: {
          answer?: Json | null
          dailyword_id?: string
          data?: Json | null
          id?: string
          level?: number
          prompt?: string | null
          type?: Database["public"]["Enums"]["task_type"]
        }
        Relationships: [
          {
            foreignKeyName: "tasks_dailyword_id_fkey"
            columns: ["dailyword_id"]
            isOneToOne: false
            referencedRelation: "daily_words"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          dailyword_id: string
          id: string
          language_code: string
          text: string
        }
        Insert: {
          dailyword_id: string
          id?: string
          language_code: string
          text: string
        }
        Update: {
          dailyword_id?: string
          id?: string
          language_code?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "translations_dailyword_id_fkey"
            columns: ["dailyword_id"]
            isOneToOne: false
            referencedRelation: "daily_words"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          classroom_id: string
          created_at: string
          id: string
          title: string
          url: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          id?: string
          title: string
          url: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          id?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_tests: {
        Row: {
          auto_grade: boolean
          classroom_id: string
          date: string
          id: string
          iso_week: number
          tasks: Json
        }
        Insert: {
          auto_grade?: boolean
          classroom_id: string
          date: string
          id?: string
          iso_week: number
          tasks: Json
        }
        Update: {
          auto_grade?: boolean
          classroom_id?: string
          date?: string
          id?: string
          iso_week?: number
          tasks?: Json
        }
        Relationships: [
          {
            foreignKeyName: "weekly_tests_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      register_with_invite: {
        Args: {
          invite_code: string
          name: string
          l1_code?: string
          want_role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "learner"
      task_type:
        | "mcq"
        | "match"
        | "scramble"
        | "sentence_order"
        | "syllable_split"
        | "dictation"
        | "listening"
        | "picture_bingo"
        | "sound_to_letter"
        | "letter_to_sound"
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
      app_role: ["admin", "teacher", "learner"],
      task_type: [
        "mcq",
        "match",
        "scramble",
        "sentence_order",
        "syllable_split",
        "dictation",
        "listening",
        "picture_bingo",
        "sound_to_letter",
        "letter_to_sound",
      ],
    },
  },
} as const
