-- =====================
-- MUSIC CATALOG
-- Normalized tables for songs, artists, and genres
-- =====================

-- Genres
create table public.genres (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique, -- lowercase, trimmed for dedup
  created_at timestamptz default now()
);

create unique index idx_genres_slug on public.genres(slug);

alter table public.genres enable row level security;

create policy "Anyone can read genres"
  on public.genres for select using (true);

create policy "Authenticated users can insert genres"
  on public.genres for insert
  with check (auth.uid() is not null);

-- Artists
create table public.artists (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  spotify_artist_id text unique,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index idx_artists_spotify on public.artists(spotify_artist_id) where spotify_artist_id is not null;

alter table public.artists enable row level security;

create policy "Anyone can read artists"
  on public.artists for select using (true);

create policy "Authenticated users can insert artists"
  on public.artists for insert
  with check (auth.uid() is not null);

create policy "Authenticated users can update artists"
  on public.artists for update
  using (auth.uid() is not null);

-- Artist ↔ Genre (many-to-many)
create table public.artist_genres (
  artist_id uuid references public.artists(id) on delete cascade not null,
  genre_id uuid references public.genres(id) on delete cascade not null,
  primary key (artist_id, genre_id)
);

alter table public.artist_genres enable row level security;

create policy "Anyone can read artist_genres"
  on public.artist_genres for select using (true);

create policy "Authenticated users can insert artist_genres"
  on public.artist_genres for insert
  with check (auth.uid() is not null);

-- Songs
create table public.songs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  spotify_track_id text unique,
  musicbrainz_id text unique,
  album_name text,
  image_url text,
  preview_url text,
  duration_ms integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index idx_songs_spotify on public.songs(spotify_track_id) where spotify_track_id is not null;
create unique index idx_songs_musicbrainz on public.songs(musicbrainz_id) where musicbrainz_id is not null;

alter table public.songs enable row level security;

create policy "Anyone can read songs"
  on public.songs for select using (true);

create policy "Authenticated users can insert songs"
  on public.songs for insert
  with check (auth.uid() is not null);

create policy "Authenticated users can update songs"
  on public.songs for update
  using (auth.uid() is not null);

-- Song ↔ Artist (many-to-many, ordered)
create table public.song_artists (
  song_id uuid references public.songs(id) on delete cascade not null,
  artist_id uuid references public.artists(id) on delete cascade not null,
  position smallint not null default 0, -- artist order on the track
  primary key (song_id, artist_id)
);

alter table public.song_artists enable row level security;

create policy "Anyone can read song_artists"
  on public.song_artists for select using (true);

create policy "Authenticated users can insert song_artists"
  on public.song_artists for insert
  with check (auth.uid() is not null);

-- Indexes
create index idx_song_artists_artist on public.song_artists(artist_id);
create index idx_artist_genres_genre on public.artist_genres(genre_id);
create index idx_songs_title on public.songs using gin (to_tsvector('simple', title));
create index idx_artists_name on public.artists using gin (to_tsvector('simple', name));
