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
      ocorrencias: {
        Row: {
          created_at: string
          data: string
          descricao: string
          id: string
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          data?: string
          descricao: string
          id?: string
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      operadores: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          matricula: string | null
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          matricula?: string | null
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          matricula?: string | null
          nome?: string
        }
        Relationships: []
      }
      producao: {
        Row: {
          atualizado_por: string | null
          avulsa: boolean
          balsa: string | null
          created_at: string
          criado_por: string | null
          data: string
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          nesting: string | null
          observacoes: string | null
          operador_id: string | null
          painel: string | null
          peca: string
          peso_total: number | null
          peso_unitario: number | null
          quantidade: number
          tempo_total_segundos: number | null
          updated_at: string
        }
        Insert: {
          atualizado_por?: string | null
          avulsa?: boolean
          balsa?: string | null
          created_at?: string
          criado_por?: string | null
          data?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          nesting?: string | null
          observacoes?: string | null
          operador_id?: string | null
          painel?: string | null
          peca: string
          peso_total?: number | null
          peso_unitario?: number | null
          quantidade?: number
          tempo_total_segundos?: number | null
          updated_at?: string
        }
        Update: {
          atualizado_por?: string | null
          avulsa?: boolean
          balsa?: string | null
          created_at?: string
          criado_por?: string | null
          data?: string
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          nesting?: string | null
          observacoes?: string | null
          operador_id?: string | null
          painel?: string | null
          peca?: string
          peso_total?: number | null
          peso_unitario?: number | null
          quantidade?: number
          tempo_total_segundos?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "producao_operador_id_fkey"
            columns: ["operador_id"]
            isOneToOne: false
            referencedRelation: "operadores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id: string
          nome?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "supervisor" | "viewer"
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
      app_role: ["admin", "supervisor", "viewer"],
    },
  },
} as const
