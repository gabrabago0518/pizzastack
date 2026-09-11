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
          dota_total_matches: number | null;
          dota_hours_played: number | null;
          cs2_premier_rating: number | null;
          cs2_competitive_rank: number | null;
          cs2_rank_synced_at: string | null;
          riot_name: string | null;
          riot_tag: string | null;
          riot_region: string | null;
          valorant_tier: string | null;
          valorant_tier_icon: string | null;
          valorant_rr: number | null;
          valorant_elo: number | null;
          valorant_rank_synced_at: string | null;
          is_admin: boolean;
          last_seen_at: string | null;
          show_ranks: boolean;
          show_most_played: boolean;
          show_games: boolean;
          show_listings: boolean;
          show_coaching: boolean;
          account_tier: "standard" | "prime";
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
          dota_total_matches?: number | null;
          dota_hours_played?: number | null;
          cs2_premier_rating?: number | null;
          cs2_competitive_rank?: number | null;
          cs2_rank_synced_at?: string | null;
          riot_name?: string | null;
          riot_tag?: string | null;
          riot_region?: string | null;
          valorant_tier?: string | null;
          valorant_tier_icon?: string | null;
          valorant_rr?: number | null;
          valorant_elo?: number | null;
          valorant_rank_synced_at?: string | null;
          is_admin?: boolean;
          last_seen_at?: string | null;
          show_ranks?: boolean;
          show_most_played?: boolean;
          show_games?: boolean;
          show_listings?: boolean;
          show_coaching?: boolean;
          account_tier?: "standard" | "prime";
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
          dota_total_matches?: number | null;
          dota_hours_played?: number | null;
          cs2_premier_rating?: number | null;
          cs2_competitive_rank?: number | null;
          cs2_rank_synced_at?: string | null;
          riot_name?: string | null;
          riot_tag?: string | null;
          riot_region?: string | null;
          valorant_tier?: string | null;
          valorant_tier_icon?: string | null;
          valorant_rr?: number | null;
          valorant_elo?: number | null;
          valorant_rank_synced_at?: string | null;
          is_admin?: boolean;
          last_seen_at?: string | null;
          show_ranks?: boolean;
          show_most_played?: boolean;
          show_games?: boolean;
          show_listings?: boolean;
          show_coaching?: boolean;
          account_tier?: "standard" | "prime";
        };
        Relationships: [];
      };
      games: {
        Row: {
          id: string;
          name: string;
          slug: string;
          cover_url: string | null;
        };
        Insert: {
          name: string;
          slug: string;
          cover_url?: string | null;
        };
        Update: {
          name?: string;
          slug?: string;
          cover_url?: string | null;
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
          request_count: number;
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
          status: "pending" | "approved" | "rejected";
          avg_rating: number | null;
          review_count: number;
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
          status?: "pending" | "approved" | "rejected";
        };
        Update: {
          headline?: string;
          bio?: string | null;
          rate_note?: string | null;
          contact_method?: string;
          rank?: string | null;
          rank_tier?: number | null;
          status?: "pending" | "approved" | "rejected";
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
      coach_reviews: {
        Row: {
          id: string;
          coach_profile_id: string;
          reviewer_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          coach_profile_id: string;
          reviewer_id: string;
          rating: number;
          comment?: string | null;
        };
        Update: {
          rating?: number;
          comment?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "coach_reviews_coach_profile_id_fkey";
            columns: ["coach_profile_id"];
            isOneToOne: false;
            referencedRelation: "coach_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coach_reviews_reviewer_id_fkey";
            columns: ["reviewer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
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
      notifications: {
        Row: {
          id: string;
          profile_id: string;
          type: string;
          title: string;
          body: string | null;
          link: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          type: string;
          title: string;
          body?: string | null;
          link?: string | null;
          read?: boolean;
        };
        Update: {
          read?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
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
      match_history: {
        Row: {
          id: string;
          profile_id: string;
          game_slug: string;
          external_match_id: string;
          played_at: string;
          won: boolean | null;
          character_name: string | null;
          character_icon_url: string | null;
          kills: number | null;
          deaths: number | null;
          assists: number | null;
          map_name: string | null;
          mode: string | null;
          duration_seconds: number | null;
          created_at: string;
        };
        Insert: {
          profile_id: string;
          game_slug: string;
          external_match_id: string;
          played_at: string;
          won?: boolean | null;
          character_name?: string | null;
          character_icon_url?: string | null;
          kills?: number | null;
          deaths?: number | null;
          assists?: number | null;
          map_name?: string | null;
          mode?: string | null;
          duration_seconds?: number | null;
        };
        Update: {
          won?: boolean | null;
          character_name?: string | null;
          character_icon_url?: string | null;
          kills?: number | null;
          deaths?: number | null;
          assists?: number | null;
          map_name?: string | null;
          mode?: string | null;
          duration_seconds?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "match_history_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      top_hero_stats: {
        Row: {
          id: string;
          profile_id: string;
          game_slug: string;
          character_name: string;
          character_icon_url: string | null;
          games_played: number;
          wins: number;
          synced_at: string;
        };
        Insert: {
          profile_id: string;
          game_slug: string;
          character_name: string;
          character_icon_url?: string | null;
          games_played: number;
          wins: number;
          synced_at?: string;
        };
        Update: {
          character_name?: string;
          character_icon_url?: string | null;
          games_played?: number;
          wins?: number;
          synced_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "top_hero_stats_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      guilds: {
        Row: {
          id: string;
          name: string;
          tag: string;
          description: string | null;
          game_id: string | null;
          region: string | null;
          owner_id: string;
          member_count: number;
          created_at: string;
        };
        Insert: {
          name: string;
          tag: string;
          description?: string | null;
          game_id?: string | null;
          region?: string | null;
          owner_id: string;
        };
        Update: {
          name?: string;
          tag?: string;
          description?: string | null;
          game_id?: string | null;
          region?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "guilds_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guilds_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      guild_members: {
        Row: {
          profile_id: string;
          guild_id: string;
          role: "leader" | "officer" | "member";
          joined_at: string;
        };
        Insert: {
          profile_id: string;
          guild_id: string;
          role?: "leader" | "officer" | "member";
        };
        Update: {
          role?: "leader" | "officer" | "member";
        };
        Relationships: [
          {
            foreignKeyName: "guild_members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guild_members_guild_id_fkey";
            columns: ["guild_id"];
            isOneToOne: false;
            referencedRelation: "guilds";
            referencedColumns: ["id"];
          },
        ];
      };
      guild_messages: {
        Row: {
          id: string;
          guild_id: string;
          sender_id: string | null;
          body: string;
          created_at: string;
        };
        Insert: {
          guild_id: string;
          sender_id?: string | null;
          body: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "guild_messages_guild_id_fkey";
            columns: ["guild_id"];
            isOneToOne: false;
            referencedRelation: "guilds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guild_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      guild_announcements: {
        Row: {
          id: string;
          guild_id: string;
          author_id: string | null;
          body: string;
          created_at: string;
        };
        Insert: {
          guild_id: string;
          author_id?: string | null;
          body: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "guild_announcements_guild_id_fkey";
            columns: ["guild_id"];
            isOneToOne: false;
            referencedRelation: "guilds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guild_announcements_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      guild_achievements: {
        Row: {
          id: string;
          guild_id: string;
          title: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          guild_id: string;
          title: string;
          description?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "guild_achievements_guild_id_fkey";
            columns: ["guild_id"];
            isOneToOne: false;
            referencedRelation: "guilds";
            referencedColumns: ["id"];
          },
        ];
      };
      player_reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_id: string;
          reason: string;
          details: string | null;
          status: "open" | "reviewed";
          created_at: string;
        };
        Insert: {
          reporter_id: string;
          reported_id: string;
          reason: string;
          details?: string | null;
        };
        Update: {
          status?: "open" | "reviewed";
        };
        Relationships: [
          {
            foreignKeyName: "player_reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_reports_reported_id_fkey";
            columns: ["reported_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      coaching_requests: {
        Row: {
          id: string;
          author_id: string;
          game_id: string;
          rank: string | null;
          region: string | null;
          description: string;
          status: "open" | "closed";
          created_at: string;
        };
        Insert: {
          author_id: string;
          game_id: string;
          rank?: string | null;
          region?: string | null;
          description: string;
          status?: "open" | "closed";
        };
        Update: {
          rank?: string | null;
          region?: string | null;
          description?: string;
          status?: "open" | "closed";
        };
        Relationships: [
          {
            foreignKeyName: "coaching_requests_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coaching_requests_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      tournaments: {
        Row: {
          id: string;
          name: string;
          game_id: string;
          organizer_id: string;
          description: string | null;
          region: string | null;
          team_size: number;
          max_teams: number | null;
          status: "open" | "in_progress" | "completed" | "cancelled";
          created_at: string;
        };
        Insert: {
          name: string;
          game_id: string;
          organizer_id: string;
          description?: string | null;
          region?: string | null;
          team_size?: number;
          max_teams?: number | null;
          status?: "open" | "in_progress" | "completed" | "cancelled";
        };
        Update: {
          name?: string;
          description?: string | null;
          region?: string | null;
          team_size?: number;
          max_teams?: number | null;
          status?: "open" | "in_progress" | "completed" | "cancelled";
        };
        Relationships: [
          {
            foreignKeyName: "tournaments_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournaments_organizer_id_fkey";
            columns: ["organizer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_teams: {
        Row: {
          id: string;
          tournament_id: string;
          name: string;
          captain_id: string;
          seed: number | null;
          created_at: string;
        };
        Insert: {
          tournament_id: string;
          name: string;
          captain_id: string;
          seed?: number | null;
        };
        Update: {
          name?: string;
          seed?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_teams_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_teams_captain_id_fkey";
            columns: ["captain_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_team_members: {
        Row: {
          id: string;
          team_id: string;
          tournament_id: string;
          profile_id: string;
          created_at: string;
        };
        Insert: {
          team_id: string;
          tournament_id: string;
          profile_id: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "tournament_team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "tournament_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_team_members_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_team_members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tournament_matches: {
        Row: {
          id: string;
          tournament_id: string;
          round: number;
          match_number: number;
          participant1_id: string | null;
          participant2_id: string | null;
          winner_id: string | null;
          score1: number | null;
          score2: number | null;
          status: "pending" | "ready" | "completed";
          next_match_id: string | null;
          next_match_slot: 1 | 2 | null;
          created_at: string;
        };
        Insert: {
          tournament_id: string;
          round: number;
          match_number: number;
          participant1_id?: string | null;
          participant2_id?: string | null;
          winner_id?: string | null;
          score1?: number | null;
          score2?: number | null;
          status?: "pending" | "ready" | "completed";
          next_match_id?: string | null;
          next_match_slot?: 1 | 2 | null;
        };
        Update: {
          participant1_id?: string | null;
          participant2_id?: string | null;
          winner_id?: string | null;
          score1?: number | null;
          score2?: number | null;
          status?: "pending" | "ready" | "completed";
        };
        Relationships: [
          {
            foreignKeyName: "tournament_matches_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_matches_participant1_id_fkey";
            columns: ["participant1_id"];
            isOneToOne: false;
            referencedRelation: "tournament_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_matches_participant2_id_fkey";
            columns: ["participant2_id"];
            isOneToOne: false;
            referencedRelation: "tournament_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_matches_winner_id_fkey";
            columns: ["winner_id"];
            isOneToOne: false;
            referencedRelation: "tournament_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_matches_next_match_id_fkey";
            columns: ["next_match_id"];
            isOneToOne: false;
            referencedRelation: "tournament_matches";
            referencedColumns: ["id"];
          },
        ];
      };
      scrimmages: {
        Row: {
          id: string;
          author_id: string;
          game_id: string;
          region: string | null;
          scheduled_at: string;
          description: string | null;
          status: "open" | "closed";
          created_at: string;
        };
        Insert: {
          author_id: string;
          game_id: string;
          region?: string | null;
          scheduled_at: string;
          description?: string | null;
          status?: "open" | "closed";
        };
        Update: {
          region?: string | null;
          scheduled_at?: string;
          description?: string | null;
          status?: "open" | "closed";
        };
        Relationships: [
          {
            foreignKeyName: "scrimmages_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scrimmages_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
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
export type TopHeroStat = Database["public"]["Tables"]["top_hero_stats"]["Row"];
export type CoachReview = Database["public"]["Tables"]["coach_reviews"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Guild = Database["public"]["Tables"]["guilds"]["Row"];
export type GuildMember = Database["public"]["Tables"]["guild_members"]["Row"];
export type GuildMessage = Database["public"]["Tables"]["guild_messages"]["Row"];
export type GuildAnnouncement = Database["public"]["Tables"]["guild_announcements"]["Row"];
export type GuildAchievement = Database["public"]["Tables"]["guild_achievements"]["Row"];
export type CoachingRequest = Database["public"]["Tables"]["coaching_requests"]["Row"];
export type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];
export type TournamentTeam = Database["public"]["Tables"]["tournament_teams"]["Row"];
export type TournamentTeamMember = Database["public"]["Tables"]["tournament_team_members"]["Row"];
export type TournamentMatch = Database["public"]["Tables"]["tournament_matches"]["Row"];
export type Scrimmage = Database["public"]["Tables"]["scrimmages"]["Row"];

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

export type CoachReviewWithReviewer = CoachReview & {
  profiles: Pick<Profile, "username" | "avatar_url"> | null;
};

export type GuildWithRelations = Guild & {
  games: Pick<Game, "name" | "slug"> | null;
};

export type GuildMemberWithProfile = GuildMember & {
  profiles: Pick<Profile, "username" | "avatar_url"> | null;
};

export type GuildMessageWithSender = GuildMessage & {
  profiles: Pick<Profile, "username" | "avatar_url"> | null;
};

export type GuildAnnouncementWithAuthor = GuildAnnouncement & {
  profiles: Pick<Profile, "username" | "avatar_url"> | null;
};

export type CoachingRequestWithRelations = CoachingRequest & {
  profiles: Pick<Profile, "username" | "region"> | null;
  games: Pick<Game, "name" | "slug"> | null;
};

export type TournamentWithRelations = Tournament & {
  profiles: Pick<Profile, "username" | "avatar_url"> | null;
  games: Pick<Game, "name" | "slug"> | null;
  tournament_teams: { count: number }[];
};

export type TournamentTeamWithRelations = TournamentTeam & {
  profiles: Pick<Profile, "username" | "avatar_url"> | null;
  tournament_team_members: { count: number }[];
};

export type TournamentTeamMemberWithProfile = TournamentTeamMember & {
  profiles: Pick<Profile, "username" | "avatar_url"> | null;
};

export type ScrimmageWithRelations = Scrimmage & {
  profiles: Pick<Profile, "username" | "region"> | null;
  games: Pick<Game, "name" | "slug"> | null;
};
