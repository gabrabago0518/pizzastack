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
-- Career totals from OpenDota's /wl and /totals endpoints (all matches it
-- has parsed for the account, not just recent ones) — synced alongside
-- dota_rank_tier above, shown next to the rank card rather than gated
-- behind show_ranks' verified-rank meaning.
alter table public.profiles
  add column if not exists dota_total_matches integer;
alter table public.profiles
  add column if not exists dota_hours_played integer;

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

-- show_*: what a player has chosen to display on their PUBLIC profile
-- (/players/[username]) — plain self-editable preferences, same trust
-- level as bio/display_name, since they only ever hide a section from
-- other viewers rather than touch any verified data. The owner's own
-- /profile dashboard always shows everything regardless of these.
alter table public.profiles
  add column if not exists show_ranks boolean not null default true;
alter table public.profiles
  add column if not exists show_most_played boolean not null default true;
alter table public.profiles
  add column if not exists show_games boolean not null default true;
alter table public.profiles
  add column if not exists show_listings boolean not null default true;
alter table public.profiles
  add column if not exists show_coaching boolean not null default true;

-- is_premium: superseded by account_tier below (kept, unused, rather than
-- dropped — it already carries a live value on the comped account, same
-- precedent as tournaments.max_participants elsewhere in this file: no
-- destructive renames on a column that might already have a value in a
-- live row).
alter table public.profiles
  add column if not exists is_premium boolean not null default false;

-- account_tier: 'standard' (default) or 'prime'. Replaces the is_premium
-- boolean with an explicit two-value account classification — unlocks the
-- paid profile-customization dialog (editing which show_* sections appear
-- — see EditProfileDialog), with more Prime-only perks planned. Service-
-- role-only like is_admin: this will eventually be flipped by a Stripe
-- subscription webhook, never set by the user directly, so it's
-- deliberately left out of the authenticated grant below.
alter table public.profiles
  add column if not exists account_tier text not null default 'standard';
alter table public.profiles
  drop constraint if exists profiles_account_tier_check;
alter table public.profiles
  add constraint profiles_account_tier_check check (account_tier in ('standard', 'prime'));

-- profile_background: one of the presets in src/lib/profile-backgrounds.ts,
-- or null for none — a Prime perk (see /prime), but soft-gated the same
-- way as the show_* columns above rather than enforced by the database:
-- setProfileBackground checks account_tier itself before writing, but the
-- column stays a plain self-editable field like bio/region rather than
-- being pulled into service-role-only territory like is_coach/account_tier
-- — getting this wrong only lets someone pick a free background, not
-- anything that misrepresents a verified fact about them.
alter table public.profiles
  add column if not exists profile_background text;
alter table public.profiles
  drop constraint if exists profiles_profile_background_check;
alter table public.profiles
  add constraint profiles_profile_background_check
  check (profile_background is null or profile_background in ('sunset', 'aurora', 'midnight', 'ember', 'violet'));

-- is_coach is deliberately left out of this grant — it's now flipped only
-- by an admin approving a coach_profiles application (see admin/actions.ts
-- and coach_profiles.status below), not by the applicant's own session,
-- same trust level as is_admin/account_tier.
revoke update on public.profiles from authenticated;
grant update (
  username, display_name, avatar_url, bio, region, onboarded,
  riot_name, riot_tag, riot_region, last_seen_at,
  show_ranks, show_most_played, show_games, show_listings, show_coaching,
  profile_background
) on public.profiles to authenticated;

-- One-time grant for the account requested as the site's first admin.
-- Safe to re-run; no-ops if the username doesn't exist (yet).
update public.profiles set is_admin = true where username = 'kydothecreator_6a67';

-- Comps the site owner a Prime account so they can test/demo profile
-- customization before Stripe billing is wired up. Safe to re-run.
update public.profiles set is_premium = true where username = 'kydothecreator_6a67';

-- Migrates any account previously comped via the old is_premium flag (the
-- site owner above included) over to the new account_tier classification.
-- Safe to re-run.
update public.profiles set account_tier = 'prime' where is_premium = true;

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
  ('Dota 2', 'dota-2'),
  ('Mobile Legends: Bang Bang', 'mobile-legends')
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

-- request_count: total join requests ever received (any status), kept in
-- sync by the trigger below — a simple "how much interest has this
-- listing gotten" signal for sorting by "Most requested" on /teammates,
-- same denormalized-aggregate approach as coach_profiles.avg_rating.
alter table public.lfg_posts
  add column if not exists request_count integer not null default 0;

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
-- notifications: a per-player feed of things that happened to them
-- elsewhere on the site (a join request accepted, a new request on their
-- listing, a commend, a coach review). Populated entirely by triggers on
-- the source tables (see below and further down this file) rather than
-- written by the app directly, so every code path that causes one of
-- these events — present or future — notifies for free without having to
-- remember to add it. No insert/update grant for authenticated: only the
-- security-definer trigger functions write rows; a player can only read,
-- mark read, or delete their own.
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_profile_id_created_at_idx
  on public.notifications (profile_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users can read their own notifications" on public.notifications;
create policy "Users can read their own notifications"
  on public.notifications for select
  using (auth.uid() = profile_id);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = profile_id);

