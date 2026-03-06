-- =====================
-- CATALOG UPSERT FUNCTIONS
-- Server-side logic for populating the music catalog
-- =====================

-- Upsert a genre by name, return its id
create or replace function public.upsert_genre(p_name text)
returns uuid as $$
declare
  v_slug text;
  v_id uuid;
begin
  v_slug := lower(trim(p_name));

  insert into public.genres (name, slug)
  values (trim(p_name), v_slug)
  on conflict (slug) do nothing;

  select id into v_id from public.genres where slug = v_slug;
  return v_id;
end;
$$ language plpgsql security definer;

-- Upsert an artist by spotify_artist_id (or name if no spotify id), return its id
create or replace function public.upsert_artist(
  p_name text,
  p_spotify_artist_id text default null,
  p_image_url text default null,
  p_genres text[] default '{}'
)
returns uuid as $$
declare
  v_id uuid;
  v_genre_id uuid;
  g text;
begin
  -- Try to find by spotify id first
  if p_spotify_artist_id is not null then
    select id into v_id from public.artists where spotify_artist_id = p_spotify_artist_id;
  end if;

  -- If not found, try by exact name (only when no spotify id)
  if v_id is null and p_spotify_artist_id is null then
    select id into v_id from public.artists where lower(name) = lower(trim(p_name)) limit 1;
  end if;

  if v_id is not null then
    -- Update image if provided
    update public.artists
    set image_url = coalesce(p_image_url, image_url),
        updated_at = now()
    where id = v_id;
  else
    insert into public.artists (name, spotify_artist_id, image_url)
    values (trim(p_name), p_spotify_artist_id, p_image_url)
    on conflict (spotify_artist_id) do update
      set image_url = coalesce(excluded.image_url, public.artists.image_url),
          updated_at = now()
    returning id into v_id;
  end if;

  -- Link genres
  if array_length(p_genres, 1) > 0 then
    foreach g in array p_genres loop
      v_genre_id := public.upsert_genre(g);
      insert into public.artist_genres (artist_id, genre_id)
      values (v_id, v_genre_id)
      on conflict do nothing;
    end loop;
  end if;

  return v_id;
end;
$$ language plpgsql security definer;

-- Upsert a song with its artists, return the song id
create or replace function public.upsert_song(
  p_title text,
  p_artist_names text[],
  p_album_name text default null,
  p_image_url text default null,
  p_spotify_track_id text default null,
  p_musicbrainz_id text default null,
  p_preview_url text default null,
  p_duration_ms integer default null
)
returns uuid as $$
declare
  v_song_id uuid;
  v_artist_id uuid;
  i integer;
begin
  -- Try to find existing song
  if p_spotify_track_id is not null then
    select id into v_song_id from public.songs where spotify_track_id = p_spotify_track_id;
  end if;
  if v_song_id is null and p_musicbrainz_id is not null then
    select id into v_song_id from public.songs where musicbrainz_id = p_musicbrainz_id;
  end if;

  if v_song_id is not null then
    -- Update metadata
    update public.songs
    set album_name = coalesce(p_album_name, album_name),
        image_url = coalesce(p_image_url, image_url),
        preview_url = coalesce(p_preview_url, preview_url),
        duration_ms = coalesce(p_duration_ms, duration_ms),
        updated_at = now()
    where id = v_song_id;
  else
    insert into public.songs (title, spotify_track_id, musicbrainz_id, album_name, image_url, preview_url, duration_ms)
    values (trim(p_title), p_spotify_track_id, p_musicbrainz_id, p_album_name, p_image_url, p_preview_url, p_duration_ms)
    returning id into v_song_id;
  end if;

  -- Link artists (by name only since we may not have their spotify ids here)
  for i in 1..array_length(p_artist_names, 1) loop
    v_artist_id := public.upsert_artist(p_artist_names[i]);
    insert into public.song_artists (song_id, artist_id, position)
    values (v_song_id, v_artist_id, i - 1)
    on conflict do nothing;
  end loop;

  return v_song_id;
end;
$$ language plpgsql security definer;
