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
      user_profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          credits: number
          name?: string
          avatar_url?: string
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          credits?: number
          name?: string
          avatar_url?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          credits?: number
          name?: string
          avatar_url?: string
        }
      }
      image_generations: {
        Row: {
          id: string
          created_at: string
          user_id: string
          prompt: string
          image_url: string
          status: string
          width?: number
          height?: number
          model?: string
          negative_prompt?: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          prompt: string
          image_url: string
          status?: string
          width?: number
          height?: number
          model?: string
          negative_prompt?: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          prompt?: string
          image_url?: string
          status?: string
          width?: number
          height?: number
          model?: string
          negative_prompt?: string
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