drop policy if exists "Users can delete their own notifications" on public.notifications;
create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = profile_id);

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

-- Notifies a listing's owner when someone requests to join it.
create or replace function public.notify_new_join_request()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  post_title text;
  post_author uuid;
  requester_name text;
begin
  select title, author_id into post_title, post_author
    from public.lfg_posts where id = new.post_id;
  if post_author is null or post_author = new.requester_id then
    return new;
  end if;

  select username into requester_name from public.profiles where id = new.requester_id;
  insert into public.notifications (profile_id, type, title, body, link)
  values (
    post_author,
    'join_request_received',
    'New join request',
    coalesce('@' || requester_name, 'Someone') || ' wants to join "' || post_title || '"',
    '/teammates/' || new.post_id
  );
  return new;
end;
$$;

drop trigger if exists lfg_join_requests_notify_new on public.lfg_join_requests;
create trigger lfg_join_requests_notify_new
  after insert on public.lfg_join_requests
  for each row execute function public.notify_new_join_request();

-- Notifies the requester once their request is accepted or declined.
create or replace function public.notify_join_request_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  post_title text;
begin
  if new.status = old.status or new.status not in ('accepted', 'declined') then
    return new;
  end if;

  select title into post_title from public.lfg_posts where id = new.post_id;
  insert into public.notifications (profile_id, type, title, body, link)
  values (
    new.requester_id,
    'join_request_' || new.status,
    case when new.status = 'accepted' then 'Request accepted' else 'Request declined' end,
    'Your request to join "' || post_title || '" was ' || new.status,
    '/teammates/' || new.post_id
  );
  return new;
end;
$$;

drop trigger if exists lfg_join_requests_notify_status on public.lfg_join_requests;
create trigger lfg_join_requests_notify_status
  after update on public.lfg_join_requests
  for each row execute function public.notify_join_request_status_change();

create or replace function public.recalculate_lfg_request_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  target_post_id uuid := coalesce(new.post_id, old.post_id);
begin
  update public.lfg_posts
  set request_count = (
    select count(*) from public.lfg_join_requests where post_id = target_post_id
  )
  where id = target_post_id;
  return null;
end;
$$;

drop trigger if exists lfg_join_requests_recalculate_count on public.lfg_join_requests;
create trigger lfg_join_requests_recalculate_count
  after insert or delete on public.lfg_join_requests
  for each row execute function public.recalculate_lfg_request_count();

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

-- status: a coach application is reviewed by an admin before it's publicly
-- listed — 'pending' until approved or rejected (see the "Coach
-- applications" section of /admin and admin/actions.ts, which use the
-- service-role client to flip this, bypassing the column grant below).
-- Existing coach listings — live before this review flow shipped — are
-- grandfathered straight to 'approved' by the backfill below, anchored to
-- a fixed cutoff rather than a blanket "pending -> approved" so it can
-- never auto-approve a genuinely new application on a later deploy.
alter table public.coach_profiles
  add column if not exists status text not null default 'pending';
alter table public.coach_profiles
  drop constraint if exists coach_profiles_status_check;
alter table public.coach_profiles
  add constraint coach_profiles_status_check check (status in ('pending', 'approved', 'rejected'));
update public.coach_profiles
  set status = 'approved'
  where status = 'pending' and created_at < '2026-09-11T00:00:00Z';

alter table public.coach_profiles enable row level security;

