-- Fix RLS policy for accepting duels.
-- The old policy required auth.uid() = opponent_id, but opponent_id is NULL
-- on open duels, so no one could accept them.

drop policy "Opponents can accept duels" on public.duels;

create policy "Participants can update duels"
  on public.duels for update
  using (
    auth.uid() = creator_id
    or auth.uid() = opponent_id
    or (status = 'open' and opponent_id is null)
  );
