export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          region: string | null;
          is_coach: boolean;
          onboarded: boolean;
          steam_id: string | null;
          dota_rank_tier: number | null;
          dota_leaderboard_rank: number | null;
          dota_rank_synced_at: string | null;
          cs2_premier_rating: number | null;
          cs2_competitive_rank: number | null;
          cs2_rank_synced_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          region?: string | null;
          is_coach?: boolean;
          onboarded?: boolean;
          steam_id?: string | null;
          dota_rank_tier?: number | null;
          dota_leaderboard_rank?: number | null;
          dota_rank_synced_at?: string | null;
          cs2_premier_rating?: number | null;
          cs2_competitive_rank?: number | null;
          cs2_rank_synced_at?: string | null;
        };
        Update: {
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          region?: string | null;
          is_coach?: boolean;
          onboarded?: boolean;
          steam_id?: string | null;
          dota_rank_tier?: number | null;
          dota_leaderboard_rank?: number | null;
          dota_rank_synced_at?: string | null;
          cs2_premier_rating?: number | null;
          cs2_competitive_rank?: number | null;
          cs2_rank_synced_at?: string | null;
        };
        Relationships: [];
      };
      games: {
        Row: {
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          name: string;
          slug: string;
        };
        Update: {
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      lfg_posts: {
        Row: {
          id: string;
          author_id: string;
          game_id: string;
          title: string;
          description: string | null;
          rank: string | null;
          region: string | null;
          roles_needed: string[] | null;
          players_needed: number;
          mode: string | null;
          status: "open" | "closed";
          created_at: string;
        };
        Insert: {
          author_id: string;
          game_id: string;
          title: string;
          description?: string | null;
          rank?: string | null;
          region?: string | null;
          roles_needed?: string[] | null;
          players_needed?: number;
          mode?: string | null;
          status?: "open" | "closed";
        };
        Update: {
          title?: string;
          description?: string | null;
          rank?: string | null;
          region?: string | null;
          roles_needed?: string[] | null;
          players_needed?: number;
          mode?: string | null;
          status?: "open" | "closed";
        };
        Relationships: [
          {
            foreignKeyName: "lfg_posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lfg_posts_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      coach_profiles: {
        Row: {
          id: string;
          profile_id: string;
          game_id: string;
          headline: string;
          bio: string | null;
          rate_note: string | null;
          contact_method: string;
          rank: string | null;
          rank_tier: number | null;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          game_id: string;
          headline: string;
          bio?: string | null;
          rate_note?: string | null;
          contact_method: string;
          rank?: string | null;
          rank_tier?: number | null;
        };
        Update: {
          headline?: string;
          bio?: string | null;
          rate_note?: string | null;
          contact_method?: string;
          rank?: string | null;
          rank_tier?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "coach_profiles_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coach_profiles_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_games: {
        Row: {
          profile_id: string;
          game_id: string;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          game_id: string;
        };
        Update: {
          profile_id?: string;
          game_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_games_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_games_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      lfg_join_requests: {
        Row: {
          id: string;
          post_id: string;
          requester_id: string;
          status: "pending" | "accepted" | "declined" | "removed" | "left";
          created_at: string;
        };
        Insert: {
          post_id: string;
          requester_id: string;
          status?: "pending" | "accepted" | "declined" | "removed" | "left";
        };
        Update: {
          status?: "pending" | "accepted" | "declined" | "removed" | "left";
        };
        Relationships: [
          {
            foreignKeyName: "lfg_join_requests_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "lfg_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lfg_join_requests_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lfg_messages: {
        Row: {
          id: string;
          post_id: string;
          sender_id: string | null;
          body: string;
          kind: "user" | "system";
          created_at: string;
        };
        Insert: {
          post_id: string;
          sender_id?: string | null;
          body: string;
          kind?: "user" | "system";
        };
        Update: {
          body?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lfg_messages_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "lfg_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lfg_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      commendations: {
        Row: {
          profile_id: string;
          commender_id: string;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          commender_id: string;
        };
        Update: {
          profile_id?: string;
          commender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "commendations_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commendations_commender_id_fkey";
            columns: ["commender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Game = Database["public"]["Tables"]["games"]["Row"];
export type LfgPost = Database["public"]["Tables"]["lfg_posts"]["Row"];
export type CoachProfile = Database["public"]["Tables"]["coach_profiles"]["Row"];
export type JoinRequest = Database["public"]["Tables"]["lfg_join_requests"]["Row"];
export type LfgMessage = Database["public"]["Tables"]["lfg_messages"]["Row"];

export type LfgPostWithRelations = LfgPost & {
  profiles: Pick<Profile, "username" | "region"> | null;
  games: Pick<Game, "name" | "slug"> | null;
};

export type JoinRequestWithRequester = JoinRequest & {
  profiles: Pick<Profile, "username" | "avatar_url"> | null;
};

export type LfgMessageWithSender = LfgMessage & {
  profiles: Pick<Profile, "username" | "avatar_url"> | null;
};

export type CoachProfileWithRelations = CoachProfile & {
  profiles: Pick<Profile, "username" | "region"> | null;
  games: Pick<Game, "name" | "slug"> | null;
};