drop policy if exists "Coach profiles are publicly readable" on public.coach_profiles;
create policy "Coach profiles are publicly readable"
  on public.coach_profiles for select
  using (
    status = 'approved'
    or auth.uid() = profile_id
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "Users can create their own coach profiles" on public.coach_profiles;
create policy "Users can create their own coach profiles"
  on public.coach_profiles for insert
  with check (auth.uid() = profile_id);

drop policy if exists "Users can update their own coach profiles" on public.coach_profiles;
create policy "Users can update their own coach profiles"
  on public.coach_profiles for update
  using (auth.uid() = profile_id);

-- status (and rank/rank_tier, already server-set-only per the comment
-- above) are left out of this grant so a coach can't self-approve their
-- own application, or anyone else's, via a direct table update — only the
-- listing content itself is self-editable. Reviewing an application goes
-- through the service-role client instead (see admin/actions.ts).
revoke update on public.coach_profiles from authenticated;
grant update (headline, bio, rate_note, contact_method) on public.coach_profiles to authenticated;

drop policy if exists "Users can delete their own coach profiles" on public.coach_profiles;
create policy "Users can delete their own coach profiles"
  on public.coach_profiles for delete
  using (auth.uid() = profile_id);

-- avg_rating/review_count: denormalized aggregates over coach_reviews,
-- maintained by the trigger below — lets the coach directory list show a
-- rating on every card from one plain select on coach_profiles, instead of
-- aggregating coach_reviews client-side (Supabase's query builder has no
-- GROUP BY) or firing one review-count query per coach card.
alter table public.coach_profiles
  add column if not exists avg_rating numeric;
alter table public.coach_profiles
  add column if not exists review_count integer not null default 0;

-- ---------------------------------------------------------------------------
-- coach_reviews: a star rating (+ optional written comment) a player leaves
-- on a coach's listing. Same openness model as commendations — anyone
-- signed in can review, since there's no booking system to verify someone
-- was actually coached (see coach_profiles.contact_method: it's a direct-
-- contact model, not a booking flow). One review per (coach, reviewer);
-- resubmitting updates it rather than stacking duplicates.
-- ---------------------------------------------------------------------------
create table if not exists public.coach_reviews (
  id uuid primary key default gen_random_uuid(),
  coach_profile_id uuid not null references public.coach_profiles (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (coach_profile_id, reviewer_id)
);

alter table public.coach_reviews enable row level security;

drop policy if exists "Coach reviews are publicly readable" on public.coach_reviews;
create policy "Coach reviews are publicly readable"
  on public.coach_reviews for select
  using (true);

drop policy if exists "Users can leave coach reviews" on public.coach_reviews;
create policy "Users can leave coach reviews"
  on public.coach_reviews for insert
  with check (auth.uid() = reviewer_id);

drop policy if exists "Users can update their own coach review" on public.coach_reviews;
create policy "Users can update their own coach review"
  on public.coach_reviews for update
  using (auth.uid() = reviewer_id);

drop policy if exists "Users can delete their own coach review" on public.coach_reviews;
create policy "Users can delete their own coach review"
  on public.coach_reviews for delete
  using (auth.uid() = reviewer_id);

-- Recomputes the coach_profiles aggregate whenever a review is added,
-- edited, or removed. security definer so it can write avg_rating/
-- review_count without those columns needing to be in the authenticated
-- column grant (there isn't one on coach_profiles — every column is
-- either owner-editable via the update policy above or, like these two,
-- system-maintained only).
create or replace function public.recalculate_coach_rating()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  target_coach_id uuid := coalesce(new.coach_profile_id, old.coach_profile_id);
begin
  update public.coach_profiles
  set
    avg_rating = (select avg(rating) from public.coach_reviews where coach_profile_id = target_coach_id),
    review_count = (select count(*) from public.coach_reviews where coach_profile_id = target_coach_id)
  where id = target_coach_id;
  return null;
end;
$$;

drop trigger if exists coach_reviews_recalculate on public.coach_reviews;
create trigger coach_reviews_recalculate
  after insert or update or delete on public.coach_reviews
  for each row execute function public.recalculate_coach_rating();

-- Notifies a coach when they get a new review. Only on insert, not on
-- edits — a resubmitted review shouldn't re-notify for a minor edit.
create or replace function public.notify_coach_review_received()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  coach_owner uuid;
  coach_headline text;
  reviewer_name text;
begin
  select profile_id, headline into coach_owner, coach_headline
    from public.coach_profiles where id = new.coach_profile_id;
  if coach_owner is null then
    return new;
  end if;

  select username into reviewer_name from public.profiles where id = new.reviewer_id;
  insert into public.notifications (profile_id, type, title, body, link)
  values (
    coach_owner,
    'coach_review_received',
    'New review',
    coalesce('@' || reviewer_name, 'Someone') || ' left a ' || new.rating ||
      '-star review on "' || coach_headline || '"',
    '/coaches/' || new.coach_profile_id
  );
  return new;
end;
$$;

drop trigger if exists coach_reviews_notify on public.coach_reviews;
create trigger coach_reviews_notify
  after insert on public.coach_reviews
  for each row execute function public.notify_coach_review_received();

-- ---------------------------------------------------------------------------
-- coaching_requests: the reverse of coach_profiles — a player posting what
-- they're looking for in a coach (game, rank, region, and why) instead of a
-- coach listing themselves. Same direct-contact model as the rest of
-- /coaches: browsable, no booking/request flow — an interested coach reaches
-- out via the poster's public profile.
-- ---------------------------------------------------------------------------
create table if not exists public.coaching_requests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  game_id uuid not null references public.games (id),
  rank text,
  region text,
  description text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

-- One open "looking for a coach" post per player at a time, same rule as
-- lfg_posts_one_open_per_author.
create unique index if not exists coaching_requests_one_open_per_author
  on public.coaching_requests (author_id)
  where status = 'open';

alter table public.coaching_requests enable row level security;

drop policy if exists "Coaching requests are publicly readable" on public.coaching_requests;
create policy "Coaching requests are publicly readable"
  on public.coaching_requests for select
  using (true);

drop policy if exists "Users can create their own coaching requests" on public.coaching_requests;
create policy "Users can create their own coaching requests"
  on public.coaching_requests for insert
  with check (auth.uid() = author_id);

drop policy if exists "Users can update their own coaching requests" on public.coaching_requests;
create policy "Users can update their own coaching requests"
  on public.coaching_requests for update
  using (auth.uid() = author_id);

drop policy if exists "Users can delete their own coaching requests" on public.coaching_requests;
create policy "Users can delete their own coaching requests"
  on public.coaching_requests for delete
  using (auth.uid() = author_id);

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

-- Notifies a player when someone commends their profile.
create or replace function public.notify_commend_received()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  commender_name text;
begin
  select username into commender_name from public.profiles where id = new.commender_id;
  insert into public.notifications (profile_id, type, title, body, link)
  select
    new.profile_id,
    'commend_received',
    'New commend',
    coalesce('@' || commender_name, 'Someone') || ' commended you',
    '/players/' || p.username
  from public.profiles p where p.id = new.profile_id;
  return new;
end;
$$;

drop trigger if exists commendations_notify on public.commendations;
create trigger commendations_notify
  after insert on public.commendations
  for each row execute function public.notify_commend_received();

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

-- ---------------------------------------------------------------------------
-- top_hero_stats: the single most-played hero/agent per game for a profile,
-- with all-time games/win counts. For Dota 2 this is synced from OpenDota's
-- own all-time per-hero aggregation (/players/{id}/heroes) rather than
-- derived from match_history, since match_history only ever holds a
-- player's most recent handful of games and produced inaccurate "most
-- played" results for accounts with a long match history. Valorant still
-- derives it from recently synced matches (HenrikDev has no all-time
-- per-agent endpoint). Same service-role-only write trust boundary as
-- match_history — see rank-sync.ts.
-- ---------------------------------------------------------------------------
create table if not exists public.top_hero_stats (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  game_slug text not null,
  character_name text not null,
  character_icon_url text,
  games_played integer not null,
  wins integer not null,
  synced_at timestamptz not null default now(),
  unique (profile_id, game_slug)
);

alter table public.top_hero_stats enable row level security;

drop policy if exists "Top hero stats are publicly readable" on public.top_hero_stats;
create policy "Top hero stats are publicly readable"
  on public.top_hero_stats for select
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

-- ---------------------------------------------------------------------------
-- guilds: a persistent community a player can create and others can join —
-- distinct from a one-off LFG listing. Open-join by default (no invite/
-- request system for now, matching the site's "no gatekeeping" bent
-- elsewhere — see coach_profiles' "no booking system" comment): anyone can
-- join instantly and leave any time, except the leader, who deletes the
-- guild instead of leaving it, to avoid an ownerless-guild edge case.
-- game_id is nullable — a guild can be general-purpose or tied to one game.
-- ---------------------------------------------------------------------------
create table if not exists public.guilds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tag text not null,
  description text,
  game_id uuid references public.games (id),
  region text,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  member_count integer not null default 1,
  created_at timestamptz not null default now(),
  unique (name),
  unique (tag)
);

alter table public.guilds enable row level security;

drop policy if exists "Guilds are publicly readable" on public.guilds;
create policy "Guilds are publicly readable"
  on public.guilds for select
  using (true);

drop policy if exists "Users can create a guild" on public.guilds;
create policy "Users can create a guild"
  on public.guilds for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Guild owners can update their guild" on public.guilds;
create policy "Guild owners can update their guild"
  on public.guilds for update
  using (auth.uid() = owner_id);

drop policy if exists "Guild owners can delete their guild" on public.guilds;
create policy "Guild owners can delete their guild"
  on public.guilds for delete
  using (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- guild_members: profile_id is the primary key, not (guild_id, profile_id)
-- — a player can only be in one guild at a time (mirrors lfg_posts'
-- one-open-listing-per-author constraint), so this is naturally at most
-- one row per player rather than a many-to-many join table.
-- ---------------------------------------------------------------------------
create table if not exists public.guild_members (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  guild_id uuid not null references public.guilds (id) on delete cascade,
  role text not null default 'member' check (role in ('leader', 'officer', 'member')),
  joined_at timestamptz not null default now()
);

alter table public.guild_members enable row level security;

drop policy if exists "Guild members are publicly readable" on public.guild_members;
create policy "Guild members are publicly readable"
  on public.guild_members for select
  using (true);

drop policy if exists "Users can join a guild" on public.guild_members;
create policy "Users can join a guild"
  on public.guild_members for insert
  with check (auth.uid() = profile_id);

-- A member can leave on their own; the guild's owner can also remove
-- anyone (kick) — checked against guilds.owner_id rather than a role
-- column so kick permission can't be spoofed by a member editing their
-- own role (which no policy here grants them anyway — role changes
-- aren't exposed to the app at all yet).
drop policy if exists "Members can leave or be kicked by the owner" on public.guild_members;
create policy "Members can leave or be kicked by the owner"
  on public.guild_members for delete
  using (
    auth.uid() = profile_id
    or auth.uid() = (select owner_id from public.guilds where id = guild_id)
  );

-- Keeps guilds.member_count in sync — same denormalized-aggregate pattern
-- as coach_profiles.avg_rating.
create or replace function public.recalculate_guild_member_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  target_guild_id uuid := coalesce(new.guild_id, old.guild_id);
begin
  update public.guilds
  set member_count = (
    select count(*) from public.guild_members where guild_id = target_guild_id
  )
  where id = target_guild_id;
  return null;
end;
$$;

drop trigger if exists guild_members_recalculate_count on public.guild_members;
create trigger guild_members_recalculate_count
  after insert or delete on public.guild_members
  for each row execute function public.recalculate_guild_member_count();

-- ---------------------------------------------------------------------------
-- guild_messages: one shared chat per guild, open to every member. Unlike
-- lfg_messages (which only unlocks for accepted party members), there's no
-- separate "accepted" state to check — guild_members already only ever
-- contains actual members.
-- ---------------------------------------------------------------------------
create table if not exists public.guild_messages (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.guild_messages enable row level security;

drop policy if exists "Guild members can read guild chat" on public.guild_messages;
create policy "Guild members can read guild chat"
  on public.guild_messages for select
  using (
    exists (
      select 1 from public.guild_members
      where guild_members.guild_id = guild_messages.guild_id
        and guild_members.profile_id = auth.uid()
    )
  );

drop policy if exists "Guild members can send guild chat" on public.guild_messages;
create policy "Guild members can send guild chat"
  on public.guild_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.guild_members
      where guild_members.guild_id = guild_messages.guild_id
        and guild_members.profile_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- guild_announcements: leader-posted news for the guild, visible only to
-- members — same member-only read shape as guild_messages, but a
-- persistent pinned-style feed rather than a scrolling chat, so it gets
-- its own table. Posting/deleting is leader-only: guild_members.role has
-- an 'officer' value but nothing in the app grants it yet, so this
-- mirrors the leader-only gate already used for kicking members and
-- deleting the guild rather than half-wiring officer permissions here.
-- ---------------------------------------------------------------------------
create table if not exists public.guild_announcements (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.guild_announcements enable row level security;

drop policy if exists "Guild members can read announcements" on public.guild_announcements;
create policy "Guild members can read announcements"
  on public.guild_announcements for select
  using (
    exists (
      select 1 from public.guild_members
      where guild_members.guild_id = guild_announcements.guild_id
        and guild_members.profile_id = auth.uid()
    )
  );

drop policy if exists "Guild leader can post announcements" on public.guild_announcements;
create policy "Guild leader can post announcements"
  on public.guild_announcements for insert
  with check (
    author_id = auth.uid()
    and auth.uid() = (select owner_id from public.guilds where id = guild_id)
  );

drop policy if exists "Guild leader can delete announcements" on public.guild_announcements;
create policy "Guild leader can delete announcements"
  on public.guild_announcements for delete
  using (auth.uid() = (select owner_id from public.guilds where id = guild_id));

-- ---------------------------------------------------------------------------
-- guild_achievements: a leader-maintained log of what the guild has
-- accomplished — same member-only visibility and leader-only write model
-- as guild_announcements above.
-- ---------------------------------------------------------------------------
create table if not exists public.guild_achievements (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  description text,
  created_at timestamptz not null default now()
);

alter table public.guild_achievements enable row level security;

drop policy if exists "Guild members can read achievements" on public.guild_achievements;
create policy "Guild members can read achievements"
  on public.guild_achievements for select
  using (
    exists (
      select 1 from public.guild_members
      where guild_members.guild_id = guild_achievements.guild_id
        and guild_members.profile_id = auth.uid()
    )
  );

drop policy if exists "Guild leader can add achievements" on public.guild_achievements;
create policy "Guild leader can add achievements"
  on public.guild_achievements for insert
  with check (auth.uid() = (select owner_id from public.guilds where id = guild_id));

drop policy if exists "Guild leader can delete achievements" on public.guild_achievements;
create policy "Guild leader can delete achievements"
  on public.guild_achievements for delete
  using (auth.uid() = (select owner_id from public.guilds where id = guild_id));

-- ---------------------------------------------------------------------------
-- conversations: one row per pair of players who've DMed each other, open
-- to any two signed-in players (no friend/follow gate, same "no
-- gatekeeping" bent as guild join or commending). profile_one_id is always
-- the smaller uuid of the pair — enforced by the check constraint below —
-- purely so a plain unique constraint can stop (a, b) and (b, a) from ever
-- both existing, regardless of who messaged first. That same strict "<"
-- also rules out a self-conversation for free, no separate check needed.
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  profile_one_id uuid not null references public.profiles (id) on delete cascade,
  profile_two_id uuid not null references public.profiles (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint conversations_ordered_pair check (profile_one_id < profile_two_id),
  unique (profile_one_id, profile_two_id)
);

alter table public.conversations enable row level security;

drop policy if exists "Participants can read their conversations" on public.conversations;
create policy "Participants can read their conversations"
  on public.conversations for select
  using (auth.uid() = profile_one_id or auth.uid() = profile_two_id);

drop policy if exists "Users can start a conversation they're part of" on public.conversations;
create policy "Users can start a conversation they're part of"
  on public.conversations for insert
  with check (auth.uid() = profile_one_id or auth.uid() = profile_two_id);

-- ---------------------------------------------------------------------------
-- direct_messages: messages within a conversation. read means the
-- recipient has seen it — unambiguous with only two participants, unlike
-- a group chat, so one boolean is enough (no per-recipient read table).
-- ---------------------------------------------------------------------------
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists direct_messages_conversation_id_created_at_idx
  on public.direct_messages (conversation_id, created_at);

alter table public.direct_messages enable row level security;

drop policy if exists "Participants can read their messages" on public.direct_messages;
create policy "Participants can read their messages"
  on public.direct_messages for select
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = direct_messages.conversation_id
        and (conversations.profile_one_id = auth.uid() or conversations.profile_two_id = auth.uid())
    )
  );

drop policy if exists "Participants can send messages" on public.direct_messages;
create policy "Participants can send messages"
  on public.direct_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations
      where conversations.id = direct_messages.conversation_id
        and (conversations.profile_one_id = auth.uid() or conversations.profile_two_id = auth.uid())
    )
  );

drop policy if exists "Participants can mark messages read" on public.direct_messages;
create policy "Participants can mark messages read"
  on public.direct_messages for update
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = direct_messages.conversation_id
        and (conversations.profile_one_id = auth.uid() or conversations.profile_two_id = auth.uid())
    )
  );

-- Only "read" is self-service — body/sender_id must stay exactly as sent,
-- so editing a message after the fact isn't possible via a raw update.
revoke update on public.direct_messages from authenticated;
grant update (read) on public.direct_messages to authenticated;

-- Keeps conversations.last_message_at current for sorting the inbox by
-- recency, same denormalized-aggregate pattern as guilds.member_count.
create or replace function public.touch_conversation_last_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists direct_messages_touch_conversation on public.direct_messages;
create trigger direct_messages_touch_conversation
  after insert on public.direct_messages
  for each row execute function public.touch_conversation_last_message();

-- Notifies the other participant of a new message.
create or replace function public.notify_new_direct_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  recipient_id uuid;
  sender_name text;
begin
  select case when profile_one_id = new.sender_id then profile_two_id else profile_one_id end
    into recipient_id
    from public.conversations where id = new.conversation_id;

  if recipient_id is null or recipient_id = new.sender_id then
    return new;
  end if;

  select username into sender_name from public.profiles where id = new.sender_id;
  insert into public.notifications (profile_id, type, title, body, link)
  values (
    recipient_id,
    'direct_message',
    'New message',
    coalesce('@' || sender_name, 'Someone') || ' sent you a message',
    '/messages/' || new.conversation_id
  );
  return new;
end;
$$;

drop trigger if exists direct_messages_notify_new on public.direct_messages;
create trigger direct_messages_notify_new
  after insert on public.direct_messages
  for each row execute function public.notify_new_direct_message();

-- ---------------------------------------------------------------------------
-- player_reports: moderation data, not public — only admins can read it
-- (checked against profiles.is_admin, same service-role-adjacent trust
-- level as everything else admin-only on this site). Any signed-in player
-- can file one against anyone but themselves.
-- ---------------------------------------------------------------------------
create table if not exists public.player_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed')),
  created_at timestamptz not null default now(),
  constraint player_reports_no_self_report check (reporter_id <> reported_id)
);

