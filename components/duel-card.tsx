/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { Button } from "react-aria-components";
import { haptic } from "@/lib/haptics";
import { voteDuel } from "@/lib/db";

interface DuelProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export interface Duel {
  id: string;
  creator_id: string;
  opponent_id: string | null;
  creator_song_title: string;
  creator_song_artist: string;
  creator_song_image_url: string | null;
  creator_spotify_track_id: string | null;
  opponent_song_title: string | null;
  opponent_song_artist: string | null;
  opponent_song_image_url: string | null;
  opponent_spotify_track_id: string | null;
  status: "open" | "active" | "finished";
  creator_votes: number;
  opponent_votes: number;
  expires_at: string;
  created_at: string;
  creator: DuelProfile;
  opponent: DuelProfile | null;
  user_vote: "creator" | "opponent" | null;
}

interface DuelCardProps {
  duel: Duel;
  currentUserId: string;
  onAccept?: (duelId: string) => void;
}

export function DuelCard({ duel, currentUserId, onAccept }: DuelCardProps) {
  const [userVote, setUserVote] = useState(duel.user_vote);
  const [creatorVotes, setCreatorVotes] = useState(duel.creator_votes);
  const [opponentVotes, setOpponentVotes] = useState(duel.opponent_votes);
  const [voting, setVoting] = useState(false);

  const totalVotes = creatorVotes + opponentVotes;
  const creatorPct =
    totalVotes > 0 ? Math.round((creatorVotes / totalVotes) * 100) : 50;
  const opponentPct = totalVotes > 0 ? 100 - creatorPct : 50;

  const isCreator = duel.creator_id === currentUserId;
  const isOpponent = duel.opponent_id === currentUserId;
  const canVote =
    duel.status === "active" && !userVote && !isCreator && !isOpponent;
  const showResults = !!userVote || isCreator || isOpponent;

  const vote = async (votedFor: "creator" | "opponent") => {
    if (voting || userVote) return;
    haptic("medium");
    setVoting(true);
    try {
      await voteDuel(duel.id, votedFor);
      setUserVote(votedFor);
      if (votedFor === "creator") setCreatorVotes((v) => v + 1);
      else setOpponentVotes((v) => v + 1);
    } catch {}
    setVoting(false);
  };

  return (
    <div className="border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-punk-orange">
          Song Duel
        </span>
        <span className="text-[10px] text-muted-foreground">
          {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex">
        {/* Creator side */}
        <SongSide
          profile={duel.creator}
          songTitle={duel.creator_song_title}
          songArtist={duel.creator_song_artist}
          songImage={duel.creator_song_image_url}
          spotifyId={duel.creator_spotify_track_id}
          votes={creatorVotes}
          pct={creatorPct}
          showResults={showResults}
          isWinning={creatorVotes > opponentVotes}
          isVoted={userVote === "creator"}
          canVote={canVote}
          onVote={() => vote("creator")}
          totalVotes={totalVotes}
          side="left"
        />

        {/* VS divider */}
        <div className="flex items-center justify-center px-2 bg-muted">
          <span className="text-xs font-bold text-punk-pink -rotate-12">
            VS
          </span>
        </div>

        {/* Opponent side */}
        {duel.status === "open" ? (
          <div className="flex-1 w-0 min-w-0 flex flex-col items-center justify-center py-6 gap-2">
            <span className="text-2xl">🎯</span>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Waiting for challenger
            </p>
            {!isCreator && (
              <Button
                onPress={() => {
                  haptic("medium");
                  onAccept?.(duel.id);
                }}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-punk-pink text-white -skew-x-3 cursor-pointer hover:bg-punk-pink/80"
              >
                <span className="skew-x-3">Accept Duel</span>
              </Button>
            )}
          </div>
        ) : (
          <SongSide
            profile={duel.opponent!}
            songTitle={duel.opponent_song_title!}
            songArtist={duel.opponent_song_artist!}
            songImage={duel.opponent_song_image_url}
            spotifyId={duel.opponent_spotify_track_id}
            votes={opponentVotes}
            pct={opponentPct}
            showResults={showResults}
            isWinning={opponentVotes > creatorVotes}
            isVoted={userVote === "opponent"}
            canVote={canVote}
            onVote={() => vote("opponent")}
            totalVotes={totalVotes}
            side="right"
          />
        )}
      </div>

      {/* Vote bar */}
      {showResults && duel.status === "active" && totalVotes > 0 && (
        <div className="flex h-1.5">
          <div
            className="bg-punk-cyan transition-all duration-500"
            style={{ width: `${creatorPct}%` }}
          />
          <div
            className="bg-punk-pink transition-all duration-500"
            style={{ width: `${opponentPct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function SongSide({
  profile,
  songTitle,
  songArtist,
  songImage,
  // spotifyId,
  votes,
  pct,
  showResults,
  isWinning,
  isVoted,
  canVote,
  onVote,
  totalVotes,
  side,
}: {
  profile: { id: string; display_name: string; avatar_url: string | null };
  songTitle: string;
  songArtist: string;
  songImage: string | null;
  spotifyId: string | null;
  votes: number;
  pct: number;
  showResults: boolean;
  isWinning: boolean;
  isVoted: boolean;
  canVote: boolean;
  onVote: () => void;
  totalVotes: number;
  side: "left" | "right";
}) {
  const accentColor = side === "left" ? "punk-cyan" : "punk-pink";

  return (
    <button
      onClick={canVote ? onVote : undefined}
      className={`
        flex-1 w-0 min-w-0 p-3 flex flex-col items-center gap-2 text-center transition-all
        ${canVote ? "cursor-pointer hover:bg-card-hover" : "cursor-default"}
        ${isVoted ? `bg-${accentColor}/10` : ""}
      `}
      disabled={!canVote}
    >
      {/* User */}
      <div className="flex items-center gap-1.5">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="w-5 h-5 rounded-full"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-punk-purple text-[8px] flex items-center justify-center font-bold">
            {profile.display_name?.charAt(0)}
          </div>
        )}
        <span className="text-[10px] font-bold truncate max-w-[80px]">
          {profile.display_name}
        </span>
      </div>

      {/* Song */}
      <div className="relative">
        {songImage ? (
          <img src={songImage} alt="" className="w-14 h-14 object-cover" />
        ) : (
          <div className="w-14 h-14 bg-border flex items-center justify-center text-xl text-muted-foreground">
            ♪
          </div>
        )}
        {showResults && isWinning && totalVotes > 0 && (
          <span className="absolute -top-3 -right-3 text-lg rotate-25 drop-shadow-md">
            👑
          </span>
        )}
      </div>
      <div className="min-w-0 w-full">
        <p className="text-xs font-bold truncate">{songTitle}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          {songArtist}
        </p>
      </div>

      {/* Results */}
      {showResults && (
        <div
          className={`text-xs font-bold font-mono ${isWinning ? `text-${accentColor}` : "text-muted-foreground"}`}
        >
          {pct}%<span className="text-[10px] font-normal ml-1">({votes})</span>
        </div>
      )}

      {/* Vote hint */}
      {canVote && (
        <span
          className={`text-[9px] uppercase tracking-wider text-${accentColor} font-bold`}
        >
          Tap to vote
        </span>
      )}

      {isVoted && (
        <span
          className={`text-[9px] uppercase tracking-wider text-${accentColor} font-bold`}
        >
          Your pick ✓
        </span>
      )}
    </button>
  );
}
