-- Pizzastack (gaming community hub) schema
-- Safe to re-run: every statement is idempotent.
-- Run in Supabase Dashboard -> SQL Editor -> New query -> Run.

-- ---------------------------------------------------------------------------
-- profiles: one row per user, created automatically on signup (see trigger).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  region text,
  is_coach boolean not null default false,
  created_at timestamptz not null default now()
);

-- onboarded: flips to true once a player has been through the post-signup
-- "what do you play?" step, so the dashboard only asks once.
alter table public.profiles
  add column if not exists onboarded boolean not null default false;

alter table public.profiles enable row level security;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Steam / verified game rank. steam_id is only ever set after a verified
-- Steam OpenID login, and the per-game rank columns only after a
-- server-side fetch (Dota 2 via OpenDota, CS2 via Leetify — see
-- src/lib/steam.ts, src/lib/leetify.ts, and the /api/auth/steam/* and
-- /api/steam/refresh-rank routes) — never directly by the user. Column
-- grants below enforce that: the "authenticated" role (the user's own
-- session) can only write the columns the app already lets them
-- self-report; only the service-role key (bypasses RLS/grants entirely)
-- can write steam_id or any rank column.
alter table public.profiles
  add column if not exists steam_id text unique;
alter table public.profiles
  add column if not exists dota_rank_tier smallint;
alter table public.profiles
  add column if not exists dota_leaderboard_rank integer;
alter table public.profiles
  add column if not exists dota_rank_synced_at timestamptz;

-- cs2_premier_rating: Valve's real numeric CS Rating (Leetify's ranks.premier,
-- parsed from actual match data, not a third-party score). cs2_competitive_rank:
-- the classic 1-18 Silver/Gold Nova/.../Global Elite skill group, used as a
-- fallback when a player has no Premier rating (Leetify's ranks.competitive,
-- highest across maps).
alter table public.profiles
  add column if not exists cs2_premier_rating integer;
alter table public.profiles
  add column if not exists cs2_competitive_rank smallint;
alter table public.profiles
  add column if not exists cs2_rank_synced_at timestamptz;

-- Valorant is different from Dota/CS2: there's no Steam-style verified
-- login (that needs Riot Sign-On OAuth, not set up), so riot_name/riot_tag/
-- riot_region are self-entered by the player, same trust level as
-- display_name/bio — hence they're in the authenticated grant below. The
-- fetched valorant_* rank columns are still service-role-only like every
-- other rank column: the *value* can't be tampered with once a Riot ID is
-- entered, even though the *identity* behind that Riot ID isn't verified.
alter table public.profiles
  add column if not exists riot_name text;
alter table public.profiles
  add column if not exists riot_tag text;
alter table public.profiles
  add column if not exists riot_region text;
alter table public.profiles
  add column if not exists valorant_tier text;
alter table public.profiles
  add column if not exists valorant_tier_icon text;
alter table public.profiles
  add column if not exists valorant_rr smallint;
alter table public.profiles
  add column if not exists valorant_elo integer;
alter table public.profiles
  add column if not exists valorant_rank_synced_at timestamptz;

-- is_admin: grants access to /admin — service-role-only (see the grant
-- below), so it can't be self-promoted by editing a profile like the
-- self-reported fields can. Set directly via SQL, not through the app.
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- last_seen_at: bumped by a lightweight heartbeat (see
-- /api/presence/heartbeat) while a signed-in user has the site open, so
-- the admin dashboard can show an approximate "online now" count
-- (last_seen_at within the last few minutes) without the cost of a real
-- WebSocket presence channel. Low-stakes if a user pings their own
-- timestamp directly, so it's fine in the authenticated grant.
alter table public.profiles
  add column if not exists last_seen_at timestamptz;

revoke update on public.profiles from authenticated;
grant update (
  username, display_name, avatar_url, bio, region, onboarded, is_coach,
  riot_name, riot_tag, riot_region, last_seen_at
) on public.profiles to authenticated;

-- One-time grant for the account requested as the site's first admin.
-- Safe to re-run; no-ops if the username doesn't exist (yet).
update public.profiles set is_admin = true where username = 'kydothecreator_6a67';

-- Auto-create a profile row whenever someone signs up via Supabase Auth.
-- Games are picked afterward on the onboarding step (see profile_games and
-- the onboarded column above), not at signup time.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)) || '_' || substr(new.id::text, 1, 4),
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- games: lookup table, seeded below. Read-only from the client.
-- ---------------------------------------------------------------------------
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  cover_url text
);

alter table public.games add column if not exists cover_url text;

alter table public.games enable row level security;

drop policy if exists "Games are publicly readable" on public.games;
create policy "Games are publicly readable"
  on public.games for select
  using (true);

insert into public.games (name, slug) values
  ('Valorant', 'valorant'),
  ('League of Legends', 'league-of-legends'),
  ('Counter-Strike 2', 'cs2'),
  ('Overwatch 2', 'overwatch-2'),
  ('Apex Legends', 'apex-legends'),
  ('Rocket League', 'rocket-league'),
  ('Fortnite', 'fortnite'),
  ('Dota 2', 'dota-2')
on conflict (slug) do nothing;

-- Poster art for the game-picker card grid on /teammates. Sourced from
-- Steam's own CDN (stable, widely hotlinked — see library_600x900.jpg
-- usage across other open-source Steam-library tools) for the four games
-- that are actually on Steam; the rest fall back to a plain gradient card
-- in GamePosterCard since there's no equivalently reliable public CDN
-- asset for them yet. An explicit update (not just the insert above)
-- since this column is new and the insert no-ops for rows that already
-- exist from a prior deploy.
update public.games set cover_url = 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/library_600x900.jpg' where slug = 'cs2';
update public.games set cover_url = 'https://cdn.cloudflare.steamstatic.com/steam/apps/570/library_600x900.jpg' where slug = 'dota-2';
update public.games set cover_url = 'https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/library_600x900.jpg' where slug = 'apex-legends';
update public.games set cover_url = 'https://cdn.cloudflare.steamstatic.com/steam/apps/252950/library_600x900.jpg' where slug = 'rocket-league';

-- ---------------------------------------------------------------------------
-- lfg_posts: "looking for group / teammates" board.
-- ---------------------------------------------------------------------------
create table if not exists public.lfg_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  game_id uuid not null references public.games (id),
  title text not null,
  description text,
  rank text,
  region text,
  roles_needed text[],
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

-- players_needed: added after the initial table. The default backfills any
-- rows created before this field existed; the app always sends an explicit
-- value going forward.
alter table public.lfg_posts
  add column if not exists players_needed smallint not null default 1;

alter table public.lfg_posts
  drop constraint if exists lfg_posts_players_needed_check;
alter table public.lfg_posts
  add constraint lfg_posts_players_needed_check check (players_needed between 1 and 4);

-- mode: game mode the listing is for (Unranked, Ranked, Turbo for Dota 2,
-- etc. — see src/lib/modes.ts). Options depend on the selected game.
alter table public.lfg_posts
  add column if not exists mode text;

-- Backfill: accounts predating the one-active-listing rule may already have
-- more than one open post. Keep only the most recent one open so the unique
-- index below can actually be created.
update public.lfg_posts p
set status = 'closed'
where p.status = 'open'
  and p.id <> (
    select p2.id from public.lfg_posts p2
    where p2.author_id = p.author_id and p2.status = 'open'
    order by p2.created_at desc
    limit 1
  );

-- A player can only have one open listing at a time — close it before
-- posting another. Partial unique index only constrains 'open' rows.
create unique index if not exists lfg_posts_one_open_per_author
  on public.lfg_posts (author_id)
  where status = 'open';

alter table public.lfg_posts enable row level security;

drop policy if exists "LFG posts are publicly readable" on public.lfg_posts;
create policy "LFG posts are publicly readable"
  on public.lfg_posts for select
  using (true);

drop policy if exists "Users can create their own LFG posts" on public.lfg_posts;
create policy "Users can create their own LFG posts"
  on public.lfg_posts for insert
  with check (auth.uid() = author_id);

drop policy if exists "Users can update their own LFG posts" on public.lfg_posts;
create policy "Users can update their own LFG posts"
  on public.lfg_posts for update
  using (auth.uid() = author_id);

drop policy if exists "Users can delete their own LFG posts" on public.lfg_posts;
create policy "Users can delete their own LFG posts"
  on public.lfg_posts for delete
  using (auth.uid() = author_id);

-- ---------------------------------------------------------------------------
-- lfg_join_requests: a player requesting to join someone else's listing.
-- The post's author decides to accept or decline.
-- ---------------------------------------------------------------------------
create table if not exists public.lfg_join_requests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.lfg_posts (id) on delete cascade,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (post_id, requester_id)
);

-- 'removed' (owner kicked an accepted player) and 'left' (player left on
-- their own) added after the initial three statuses.
alter table public.lfg_join_requests drop constraint if exists lfg_join_requests_status_check;
alter table public.lfg_join_requests
  add constraint lfg_join_requests_status_check
  check (status in ('pending', 'accepted', 'declined', 'removed', 'left'));

alter table public.lfg_join_requests enable row level security;

drop policy if exists "Requesters and post owners can view join requests" on public.lfg_join_requests;
create policy "Requesters and post owners can view join requests"
  on public.lfg_join_requests for select
  using (
    auth.uid() = requester_id
    or auth.uid() = (select author_id from public.lfg_posts where id = post_id)
  );

drop policy if exists "Users can request to join a listing" on public.lfg_join_requests;
create policy "Users can request to join a listing"
  on public.lfg_join_requests for insert
  with check (
    auth.uid() = requester_id
    and auth.uid() <> (select author_id from public.lfg_posts where id = post_id)
  );

drop policy if exists "Post owners can respond to join requests" on public.lfg_join_requests;
drop policy if exists "Owners and requesters can update join requests" on public.lfg_join_requests;
create policy "Owners and requesters can update join requests"
  on public.lfg_join_requests for update
  using (
    auth.uid() = (select author_id from public.lfg_posts where id = post_id)
    or auth.uid() = requester_id
  );

drop policy if exists "Requesters can cancel their own pending request" on public.lfg_join_requests;
create policy "Requesters can cancel their own pending request"
  on public.lfg_join_requests for delete
  using (auth.uid() = requester_id);

-- Caps accepted party members at the listing's players_needed — e.g. a
-- listing that needs 1 more player can only ever have 1 accepted request,
-- so it can't be over-filled by racing accepts or a stale UI. Locks the
-- post row first (select ... for update) so two concurrent accepts on the
-- same listing serialize instead of both reading the same pre-accept
-- count and both succeeding.
create or replace function public.enforce_lfg_party_capacity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  needed integer;
  accepted_count integer;
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    select players_needed into needed
      from public.lfg_posts where id = new.post_id for update;

    select count(*) into accepted_count
      from public.lfg_join_requests
      where post_id = new.post_id and status = 'accepted' and id <> new.id;

    if accepted_count >= needed then
      raise exception 'This listing is already full.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists lfg_join_requests_capacity on public.lfg_join_requests;
create trigger lfg_join_requests_capacity
  before update on public.lfg_join_requests
  for each row execute function public.enforce_lfg_party_capacity();

-- ---------------------------------------------------------------------------
-- lfg_messages: one shared chat per listing, unlocked for the post's owner
-- and any player whose join request was accepted.
-- ---------------------------------------------------------------------------
create table if not exists public.lfg_messages (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.lfg_posts (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- sender_id/kind: system messages (e.g. "@username entered the party" when a
-- join request is accepted) have no sender and aren't authored live by the
-- signed-in user, so sender_id had to become nullable.
alter table public.lfg_messages alter column sender_id drop not null;
alter table public.lfg_messages
  add column if not exists kind text not null default 'user';
alter table public.lfg_messages
  drop constraint if exists lfg_messages_kind_check;
alter table public.lfg_messages
  add constraint lfg_messages_kind_check check (kind in ('user', 'system'));

alter table public.lfg_messages enable row level security;

drop policy if exists "Owner and accepted players can read listing chat" on public.lfg_messages;
create policy "Owner and accepted players can read listing chat"
  on public.lfg_messages for select
  using (
    auth.uid() = (select author_id from public.lfg_posts where id = post_id)
    or exists (
      select 1 from public.lfg_join_requests
      where lfg_join_requests.post_id = lfg_messages.post_id
        and lfg_join_requests.requester_id = auth.uid()
        and lfg_join_requests.status = 'accepted'
    )
  );

drop policy if exists "Owner and accepted players can send listing chat" on public.lfg_messages;
create policy "Owner and accepted players can send listing chat"
  on public.lfg_messages for insert
  with check (
    (
      kind = 'user'
      and sender_id = auth.uid()
      and (
        auth.uid() = (select author_id from public.lfg_posts where id = post_id)
        or exists (
          select 1 from public.lfg_join_requests
          where lfg_join_requests.post_id = lfg_messages.post_id
            and lfg_join_requests.requester_id = auth.uid()
            and lfg_join_requests.status = 'accepted'
        )
      )
    )
    or (
      -- The post owner posts the "@username entered the party" system
      -- message when accepting a request — not authored by a live sender.
      kind = 'system'
      and sender_id is null
      and auth.uid() = (select author_id from public.lfg_posts where id = post_id)
    )
  );

-- ---------------------------------------------------------------------------
-- coach_profiles: one row per (coach, game) they offer coaching for.
-- ---------------------------------------------------------------------------
create table if not exists public.coach_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  game_id uuid not null references public.games (id),
  headline text not null,
  bio text,
  rate_note text,
  contact_method text not null,
  created_at timestamptz not null default now(),
  unique (profile_id, game_id)
);

-- rank/rank_tier: a snapshot of the coach's verified rank at signup time,
-- for games with a data source (currently just Dota 2, via
-- profiles.dota_rank_tier/dota_rank_tier). rank is the display label,
-- rank_tier the raw numeric medal used to pick the right rank icon. Both
-- set by the server from verified profile data, never from the form.
alter table public.coach_profiles
  add column if not exists rank text;
alter table public.coach_profiles
  add column if not exists rank_tier smallint;

alter table public.coach_profiles enable row level security;

drop policy if exists "Coach profiles are publicly readable" on public.coach_profiles;
create policy "Coach profiles are publicly readable"
  on public.coach_profiles for select
  using (true);

drop policy if exists "Users can create their own coach profiles" on public.coach_profiles;
create policy "Users can create their own coach profiles"
  on public.coach_profiles for insert
  with check (auth.uid() = profile_id);

drop policy if exists "Users can update their own coach profiles" on public.coach_profiles;
create policy "Users can update their own coach profiles"
  on public.coach_profiles for update
  using (auth.uid() = profile_id);

drop policy if exists "Users can delete their own coach profiles" on public.coach_profiles;
create policy "Users can delete their own coach profiles"
  on public.coach_profiles for delete
  using (auth.uid() = profile_id);

-- ---------------------------------------------------------------------------
-- Storage: avatars bucket. Files are stored at "{user_id}/avatar.<ext>" so
-- ownership can be checked from the path alone.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- profile_games: which games a player has added to their profile.
-- ---------------------------------------------------------------------------
create table if not exists public.profile_games (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, game_id)
);

alter table public.profile_games enable row level security;

drop policy if exists "Profile games are publicly readable" on public.profile_games;
create policy "Profile games are publicly readable"
  on public.profile_games for select
  using (true);

drop policy if exists "Users can add their own profile games" on public.profile_games;
create policy "Users can add their own profile games"
  on public.profile_games for insert
  with check (auth.uid() = profile_id);

drop policy if exists "Users can remove their own profile games" on public.profile_games;
create policy "Users can remove their own profile games"
  on public.profile_games for delete
  using (auth.uid() = profile_id);

-- ---------------------------------------------------------------------------
-- commendations: players can commend another player's profile once.
-- ---------------------------------------------------------------------------
create table if not exists public.commendations (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  commender_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, commender_id),
  constraint commendations_no_self_commend check (profile_id <> commender_id)
);

alter table public.commendations enable row level security;

drop policy if exists "Commendations are publicly readable" on public.commendations;
create policy "Commendations are publicly readable"
  on public.commendations for select
  using (true);

drop policy if exists "Users can commend other players" on public.commendations;
create policy "Users can commend other players"
  on public.commendations for insert
  with check (auth.uid() = commender_id);

drop policy if exists "Users can remove their own commend" on public.commendations;
create policy "Users can remove their own commend"
  on public.commendations for delete
  using (auth.uid() = commender_id);

-- ---------------------------------------------------------------------------
-- match_history: recent verified matches (Dota 2 via OpenDota, Valorant via
-- HenrikDev), synced alongside the rank data those same providers already
-- supply — see rank-sync.ts. Service-role-only for writes (no insert/update
-- policy for authenticated/anon at all — unlike the rank columns on
-- profiles, there's no self-reported equivalent to grant here), same trust
-- boundary as the verified rank columns.
-- ---------------------------------------------------------------------------
create table if not exists public.match_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  game_slug text not null,
  external_match_id text not null,
  played_at timestamptz not null,
  won boolean,
  character_name text,
  character_icon_url text,
  kills smallint,
  deaths smallint,
  assists smallint,
  map_name text,
  mode text,
  duration_seconds integer,
  created_at timestamptz not null default now(),
  unique (profile_id, game_slug, external_match_id)
);

alter table public.match_history enable row level security;

drop policy if exists "Match history is publicly readable" on public.match_history;
create policy "Match history is publicly readable"
  on public.match_history for select
  using (true);

-- Backfill: the onboarding "what do you play?" step only exists to collect
-- profile_games from players who don't have any yet. Accounts that already
-- picked games (via the old signup-time picker) shouldn't be asked again.
update public.profiles p
set onboarded = true
where p.onboarded = false
  and exists (
    select 1 from public.profile_games pg where pg.profile_id = p.id
  );