alter table public.player_reports enable row level security;

drop policy if exists "Admins can read reports" on public.player_reports;
create policy "Admins can read reports"
  on public.player_reports for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "Users can submit a report" on public.player_reports;
create policy "Users can submit a report"
  on public.player_reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "Admins can update report status" on public.player_reports;
create policy "Admins can update report status"
  on public.player_reports for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Superseded by tournament_teams/tournament_team_members below — the
-- tournament feature switched from individual to team registration in the
-- same working session it shipped in, before any real tournament existed,
-- so this drops the short-lived individual-registration table rather than
-- leaving dead weight around.
drop table if exists public.tournament_participants cascade;

-- ---------------------------------------------------------------------------
-- tournaments: an organizer posts a bracket-based tournament, teams
-- register while it's 'open', the organizer locks registration and
-- generates the bracket (status -> 'in_progress'), then reports results
-- until the final match closes it out (status -> 'completed'). Single
-- elimination only for now — see src/lib/bracket.ts for the seeding
-- algorithm (standard "1v8, 4v5, 2v7, 3v6" ordering with byes to the top
-- seeds, the same convention used by Challonge and most sports
-- federations, researched before building this).
-- ---------------------------------------------------------------------------
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  game_id uuid not null references public.games (id),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  description text,
  region text,
  max_participants smallint,
  status text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint tournaments_max_participants_check check (max_participants is null or max_participants >= 2)
);

