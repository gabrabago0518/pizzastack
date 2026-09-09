-- Pizzastack (gaming community hub) schema
-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.

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

create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up via Supabase Auth.
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
  slug text unique not null
);

alter table public.games enable row level security;

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

create policy "LFG posts are publicly readable"
  on public.lfg_posts for select
  using (true);

create policy "Users can create their own LFG posts"
  on public.lfg_posts for insert
  with check (auth.uid() = author_id);

create policy "Users can update their own LFG posts"
  on public.lfg_posts for update
  using (auth.uid() = author_id);

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

create policy "Coach profiles are publicly readable"
  on public.coach_profiles for select
  using (true);

create policy "Users can create their own coach profiles"
  on public.coach_profiles for insert
  with check (auth.uid() = profile_id);

create policy "Users can update their own coach profiles"
  on public.coach_profiles for update
  using (auth.uid() = profile_id);

create policy "Users can delete their own coach profiles"
  on public.coach_profiles for delete
  using (auth.uid() = profile_id);
