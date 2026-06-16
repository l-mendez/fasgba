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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          auth_id: string
        }
        Insert: {
          auth_id: string
        }
        Update: {
          auth_id?: string
        }
        Relationships: []
      }
      alumnos: {
        Row: {
          auth_id: string
          created_at: string
        }
        Insert: {
          auth_id: string
          created_at?: string
        }
        Update: {
          auth_id?: string
          created_at?: string
        }
        Relationships: []
      }
      arbitros: {
        Row: {
          bio: string | null
          birth_year: number | null
          club_id: number | null
          created_at: string | null
          email: string | null
          id: number
          name: string
          phone: string | null
          photo: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          birth_year?: number | null
          club_id?: number | null
          created_at?: string | null
          email?: string | null
          id?: number
          name: string
          phone?: string | null
          photo?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          birth_year?: number | null
          club_id?: number | null
          created_at?: string | null
          email?: string | null
          id?: number
          name?: string
          phone?: string | null
          photo?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arbitros_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_admins: {
        Row: {
          auth_id: string
          club_id: number
        }
        Insert: {
          auth_id: string
          club_id: number
        }
        Update: {
          auth_id?: string
          club_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "club_admins_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          address: string | null
          id: number
          image: string | null
          mail: string | null
          name: string
          schedule: string | null
          telephone: string | null
        }
        Insert: {
          address?: string | null
          id?: number
          image?: string | null
          mail?: string | null
          name: string
          schedule?: string | null
          telephone?: string | null
        }
        Update: {
          address?: string | null
          id?: number
          image?: string | null
          mail?: string | null
          name?: string
          schedule?: string | null
          telephone?: string | null
        }
        Relationships: []
      }
      course_creators: {
        Row: {
          course_id: number
          user_id: number
        }
        Insert: {
          course_id: number
          user_id: number
        }
        Update: {
          course_id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_creators_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          address: string | null
          category: string | null
          cronogram: string | null
          description: string | null
          end_date: string | null
          id: number
          image: string | null
          includes: string | null
          level: string | null
          location: string | null
          places_left: number | null
          price: string | null
          quota: number | null
          requisites: string | null
          schedule: string | null
          start_date: string
          themes: string[] | null
          title: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          cronogram?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          image?: string | null
          includes?: string | null
          level?: string | null
          location?: string | null
          places_left?: number | null
          price?: string | null
          quota?: number | null
          requisites?: string | null
          schedule?: string | null
          start_date: string
          themes?: string[] | null
          title: string
        }
        Update: {
          address?: string | null
          category?: string | null
          cronogram?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          image?: string | null
          includes?: string | null
          level?: string | null
          location?: string | null
          places_left?: number | null
          price?: string | null
          quota?: number | null
          requisites?: string | null
          schedule?: string | null
          start_date?: string
          themes?: string[] | null
          title?: string
        }
        Relationships: []
      }
      documentos: {
        Row: {
          category: string
          created_at: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: number
          importance_level: number | null
          name: string
          sort_order: number | null
          updated_at: string | null
          uploaded_by_auth_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: number
          importance_level?: number | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
          uploaded_by_auth_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: number
          importance_level?: number | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          uploaded_by_auth_id?: string | null
        }
        Relationships: []
      }
      elohistory: {
        Row: {
          auth_id: string | null
          elo: number
          id: number
          recorded_at: string | null
        }
        Insert: {
          auth_id?: string | null
          elo: number
          id?: number
          recorded_at?: string | null
        }
        Update: {
          auth_id?: string | null
          elo?: number
          id?: number
          recorded_at?: string | null
        }
        Relationships: []
      }
      individual_games: {
        Row: {
          black_player_id: number | null
          board_number: number | null
          fen: string | null
          game_date: string | null
          game_time: string | null
          id: number
          pgn: string | null
          result: string | null
          round_id: number | null
          white_player_id: number | null
        }
        Insert: {
          black_player_id?: number | null
          board_number?: number | null
          fen?: string | null
          game_date?: string | null
          game_time?: string | null
          id?: number
          pgn?: string | null
          result?: string | null
          round_id?: number | null
          white_player_id?: number | null
        }
        Update: {
          black_player_id?: number | null
          board_number?: number | null
          fen?: string | null
          game_date?: string | null
          game_time?: string | null
          id?: number
          pgn?: string | null
          result?: string | null
          round_id?: number | null
          white_player_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "individual_games_black_player_id_fkey"
            columns: ["black_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "individual_games_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "individual_games_white_player_id_fkey"
            columns: ["white_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      match_games: {
        Row: {
          black_player_id: number | null
          board_number: number
          fen: string | null
          game_date: string | null
          game_time: string | null
          id: number
          match_id: number | null
          pgn: string | null
          result: string | null
          white_player_id: number | null
        }
        Insert: {
          black_player_id?: number | null
          board_number: number
          fen?: string | null
          game_date?: string | null
          game_time?: string | null
          id?: number
          match_id?: number | null
          pgn?: string | null
          result?: string | null
          white_player_id?: number | null
        }
        Update: {
          black_player_id?: number | null
          board_number?: number
          fen?: string | null
          game_date?: string | null
          game_time?: string | null
          id?: number
          match_id?: number | null
          pgn?: string | null
          result?: string | null
          white_player_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_games_black_player_id_fkey"
            columns: ["black_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_games_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_games_white_player_id_fkey"
            columns: ["white_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          id: number
          round_id: number | null
          team_a_id: number | null
          team_b_id: number | null
        }
        Insert: {
          id?: number
          round_id?: number | null
          team_a_id?: number | null
          team_b_id?: number | null
        }
        Update: {
          id?: number
          round_id?: number | null
          team_a_id?: number | null
          team_b_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_a_id_fkey"
            columns: ["team_a_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_b_id_fkey"
            columns: ["team_b_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          club_id: number | null
          created_at: string | null
          created_by_auth_id: string | null
          date: string | null
          extract: string | null
          id: number
          image: string | null
          tags: string[] | null
          text: string
          title: string
          updated_at: string | null
        }
        Insert: {
          club_id?: number | null
          created_at?: string | null
          created_by_auth_id?: string | null
          date?: string | null
          extract?: string | null
          id?: number
          image?: string | null
          tags?: string[] | null
          text: string
          title: string
          updated_at?: string | null
        }
        Update: {
          club_id?: number | null
          created_at?: string | null
          created_by_auth_id?: string | null
          date?: string | null
          extract?: string | null
          id?: number
          image?: string | null
          tags?: string[] | null
          text?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          club_id: number | null
          created_at: string
          error_message: string | null
          id: number
          recipients_count: number
          status: string
          target_id: string | null
          type: string
        }
        Insert: {
          club_id?: number | null
          created_at?: string
          error_message?: string | null
          id?: number
          recipients_count?: number
          status: string
          target_id?: string | null
          type: string
        }
        Update: {
          club_id?: number | null
          created_at?: string
          error_message?: string | null
          id?: number
          recipients_count?: number
          status?: string
          target_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          club_id: number | null
          fide_id: string | null
          full_name: string
          id: number
          rating: number | null
        }
        Insert: {
          club_id?: number | null
          fide_id?: string | null
          full_name: string
          id?: number
          rating?: number | null
        }
        Update: {
          club_id?: number | null
          fide_id?: string | null
          full_name?: string
          id?: number
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "players_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      profesores: {
        Row: {
          anio_nacimiento: number | null
          biografia: string | null
          club_id: number | null
          created_at: string | null
          email: string | null
          foto: string | null
          id: number
          modalidad: string
          tarifa_horaria: string | null
          telefono: string | null
          titulo: string
          updated_at: string | null
          zona: string | null
        }
        Insert: {
          anio_nacimiento?: number | null
          biografia?: string | null
          club_id?: number | null
          created_at?: string | null
          email?: string | null
          foto?: string | null
          id?: number
          modalidad?: string
          tarifa_horaria?: string | null
          telefono?: string | null
          titulo: string
          updated_at?: string | null
          zona?: string | null
        }
        Update: {
          anio_nacimiento?: number | null
          biografia?: string | null
          club_id?: number | null
          created_at?: string | null
          email?: string | null
          foto?: string | null
          id?: number
          modalidad?: string
          tarifa_horaria?: string | null
          telefono?: string | null
          titulo?: string
          updated_at?: string | null
          zona?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profesores_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      regulations: {
        Row: {
          download_link: string | null
          id: number
          pdf_file: string
          title: string
        }
        Insert: {
          download_link?: string | null
          id?: number
          pdf_file: string
          title: string
        }
        Update: {
          download_link?: string | null
          id?: number
          pdf_file?: string
          title?: string
        }
        Relationships: []
      }
      rounds: {
        Row: {
          id: number
          round_number: number
          tournament_id: number | null
        }
        Insert: {
          id?: number
          round_number: number
          tournament_id?: number | null
        }
        Update: {
          id?: number
          round_number?: number
          tournament_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rounds_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          club_id: number
          created_at: string | null
          id: number
          name: string
        }
        Insert: {
          club_id: number
          created_at?: string | null
          id?: number
          name: string
        }
        Update: {
          club_id?: number
          created_at?: string | null
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_registrations: {
        Row: {
          id: number
          player_id: number | null
          registration_date: string | null
          tournament_id: number | null
        }
        Insert: {
          id?: number
          player_id?: number | null
          registration_date?: string | null
          tournament_id?: number | null
        }
        Update: {
          id?: number
          player_id?: number | null
          registration_date?: string | null
          tournament_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_team_players: {
        Row: {
          player_id: number
          team_id: number | null
          tournament_id: number
        }
        Insert: {
          player_id: number
          team_id?: number | null
          tournament_id: number
        }
        Update: {
          player_id?: number
          team_id?: number | null
          tournament_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tournament_team_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_team_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_team_players_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_teams: {
        Row: {
          team_id: number
          tournament_id: number
        }
        Insert: {
          team_id: number
          tournament_id: number
        }
        Update: {
          team_id?: number
          tournament_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "tournament_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_teams_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournamentdates: {
        Row: {
          event_date: string
          id: number
          tournament_id: number | null
        }
        Insert: {
          event_date: string
          id?: number
          tournament_id?: number | null
        }
        Update: {
          event_date?: string
          id?: number
          tournament_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tournamentdates_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          cost: string | null
          created_by_club_id: number | null
          description: string | null
          id: number
          image: string | null
          inscription_details: string | null
          location: string | null
          max_teams: number | null
          pace: string | null
          place: string | null
          players_per_team: number | null
          prizes: string | null
          registration_deadline: string | null
          registration_link: string | null
          rounds: number | null
          team_match_points: Json | null
          time: string | null
          title: string
          tournament_type: string | null
        }
        Insert: {
          cost?: string | null
          created_by_club_id?: number | null
          description?: string | null
          id?: number
          image?: string | null
          inscription_details?: string | null
          location?: string | null
          max_teams?: number | null
          pace?: string | null
          place?: string | null
          players_per_team?: number | null
          prizes?: string | null
          registration_deadline?: string | null
          registration_link?: string | null
          rounds?: number | null
          team_match_points?: Json | null
          time?: string | null
          title: string
          tournament_type?: string | null
        }
        Update: {
          cost?: string | null
          created_by_club_id?: number | null
          description?: string | null
          id?: number
          image?: string | null
          inscription_details?: string | null
          location?: string | null
          max_teams?: number | null
          pace?: string | null
          place?: string | null
          players_per_team?: number | null
          prizes?: string | null
          registration_deadline?: string | null
          registration_link?: string | null
          rounds?: number | null
          team_match_points?: Json | null
          time?: string | null
          title?: string
          tournament_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_created_by_club_id_fkey"
            columns: ["created_by_club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows_club: {
        Row: {
          auth_id: string
          club_id: number
        }
        Insert: {
          auth_id: string
          club_id: number
        }
        Update: {
          auth_id?: string
          club_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_club_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_create_tournament_for_club: {
        Args: { target_club_id: number; user_id: string }
        Returns: boolean
      }
      can_manage_individual_game: {
        Args: { target_game_id: number; user_id: string }
        Returns: boolean
      }
      can_manage_match: {
        Args: { target_match_id: number; user_id: string }
        Returns: boolean
      }
      can_manage_match_game: {
        Args: { target_game_id: number; user_id: string }
        Returns: boolean
      }
      can_manage_news: {
        Args: {
          target_author_id: string
          target_club_id: number
          user_id: string
        }
        Returns: boolean
      }
      can_manage_player: {
        Args: { target_club_id: number; user_id: string }
        Returns: boolean
      }
      can_manage_round: {
        Args: { target_round_id: number; user_id: string }
        Returns: boolean
      }
      can_manage_team: {
        Args: { target_team_id: number; user_id: string }
        Returns: boolean
      }
      can_manage_tournament: {
        Args: { target_tournament_id: number; user_id: string }
        Returns: boolean
      }
      is_any_club_admin: { Args: { user_id: string }; Returns: boolean }
      is_club_admin: {
        Args: { target_club_id: number; user_id: string }
        Returns: boolean
      }
      is_site_admin: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