-- team_size: how many players make up one side ("5v5" -> 5). max_teams
-- replaces the old individual-registration max_participants (still on the
-- table above, unused, left in place rather than dropped — no destructive
-- renames on a column that might already have a value in a live row).
alter table public.tournaments
  add column if not exists team_size smallint not null default 5;
alter table public.tournaments
  drop constraint if exists tournaments_team_size_check;
alter table public.tournaments
  add constraint tournaments_team_size_check check (team_size between 1 and 10);

alter table public.tournaments
  add column if not exists max_teams smallint;
alter table public.tournaments
  drop constraint if exists tournaments_max_teams_check;
alter table public.tournaments
  add constraint tournaments_max_teams_check check (max_teams is null or max_teams >= 2);

alter table public.tournaments enable row level security;

drop policy if exists "Tournaments are publicly readable" on public.tournaments;
create policy "Tournaments are publicly readable"
  on public.tournaments for select
  using (true);

drop policy if exists "Users can create their own tournaments" on public.tournaments;
create policy "Users can create their own tournaments"
  on public.tournaments for insert
  with check (auth.uid() = organizer_id);

drop policy if exists "Organizers can update their own tournaments" on public.tournaments;
create policy "Organizers can update their own tournaments"
  on public.tournaments for update
  using (auth.uid() = organizer_id);

