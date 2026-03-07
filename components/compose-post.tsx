/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  Modal,
  ModalOverlay,
  TextField,
  Input,
  TextArea,
  Button,
} from "react-aria-components";
import { haptic } from "@/lib/haptics";
import { createPost } from "@/lib/db";
import type { Post } from "./post-card";

interface SongResult {
  musicbrainz_id: string;
  title: string;
  artist: string;
  album: string | null;
}

interface SpotifyTrack {
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  id: string;
}

interface ComposePostProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: Post) => void;
  recentTracks?: SpotifyTrack[];
}

export function ComposePost({
  isOpen,
  onClose,
  onPostCreated,
  recentTracks = [],
}: ComposePostProps) {
  const [content, setContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SongResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedSong, setSelectedSong] = useState<{
    title: string;
    artist: string;
    album?: string;
    image_url?: string;
    spotify_track_id?: string;
    musicbrainz_id?: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"recent" | "search">("recent");

  const searchMusic = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/search/music?q=${encodeURIComponent(q)}`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } finally {
      setSearching(false);
    }
  }, []);

  const selectSpotifyTrack = (track: SpotifyTrack) => {
    haptic("light");
    setSelectedSong({
      title: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      album: track.album.name,
      image_url: track.album.images?.[1]?.url,
      spotify_track_id: track.id,
    });
  };

  const selectMBResult = (result: SongResult) => {
    haptic("light");
    setSelectedSong({
      title: result.title,
      artist: result.artist,
      album: result.album ?? undefined,
      musicbrainz_id: result.musicbrainz_id,
    });
    setSearchResults([]);
    setSearchQuery("");
  };

  const submit = async () => {
    if (!content.trim() || !selectedSong || submitting) return;
    haptic("medium");
    setSubmitting(true);
    try {
      const post = await createPost({
        content: content.trim(),
        song_title: selectedSong.title,
        song_artist: selectedSong.artist,
        song_album: selectedSong.album,
        song_image_url: selectedSong.image_url,
        spotify_track_id: selectedSong.spotify_track_id,
        musicbrainz_id: selectedSong.musicbrainz_id,
      });
      onPostCreated({ ...post, liked_by_user: false, likes_count: 0, comments_count: 0 });
      setContent("");
      setSelectedSong(null);
      onClose();
    } catch {}
    setSubmitting(false);
  };

  const reset = () => {
    setContent("");
    setSelectedSong(null);
    setSearchQuery("");
    setSearchResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => !open && reset()}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
    >
      <Modal className="w-full max-w-lg max-h-[90vh] bg-background border-t sm:border border-border flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden">
        <Dialog className="flex flex-col flex-1 outline-none overflow-hidden">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-border rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <Button
              onPress={reset}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </Button>
            <h3 className="text-sm font-bold uppercase tracking-wider">
              New Post
            </h3>
            <Button
              onPress={submit}
              isDisabled={!content.trim() || !selectedSong || submitting}
              className="bg-punk-pink text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-punk-pink/80 disabled:opacity-40 disabled:cursor-default -skew-x-3"
            >
              <span className="skew-x-3 block">
                {submitting ? "..." : "Post"}
              </span>
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Text area */}
            <div className="px-4 pt-4">
              <TextField
                value={content}
                onChange={setContent}
                aria-label="What's on your mind?"
              >
                <TextArea
                  placeholder="What's this song making you feel? 🎸"
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none min-h-[80px]"
                  rows={3}
                />
              </TextField>
              <div className="text-right">
                <span
                  className={`text-[10px] font-mono ${content.length > 500 ? "text-punk-red" : "text-muted-foreground"}`}
                >
                  {content.length}/500
                </span>
              </div>
            </div>

            {/* Selected song */}
            {selectedSong && (
              <div className="mx-4 mb-4 flex items-center gap-3 bg-muted border border-punk-pink/30 p-3">
                {selectedSong.image_url ? (
                  <img
                    src={selectedSong.image_url}
                    alt=""
                    className="w-10 h-10 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-border flex items-center justify-center text-muted-foreground">
                    ♪
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">
                    {selectedSong.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedSong.artist}
                  </p>
                </div>
                <Button
                  onPress={() => setSelectedSong(null)}
                  className="text-muted-foreground hover:text-punk-red cursor-pointer text-lg"
                >
                  ×
                </Button>
              </div>
            )}

            {/* Song picker */}
            {!selectedSong && (
              <div className="px-4 pb-4">
                <div className="border-t border-border pt-4">
                  {/* Mode toggle */}
                  <div className="flex gap-1 mb-3 bg-muted p-1 w-fit">
                    <button
                      onClick={() => setMode("recent")}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                        mode === "recent"
                          ? "bg-punk-cyan text-background -skew-x-3"
                          : "text-muted-foreground"
                      }`}
                    >
                      Recent
                    </button>
                    <button
                      onClick={() => setMode("search")}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                        mode === "search"
                          ? "bg-punk-cyan text-background -skew-x-3"
                          : "text-muted-foreground"
                      }`}
                    >
                      Search MusicBrainz
                    </button>
                  </div>

                  {mode === "search" && (
                    <>
                      <TextField
                        value={searchQuery}
                        onChange={(v) => {
                          setSearchQuery(v);
                          searchMusic(v);
                        }}
                        aria-label="Search for a song"
                      >
                        <Input
                          placeholder="Search songs..."
                          className="w-full bg-muted border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-punk-cyan mb-2"
                        />
                      </TextField>

                      {searching && (
                        <div className="flex justify-center py-4">
                          <div className="w-4 h-4 border-2 border-punk-cyan border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}

                      <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                        {searchResults.map((r) => (
                          <button
                            key={r.musicbrainz_id}
                            onClick={() => selectMBResult(r)}
                            className="flex items-center gap-3 p-2 hover:bg-card-hover cursor-pointer text-left transition-colors"
                          >
                            <div className="w-8 h-8 bg-border flex items-center justify-center text-muted-foreground text-xs shrink-0">
                              ♪
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">
                                {r.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {r.artist}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {mode === "recent" && (
                    <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto">
                      {recentTracks.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">
                          No recent tracks loaded
                        </p>
                      ) : (
                        recentTracks.map((track) => (
                          <button
                            key={track.id}
                            onClick={() => selectSpotifyTrack(track)}
                            className="flex items-center gap-3 p-2 hover:bg-card-hover cursor-pointer text-left transition-colors"
                          >
                            {track.album.images?.[2]?.url ? (
                              <img
                                src={track.album.images[2].url}
                                alt=""
                                className="w-8 h-8 object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-border flex items-center justify-center text-muted-foreground text-xs">
                                ♪
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">
                                {track.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {track.artists
                                  .map((a) => a.name)
                                  .join(", ")}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
