export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type EpisodeStatus =
  | "draft"
  | "scripting"
  | "voice_over"
  | "animating"
  | "compositing"
  | "review"
  | "approved"
  | "publishing"
  | "published"
  | "failed";

export type JobType =
  | "script_generation"
  | "voice_over"
  | "image_generation"
  | "animation"
  | "music_generation"
  | "video_composition"
  | "publishing";

export type JobStatus = "pending" | "processing" | "completed" | "failed" | "retrying";

export type UserRole = "admin" | "editor" | "reviewer";

export type AssetType = "image" | "audio" | "video" | "music" | "sfx";

export type CharacterType = "main" | "supporting" | "background";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          updated_at?: string;
        };
      };
      characters: {
        Row: {
          id: string;
          name: string;
          type: CharacterType;
          species: string | null;
          description: string | null;
          personality: string | null;
          avatar_url: string | null;
          reference_images: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: CharacterType;
          species?: string | null;
          description?: string | null;
          personality?: string | null;
          avatar_url?: string | null;
          reference_images?: Json;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          type?: CharacterType;
          species?: string | null;
          description?: string | null;
          personality?: string | null;
          avatar_url?: string | null;
          reference_images?: Json;
          is_active?: boolean;
        };
      };
      episodes: {
        Row: {
          id: string;
          title: string;
          episode_number: number | null;
          season: number;
          theme: string | null;
          moral_lesson: string | null;
          target_duration: number;
          status: EpisodeStatus;
          script: string | null;
          script_version: number;
          thumbnail_url: string | null;
          video_url: string | null;
          published_url: string | null;
          facebook_post_id: string | null;
          scheduled_at: string | null;
          published_at: string | null;
          created_by: string | null;
          reviewed_by: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          episode_number?: number | null;
          season?: number;
          theme?: string | null;
          moral_lesson?: string | null;
          target_duration?: number;
          status?: EpisodeStatus;
          script?: string | null;
          metadata?: Json;
        };
        Update: {
          title?: string;
          episode_number?: number | null;
          theme?: string | null;
          moral_lesson?: string | null;
          status?: EpisodeStatus;
          script?: string | null;
          thumbnail_url?: string | null;
          video_url?: string | null;
          published_url?: string | null;
          facebook_post_id?: string | null;
          scheduled_at?: string | null;
          published_at?: string | null;
          reviewed_by?: string | null;
          metadata?: Json;
        };
      };
      assets: {
        Row: {
          id: string;
          episode_id: string | null;
          name: string;
          type: AssetType;
          subtype: string | null;
          url: string;
          duration: number | null;
          size_bytes: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          episode_id?: string | null;
          name: string;
          type: AssetType;
          subtype?: string | null;
          url: string;
          duration?: number | null;
          size_bytes?: number | null;
          metadata?: Json;
        };
        Update: {
          name?: string;
          subtype?: string | null;
          url?: string;
          metadata?: Json;
        };
      };
      production_jobs: {
        Row: {
          id: string;
          episode_id: string | null;
          job_type: JobType;
          status: JobStatus;
          priority: number;
          attempts: number;
          max_attempts: number;
          payload: Json;
          result: Json;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          episode_id?: string | null;
          job_type: JobType;
          status?: JobStatus;
          priority?: number;
          payload?: Json;
        };
        Update: {
          status?: JobStatus;
          attempts?: number;
          result?: Json;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
        };
      };
      review_notes: {
        Row: {
          id: string;
          episode_id: string | null;
          reviewer_id: string | null;
          note: string;
          status: "open" | "resolved";
          timestamp_ref: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          episode_id?: string | null;
          reviewer_id?: string | null;
          note: string;
          status?: "open" | "resolved";
          timestamp_ref?: number | null;
        };
        Update: {
          note?: string;
          status?: "open" | "resolved";
        };
      };
    };
  };
}

// Helper types yang sering dipakai
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Character = Database["public"]["Tables"]["characters"]["Row"];
export type Episode = Database["public"]["Tables"]["episodes"]["Row"];
export type Asset = Database["public"]["Tables"]["assets"]["Row"];
export type ProductionJob = Database["public"]["Tables"]["production_jobs"]["Row"];
export type ReviewNote = Database["public"]["Tables"]["review_notes"]["Row"];
