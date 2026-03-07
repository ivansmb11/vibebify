-- =====================
-- QUERY FUNCTIONS
-- Server-side functions for complex multi-step queries
-- =====================

-- Get user profile with follower/following counts and follow status
create or replace function public.get_user_profile(
  p_target_id uuid,
  p_current_user_id uuid default null
)
returns jsonb as $$
declare
  v_profile jsonb;
  v_followers bigint;
  v_following bigint;
  v_is_following boolean := false;
begin
  select jsonb_build_object(
    'id', p.id,
    'display_name', p.display_name,
    'avatar_url', p.avatar_url,
    'created_at', p.created_at,
    'current_streak', p.current_streak,
    'longest_streak', p.longest_streak
  ) into v_profile
  from public.profiles p
  where p.id = p_target_id;

  if v_profile is null then
    return null;
  end if;

  select count(*) into v_followers
  from public.follows where following_id = p_target_id;

  select count(*) into v_following
  from public.follows where follower_id = p_target_id;

  if p_current_user_id is not null and p_current_user_id != p_target_id then
    select exists(
      select 1 from public.follows
      where follower_id = p_current_user_id and following_id = p_target_id
    ) into v_is_following;
  end if;

  return v_profile || jsonb_build_object(
    'followers_count', v_followers,
    'following_count', v_following,
    'is_following', v_is_following,
    'is_self', coalesce(p_current_user_id = p_target_id, false)
  );
end;
$$ language plpgsql security definer stable;

-- Accept a duel atomically: validate, update, upsert catalog, return enriched duel
create or replace function public.accept_duel(
  p_duel_id uuid,
  p_user_id uuid,
  p_song_title text,
  p_song_artist text,
  p_song_image_url text default null,
  p_spotify_track_id text default null
)
returns jsonb as $$
declare
  v_duel record;
  v_result jsonb;
  v_creator jsonb;
  v_opponent jsonb;
begin
  -- Lock and verify
  select * into v_duel
  from public.duels
  where id = p_duel_id and status = 'open'
  for update;

  if not found then
    raise exception 'Duel not found or not open';
  end if;

  if v_duel.creator_id = p_user_id then
    raise exception 'Cannot accept your own duel';
  end if;

  -- Update duel
  update public.duels set
    opponent_id = p_user_id,
    opponent_song_title = p_song_title,
    opponent_song_artist = p_song_artist,
    opponent_song_image_url = p_song_image_url,
    opponent_spotify_track_id = p_spotify_track_id,
    status = 'active',
    expires_at = now() + interval '24 hours'
  where id = p_duel_id;

  -- Upsert song into catalog
  perform public.upsert_song(
    p_title := p_song_title,
    p_artist_names := string_to_array(p_song_artist, ', '),
    p_image_url := p_song_image_url,
    p_spotify_track_id := p_spotify_track_id
  );

  -- Build enriched response
  select jsonb_build_object('id', p.id, 'display_name', p.display_name, 'avatar_url', p.avatar_url)
  into v_creator from public.profiles p where p.id = v_duel.creator_id;

  select jsonb_build_object('id', p.id, 'display_name', p.display_name, 'avatar_url', p.avatar_url)
  into v_opponent from public.profiles p where p.id = p_user_id;

  select jsonb_build_object(
    'id', d.id,
    'creator_id', d.creator_id,
    'opponent_id', d.opponent_id,
    'creator_song_title', d.creator_song_title,
    'creator_song_artist', d.creator_song_artist,
    'creator_song_image_url', d.creator_song_image_url,
    'creator_spotify_track_id', d.creator_spotify_track_id,
    'opponent_song_title', d.opponent_song_title,
    'opponent_song_artist', d.opponent_song_artist,
    'opponent_song_image_url', d.opponent_song_image_url,
    'opponent_spotify_track_id', d.opponent_spotify_track_id,
    'status', d.status,
    'creator_votes', d.creator_votes,
    'opponent_votes', d.opponent_votes,
    'expires_at', d.expires_at,
    'created_at', d.created_at,
    'creator', v_creator,
    'opponent', v_opponent,
    'user_vote', null
  ) into v_result
  from public.duels d where d.id = p_duel_id;

  return v_result;
end;
$$ language plpgsql security definer;