-- ---------------------------------------------------------------------------
-- tournament_teams: a team registered for a tournament — scoped to that one
-- tournament, not a persistent org (see guilds for that). Whoever creates
-- the team becomes its captain and its first member (tournament_team_members
-- row, inserted by the same app action). seed is null until the organizer
-- sets one (manually or via "Randomize seeds") — bracket generation falls
-- back to registration order (created_at) for anyone left unseeded.
-- ---------------------------------------------------------------------------
create table if not exists public.tournament_teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  name text not null,
  captain_id uuid not null references public.profiles (id) on delete cascade,
  seed integer,
  created_at timestamptz not null default now(),
  unique (tournament_id, name)
);

alter table public.tournament_teams enable row level security;

drop policy if exists "Tournament teams are publicly readable" on public.tournament_teams;
create policy "Tournament teams are publicly readable"
  on public.tournament_teams for select
  using (true);

-- Team creation only while the tournament is still open, and only up to
-- max_teams (unenforced/null = unlimited). The app checks both up front
-- for a friendly error message; this is the backstop.
drop policy if exists "Players can create a team" on public.tournament_teams;
create policy "Players can create a team"
  on public.tournament_teams for insert
  with check (
    auth.uid() = captain_id
    and exists (
      select 1 from public.tournaments t
      where t.id = tournament_id
        and t.status = 'open'
        and (
          t.max_teams is null
          or (select count(*) from public.tournament_teams team where team.tournament_id = t.id) < t.max_teams
        )
    )
  );

