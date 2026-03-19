export type Platform = "instagram" | "tiktok";

export type PostType =
  | "reel"
  | "carousel"
  | "story"
  | "single_image"
  | "video"
  | "photo";

export type PostStatus = "idea" | "draft" | "scheduled" | "published";

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string;
          platform: Platform;
          caption: string | null;
          post_type: PostType;
          status: PostStatus;
          scheduled_at: string | null;
          published_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          platform: Platform;
          caption?: string | null;
          post_type: PostType;
          status?: PostStatus;
          scheduled_at?: string | null;
          published_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          platform?: Platform;
          caption?: string | null;
          post_type?: PostType;
          status?: PostStatus;
          scheduled_at?: string | null;
          published_at?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "post_analytics";
            referencedColumns: ["post_id"];
          },
        ];
      };
      analytics_snapshots: {
        Row: {
          id: string;
          platform: Platform;
          date: string;
          impressions: number;
          likes: number;
          comments: number;
          shares: number;
          saves: number;
          followers: number;
          engagement_rate: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          platform: Platform;
          date: string;
          impressions?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
          followers?: number;
          engagement_rate?: number;
          created_at?: string;
        };
        Update: {
          platform?: Platform;
          date?: string;
          impressions?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
          followers?: number;
          engagement_rate?: number;
        };
        Relationships: [];
      };
      post_analytics: {
        Row: {
          id: string;
          post_id: string;
          impressions: number;
          likes: number;
          comments: number;
          shares: number;
          saves: number;
          reach: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          impressions?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
          reach?: number;
          created_at?: string;
        };
        Update: {
          post_id?: string;
          impressions?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
          reach?: number;
        };
        Relationships: [
          {
            foreignKeyName: "post_analytics_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: true;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}
