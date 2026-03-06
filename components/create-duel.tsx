"use client";

import { useState } from "react";
import {
  Dialog,
  Modal,
  ModalOverlay,
  TextField,
  Input,
  Button,
} from "react-aria-components";
import { haptic } from "@/lib/haptics";
import type { Duel } from "./duel-card";

interface SpotifyTrack {
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  id: string;
}

interface CreateDuelProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (duel: Duel) => void;
  recentTracks: SpotifyTrack[];
  /** If set, this is accepting an existing duel */
  acceptingDuelId?: string | null;
}

export function CreateDuel({
  isOpen,
  onClose,
  onCreated,
  recentTracks,
  acceptingDuelId,
}: CreateDuelProps) {
  const [selectedTrack, setSelectedTrack] = useState<{
    title: string;
    artist: string;
    image_url?: string;
    spotify_track_id?: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectTrack = (track: SpotifyTrack) => {
    haptic("light");
    setSelectedTrack({
      title: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      image_url: track.album.images?.[1]?.url,
      spotify_track_id: track.id,
    });
  };

  const submit = async () => {
    if (!selectedTrack || submitting) return;
    haptic("medium");
    setSubmitting(true);

    const url = acceptingDuelId
      ? `/api/duels/${acceptingDuelId}/accept`
      : "/api/duels";

    const body = acceptingDuelId
      ? {
          opponent_song_title: selectedTrack.title,
          opponent_song_artist: selectedTrack.artist,
          opponent_song_image_url: selectedTrack.image_url,
          opponent_spotify_track_id: selectedTrack.spotify_track_id,
        }
      : {
          creator_song_title: selectedTrack.title,
          creator_song_artist: selectedTrack.artist,
          creator_song_image_url: selectedTrack.image_url,
          creator_spotify_track_id: selectedTrack.spotify_track_id,
        };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const duel = await res.json();
      onCreated(duel);
      setSelectedTrack(null);
      onClose();
    }
    setSubmitting(false);
  };

  const reset = () => {
    setSelectedTrack(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => !open && reset()}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
    >
      <Modal className="w-full max-w-lg max-h-[80vh] bg-background border-t sm:border border-border flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden">
        <Dialog className="flex flex-col flex-1 outline-none overflow-hidden">
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-border rounded-full" />
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <Button
              onPress={reset}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </Button>
            <h3 className="text-sm font-bold uppercase tracking-wider">
              {acceptingDuelId ? "Accept Duel" : "Start a Duel"}
            </h3>
            <Button
              onPress={submit}
              isDisabled={!selectedTrack || submitting}
              className="bg-punk-orange text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-punk-orange/80 disabled:opacity-40 disabled:cursor-default -skew-x-3"
            >
              <span className="skew-x-3 block">
                {submitting ? "..." : acceptingDuelId ? "Fight!" : "Challenge"}
              </span>
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {selectedTrack ? (
              <div className="flex items-center gap-3 bg-muted border border-punk-orange/30 p-3 mb-4">
                {selectedTrack.image_url ? (
                  <img src={selectedTrack.image_url} alt="" className="w-12 h-12 object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-border flex items-center justify-center text-xl text-muted-foreground">♪</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{selectedTrack.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedTrack.artist}</p>
                </div>
                <Button
                  onPress={() => setSelectedTrack(null)}
                  className="text-muted-foreground hover:text-punk-red cursor-pointer text-lg"
                >
                  ×
                </Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                  Pick your weapon
                </p>
                <div className="flex flex-col gap-0.5">
                  {recentTracks.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => selectTrack(track)}
                      className="flex items-center gap-3 p-2 hover:bg-card-hover cursor-pointer text-left transition-colors"
                    >
                      {track.album.images?.[2]?.url ? (
                        <img src={track.album.images[2].url} alt="" className="w-8 h-8 object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-border flex items-center justify-center text-muted-foreground text-xs">♪</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{track.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {track.artists.map((a) => a.name).join(", ")}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
