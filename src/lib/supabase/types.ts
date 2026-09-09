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
        };
        Update: {
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          region?: string | null;
          is_coach?: boolean;
          onboarded?: boolean;
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
          created_at: string;
        };
        Insert: {
          profile_id: string;
          game_id: string;
          headline: string;
          bio?: string | null;
          rate_note?: string | null;
          contact_method: string;
        };
        Update: {
          headline?: string;
          bio?: string | null;
          rate_note?: string | null;
          contact_method?: string;
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

export type LfgPostWithRelations = LfgPost & {
  profiles: Pick<Profile, "username" | "region"> | null;
  games: Pick<Game, "name" | "slug"> | null;
};

export type CoachProfileWithRelations = CoachProfile & {
  profiles: Pick<Profile, "username" | "region"> | null;
  games: Pick<Game, "name" | "slug"> | null;
};