-- Seed assignment — organizer only (column-level trust, same as the rest
-- of this app's "narrow update policy, app decides which fields it
-- actually writes" pattern — the captain has no update policy at all here).
drop policy if exists "Organizers can set team seeds" on public.tournament_teams;
create policy "Organizers can set team seeds"
  on public.tournament_teams for update
  using (auth.uid() = (select organizer_id from public.tournaments where id = tournament_id));

-- The captain can disband their own team before the bracket locks; the
-- organizer can remove any team at any time (e.g. a no-show/DQ).
drop policy if exists "Captains can disband, organizers can remove any team" on public.tournament_teams;
create policy "Captains can disband, organizers can remove any team"
  on public.tournament_teams for delete
  using (
    (
      auth.uid() = captain_id
      and exists (select 1 from public.tournaments where id = tournament_id and status = 'open')
    )
    or auth.uid() = (select organizer_id from public.tournaments where id = tournament_id)
  );

-- ---------------------------------------------------------------------------
-- tournament_team_members: a player's membership on a tournament team.
-- tournament_id is denormalized from tournament_teams purely so "one team
-- per player per tournament" can be a plain unique constraint here, rather
-- than a cross-table check.
-- ---------------------------------------------------------------------------
create table if not exists public.tournament_team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.tournament_teams (id) on delete cascade,
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (team_id, profile_id),
  unique (tournament_id, profile_id)
);

alter table public.tournament_team_members enable row level security;

drop policy if exists "Team rosters are publicly readable" on public.tournament_team_members;
create policy "Team rosters are publicly readable"
  on public.tournament_team_members for select
  using (true);

-- Self-join only while the tournament is open and the team has room
-- (capped at the tournament's team_size). No captain-adds-others path —
-- a player joins themselves, same consent model as everything else on
-- this site that isn't an explicit invite.
drop policy if exists "Players can join a team themselves" on public.tournament_team_members;
create policy "Players can join a team themselves"
  on public.tournament_team_members for insert
  with check (
    auth.uid() = profile_id
    and exists (
      select 1 from public.tournament_teams team
      join public.tournaments t on t.id = team.tournament_id
      where team.id = team_id
        and t.status = 'open'
        and (select count(*) from public.tournament_team_members m where m.team_id = team.id) < t.team_size
    )
  );

-- A player can leave their own team (while still open); the team's captain
-- or the tournament organizer can remove anyone, any time.
drop policy if exists "Members can leave, captains/organizers can remove anyone" on public.tournament_team_members;
create policy "Members can leave, captains/organizers can remove anyone"
  on public.tournament_team_members for delete
  using (
    (
      auth.uid() = profile_id
      and exists (select 1 from public.tournaments where id = tournament_id and status = 'open')
    )
    or auth.uid() = (select captain_id from public.tournament_teams where id = team_id)
    or auth.uid() = (select organizer_id from public.tournaments where id = tournament_id)
  );

-- ---------------------------------------------------------------------------
-- tournament_matches: one cell of the bracket. next_match_id/next_match_slot
-- say where this match's winner advances to (slot 1 or 2 of that match) —
-- generated once, up front, when the organizer starts the tournament (see
-- generateBracket in src/lib/bracket.ts), so reporting a result is just
-- "fill in the winner here, then fill in the known slot over there."
-- participant1/2/winner point at tournament_teams — each bracket slot is a
-- team, not an individual player.
-- ---------------------------------------------------------------------------
create table if not exists public.tournament_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  round smallint not null,
  match_number smallint not null,
  participant1_id uuid references public.tournament_teams (id) on delete set null,
  participant2_id uuid references public.tournament_teams (id) on delete set null,
  winner_id uuid references public.tournament_teams (id) on delete set null,
  score1 smallint,
  score2 smallint,
  status text not null default 'pending' check (status in ('pending', 'ready', 'completed')),
  next_match_id uuid references public.tournament_matches (id) on delete set null,
  next_match_slot smallint check (next_match_slot in (1, 2)),
  created_at timestamptz not null default now(),
  unique (tournament_id, round, match_number)
);

