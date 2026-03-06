-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  spotify_token jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Listening history snapshots
create table public.listening_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  track_name text not null,
  artist_name text not null,
  album_name text,
  album_image_url text,
  played_at timestamptz not null,
  spotify_track_id text,
  created_at timestamptz default now()
);

alter table public.listening_history enable row level security;

create policy "Users can read own history"
  on public.listening_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own history"
  on public.listening_history for insert
  with check (auth.uid() = user_id);

-- Top items snapshots
create table public.top_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  item_type text not null check (item_type in ('artist', 'track')),
  time_range text not null check (time_range in ('short_term', 'medium_term', 'long_term')),
  rank integer not null,
  name text not null,
  secondary_text text,
  image_url text,
  spotify_id text,
  genres text[],
  snapshot_date date default current_date,
  created_at timestamptz default now()
);

alter table public.top_items enable row level security;

create policy "Users can read own top items"
  on public.top_items for select
  using (auth.uid() = user_id);

create policy "Users can insert own top items"
  on public.top_items for insert
  with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Indexes
create index idx_listening_history_user_played on public.listening_history(user_id, played_at desc);
create index idx_top_items_user_type_range on public.top_items(user_id, item_type, time_range, snapshot_date desc);
