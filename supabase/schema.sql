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

-- Auto-create a profile row whenever someone signs up via Supabase Auth.
-- Also seeds profile_games from a `game_ids` array passed in signup metadata
-- (options.data.game_ids), so games picked on the signup form are saved even
-- when email confirmation means there's no session yet to insert them with.
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

  if jsonb_typeof(new.raw_user_meta_data -> 'game_ids') = 'array' then
    insert into public.profile_games (profile_id, game_id)
    select new.id, value::uuid
    from jsonb_array_elements_text(new.raw_user_meta_data -> 'game_ids') as value
    on conflict do nothing;
  end if;

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
  slug text unique not null
);

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