-- Repoints participant1_id/participant2_id/winner_id at tournament_teams —
-- a no-op on a fresh install (the create table above already has it right)
-- but required on a database where tournament_matches was created before
-- this switch from individual to team registration.
alter table public.tournament_matches drop constraint if exists tournament_matches_participant1_id_fkey;
alter table public.tournament_matches
  add constraint tournament_matches_participant1_id_fkey
  foreign key (participant1_id) references public.tournament_teams (id) on delete set null;

alter table public.tournament_matches drop constraint if exists tournament_matches_participant2_id_fkey;
alter table public.tournament_matches
  add constraint tournament_matches_participant2_id_fkey
  foreign key (participant2_id) references public.tournament_teams (id) on delete set null;

alter table public.tournament_matches drop constraint if exists tournament_matches_winner_id_fkey;
alter table public.tournament_matches
  add constraint tournament_matches_winner_id_fkey
  foreign key (winner_id) references public.tournament_teams (id) on delete set null;

alter table public.tournament_matches enable row level security;

drop policy if exists "Tournament brackets are publicly readable" on public.tournament_matches;
create policy "Tournament brackets are publicly readable"
  on public.tournament_matches for select
  using (true);

drop policy if exists "Organizers can generate their bracket" on public.tournament_matches;
create policy "Organizers can generate their bracket"
  on public.tournament_matches for insert
  with check (auth.uid() = (select organizer_id from public.tournaments where id = tournament_id));

drop policy if exists "Organizers can report match results" on public.tournament_matches;
create policy "Organizers can report match results"
  on public.tournament_matches for update
  using (auth.uid() = (select organizer_id from public.tournaments where id = tournament_id));

-- Notifies every player on both teams once a match has everyone it needs
-- and is ready to be played — fires whether that happens at bracket
-- generation (a match with no byes on either side comes in 'ready' from
-- the initial insert) or later, when a previous round's winner fills the
-- last open slot.
create or replace function public.notify_tournament_match_ready()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  tournament_name text;
begin
  if new.status <> 'ready' or new.participant1_id is null or new.participant2_id is null then
    return new;
  end if;
  if TG_OP = 'UPDATE' and old.status = 'ready' then
    return new;
  end if;

  select name into tournament_name from public.tournaments where id = new.tournament_id;

  insert into public.notifications (profile_id, type, title, body, link)
  select m.profile_id, 'tournament_match_ready', 'Match ready',
    'Your next match in "' || coalesce(tournament_name, 'a tournament') || '" is ready.',
    '/tournaments/' || new.tournament_id
  from public.tournament_team_members m
  where m.team_id in (new.participant1_id, new.participant2_id);

  return new;
end;
$$;

drop trigger if exists tournament_matches_notify_ready on public.tournament_matches;
create trigger tournament_matches_notify_ready
  after insert or update on public.tournament_matches
  for each row execute function public.notify_tournament_match_ready();

-- Notifies every player on every registered team when the organizer locks
-- the bracket in.
create or replace function public.notify_tournament_started()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'in_progress' and old.status = 'open' then
    insert into public.notifications (profile_id, type, title, body, link)
    select m.profile_id, 'tournament_started', 'Tournament started',
      '"' || new.name || '" has started — check your bracket.',
      '/tournaments/' || new.id
    from public.tournament_team_members m
    where m.tournament_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists tournaments_notify_started on public.tournaments;
create trigger tournaments_notify_started
  after update on public.tournaments
  for each row execute function public.notify_tournament_started();

-- ---------------------------------------------------------------------------
-- scrimmages: "looking for a scrim" — a player posts their game, region,
-- and when they want to play, and another team reaches out directly. Same
-- direct-contact model as coaching_requests: no accept/confirm flow, no
-- chat — just a browsable board. Unlike lfg_posts/coaching_requests, a
-- player can have more than one open at a time (they may be free to scrim
-- at several different times), so there's no one-open-per-author constraint.
-- ---------------------------------------------------------------------------
create table if not exists public.scrimmages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  game_id uuid not null references public.games (id),
  region text,
  scheduled_at timestamptz not null,
  description text,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.scrimmages enable row level security;

drop policy if exists "Scrimmages are publicly readable" on public.scrimmages;
create policy "Scrimmages are publicly readable"
  on public.scrimmages for select
  using (true);

drop policy if exists "Users can post their own scrimmages" on public.scrimmages;
create policy "Users can post their own scrimmages"
  on public.scrimmages for insert
  with check (auth.uid() = author_id);

drop policy if exists "Users can update their own scrimmages" on public.scrimmages;
create policy "Users can update their own scrimmages"
  on public.scrimmages for update
  using (auth.uid() = author_id);

drop policy if exists "Users can delete their own scrimmages" on public.scrimmages;
create policy "Users can delete their own scrimmages"
  on public.scrimmages for delete
  using (auth.uid() = author_id);
