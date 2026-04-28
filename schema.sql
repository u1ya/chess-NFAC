-- Run this in your Supabase SQL editor

create extension if not exists "pgcrypto";

-- Profiles table (extends Supabase auth.users)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  city text not null default 'Almaty',
  rating integer not null default 1200,
  is_pro boolean not null default false,
  coach_score integer not null default 0,
  created_at timestamptz not null default now()
);

-- Games table
create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('friend', 'bot', 'local')),
  config jsonb not null default '{}',
  pgn text not null default '',
  status text not null default 'in_progress' check (status in ('in_progress', 'finished')),
  winner_id uuid references profiles(id) on delete set null,
  white_id uuid references profiles(id) on delete set null,
  black_id uuid references profiles(id) on delete set null,
  room_code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- AI Reviews table
create table if not exists ai_reviews (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  review_text text not null,
  accuracy_percentage integer,
  biggest_mistake text,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table games enable row level security;
alter table ai_reviews enable row level security;

-- Profiles policies
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Games policies
create policy "Games are viewable by everyone" on games for select using (true);
create policy "Authenticated users can insert games" on games for insert with check (auth.uid() is not null);
create policy "Players can update their games" on games for update using (
  auth.uid() = white_id or auth.uid() = black_id or white_id is null
);

-- AI Reviews policies
create policy "Reviews are viewable by owner" on ai_reviews for select using (auth.uid() = user_id);
create policy "Users can insert own reviews" on ai_reviews for insert with check (auth.uid() = user_id);

-- Enable realtime for games table
alter publication supabase_realtime add table games;

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, username, city)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'city', 'Almaty')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
