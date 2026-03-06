-- =====================
-- STREAKS
-- =====================

alter table public.profiles
  add column current_streak integer default 0,
  add column longest_streak integer default 0,
  add column last_post_date date;

-- Update streak on post creation
create or replace function public.update_streak()
returns trigger as $$
declare
  prev_date date;
  curr_streak integer;
  max_streak integer;
begin
  select last_post_date, current_streak, longest_streak
  into prev_date, curr_streak, max_streak
  from public.profiles
  where id = NEW.user_id;

  if prev_date = current_date then
    -- Already posted today, no change
    return NEW;
  elsif prev_date = current_date - 1 then
    -- Consecutive day, increment streak
    curr_streak := curr_streak + 1;
  else
    -- Streak broken or first post
    curr_streak := 1;
  end if;

  if curr_streak > max_streak then
    max_streak := curr_streak;
  end if;

  update public.profiles
  set current_streak = curr_streak,
      longest_streak = max_streak,
      last_post_date = current_date,
      updated_at = now()
  where id = NEW.user_id;

  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_post_created_streak
  after insert on public.posts
  for each row execute function public.update_streak();


-- =====================
-- SONG DUELS
-- =====================

create table public.duels (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  opponent_id uuid references public.profiles(id) on delete cascade,
  -- Creator's song
  creator_song_title text not null,
  creator_song_artist text not null,
  creator_song_image_url text,
  creator_spotify_track_id text,
  -- Opponent's song (filled when accepted)
  opponent_song_title text,
  opponent_song_artist text,
  opponent_song_image_url text,
  opponent_spotify_track_id text,
  -- State
  status text not null default 'open' check (status in ('open', 'active', 'finished')),
  creator_votes integer default 0,
  opponent_votes integer default 0,
  expires_at timestamptz default (now() + interval '24 hours'),
  created_at timestamptz default now()
);

alter table public.duels enable row level security;

create policy "Anyone can read duels"
  on public.duels for select using (true);

create policy "Users can create duels"
  on public.duels for insert
  with check (auth.uid() = creator_id);

create policy "Opponents can accept duels"
  on public.duels for update
  using (auth.uid() = opponent_id or auth.uid() = creator_id);

-- Duel votes
create table public.duel_votes (
  id uuid default gen_random_uuid() primary key,
  duel_id uuid references public.duels(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  voted_for text not null check (voted_for in ('creator', 'opponent')),
  created_at timestamptz default now(),
  unique(duel_id, user_id)
);

alter table public.duel_votes enable row level security;

create policy "Anyone can see votes"
  on public.duel_votes for select using (true);

create policy "Users can vote"
  on public.duel_votes for insert
  with check (auth.uid() = user_id);

-- Update vote counts
create or replace function public.update_duel_votes()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.voted_for = 'creator' then
      update public.duels set creator_votes = creator_votes + 1 where id = NEW.duel_id;
    else
      update public.duels set opponent_votes = opponent_votes + 1 where id = NEW.duel_id;
    end if;
    return NEW;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_duel_vote
  after insert on public.duel_votes
  for each row execute function public.update_duel_votes();

-- Indexes
create index idx_duels_status on public.duels(status, created_at desc);
create index idx_duels_creator on public.duels(creator_id);
create index idx_duels_opponent on public.duels(opponent_id);
create index idx_duel_votes_duel on public.duel_votes(duel_id);
create index idx_duel_votes_user on public.duel_votes(user_id, duel_id);
