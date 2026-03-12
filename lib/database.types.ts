export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          auth_id: string | null
          name: string
          surname: string
          birth_date: string
          birth_gender: string
          email: string
          profile_picture: string | null
          biography: string | null
          club_id: number | null
          page_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          auth_id?: string | null
          name: string
          surname: string
          birth_date: string
          birth_gender: string
          email: string
          profile_picture?: string | null
          biography?: string | null
          club_id?: number | null
          page_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          auth_id?: string | null
          name?: string
          surname?: string
          birth_date?: string
          birth_gender?: string
          email?: string
          profile_picture?: string | null
          biography?: string | null
          club_id?: number | null
          page_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      arbitros: {
        Row: {
          id: number
          name: string
          title: string
          photo: string | null
          club_id: number | null
          birth_year: number | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          title: string
          photo?: string | null
          club_id?: number | null
          birth_year?: number | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          title?: string
          photo?: string | null
          club_id?: number | null
          birth_year?: number | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clubs: {
        Row: {
          id: number
          name: string
          address: string | null
          telephone: string | null
          mail: string | null
          schedule: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          address?: string | null
          telephone?: string | null
          mail?: string | null
          schedule?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          address?: string | null
          telephone?: string | null
          mail?: string | null
          schedule?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      elohistory: {
        Row: {
          id: number
          user_id: number
          elo: number
          recorded_at: string
        }
        Insert: {
          id?: number
          user_id: number
          elo: number
          recorded_at?: string
        }
        Update: {
          id?: number
          user_id?: number
          elo?: number
          recorded_at?: string
        }
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
      }
      documentos: {
        Row: {
          id: number
          name: string
          category: string
          file_path: string
          file_size: number | null
          file_type: string | null
          uploaded_by_auth_id: string | null
          sort_order: number
          importance_level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          category: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          uploaded_by_auth_id?: string | null
          sort_order?: number
          importance_level?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          category?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          uploaded_by_auth_id?: string | null
          sort_order?: number
          importance_level?: number
          created_at?: string
          updated_at?: string
        }
      }
      profesores: {
        Row: {
          id: number
          titulo: string
          foto: string | null
          club_id: number | null
          anio_nacimiento: number | null
          modalidad: string
          zona: string | null
          biografia: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          titulo: string
          foto?: string | null
          club_id?: number | null
          anio_nacimiento?: number | null
          modalidad?: string
          zona?: string | null
          biografia?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          titulo?: string
          foto?: string | null
          club_id?: number | null
          anio_nacimiento?: number | null
          modalidad?: string
          zona?: string | null
          biografia?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
} 