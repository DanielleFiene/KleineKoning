/**
 * lib/types/database.ts
 * 
 * TypeScript type definities voor Supabase database schema. Auto-generated types
 * voor type-safe database queries en updates. Bevat alle tabel definities en relaties.
 */
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
      clients: {
        Row: {
          id: string;
          owner_user_id: string;
          name: string;
          btw_profile: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          name: string;
          btw_profile?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          name?: string;
          btw_profile?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          owner_user_id: string;
          client_id: string;
          name: string;
          rate_ex_btw: number | null;
          default_unit: "minutes" | "quarter" | "hour" | "day";
          rounding_rule: "none" | "nearest15" | "up15" | "down15";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          client_id: string;
          name: string;
          rate_ex_btw?: number | null;
          default_unit?: "minutes" | "quarter" | "hour" | "day";
          rounding_rule?: "none" | "nearest15" | "up15" | "down15";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          client_id?: string;
          name?: string;
          rate_ex_btw?: number | null;
          default_unit?: "minutes" | "quarter" | "hour" | "day";
          rounding_rule?: "none" | "nearest15" | "up15" | "down15";
          created_at?: string;
          updated_at?: string;
        };
      };
      time_entries: {
        Row: {
          id: string;
          owner_user_id: string;
          client_id: string;
          project_id: string;
          date: string;
          description: string;
          duration_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          client_id: string;
          project_id: string;
          date: string;
          description: string;
          duration_minutes: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          client_id?: string;
          project_id?: string;
          date?: string;
          description?: string;
          duration_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      statements: {
        Row: {
          id: string;
          owner_user_id: string;
          client_id: string;
          statement_number: string;
          period_start: string;
          period_end: string;
          generated_at: string;
          pdf_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          client_id: string;
          statement_number: string;
          period_start: string;
          period_end: string;
          generated_at?: string;
          pdf_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          client_id?: string;
          statement_number?: string;
          period_start?: string;
          period_end?: string;
          generated_at?: string;
          pdf_url?: string | null;
          created_at?: string;
        };
      };
      statement_lines: {
        Row: {
          id: string;
          statement_id: string;
          date: string;
          description: string;
          duration_minutes: number;
          project_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          statement_id: string;
          date: string;
          description: string;
          duration_minutes: number;
          project_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          statement_id?: string;
          date?: string;
          description?: string;
          duration_minutes?: number;
          project_name?: string;
          created_at?: string;
        };
      };
    };
  };
}

