/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { PunkButton } from "./punk-button";
import { MarqueeBar } from "./marquee-bar";
import { TrackCard } from "./track-card";
import { ArtistCard } from "./artist-card";
import { SectionHeader } from "./section-header";
import { TimeRangeTabs } from "./time-range-tabs";
import { StatBadge } from "./stat-badge";
import { PostCard, type Post } from "./post-card";
import { ComposePost } from "./compose-post";
import { UserSearch } from "./user-search";
import { UserProfile } from "./user-profile";
import { haptic } from "@/lib/haptics";
import { getFeed, getDiscover, getStreak, getDuels } from "@/lib/db";
import { StreakBadge } from "./streak-badge";
import { GenreDnaCard } from "./genre-dna-card";
import { DuelCard, type Duel } from "./duel-card";
import { CreateDuel } from "./create-duel";

interface DashboardProps {
  user: User;
  onSignOut: () => void;
}

interface SpotifyTrack {
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  id: string;
}

interface SpotifyArtist {
  name: string;
  genres: string[];
  images: { url: string }[];
  id: string;
}

type MainTab = "feed" | "discover" | "search" | "duels" | "stats" | "profile";
type StatsTab = "recent" | "artists" | "tracks" | "dna";

export function Dashboard({ user }: DashboardProps) {
  const [recentTracks, setRecentTracks] = useState<[]>([]);
  const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([]);
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
  const [timeRange, setTimeRange] = useState("short_term");
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<MainTab>("feed");
  const [statsTab, setStatsTab] = useState<StatsTab>("recent");

  // Social state
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [discoverPosts, setDiscoverPosts] = useState<Post[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);

  // Streaks
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  // DNA (stable medium_term data, independent of timeRange toggle)
  const [dnaArtists, setDnaArtists] = useState<SpotifyArtist[]>([]);

  // Duels
  const [duels, setDuels] = useState<Duel[]>([]);
  const [duelsLoading, setDuelsLoading] = useState(true);
  const [showCreateDuel, setShowCreateDuel] = useState(false);
  const [acceptingDuelId, setAcceptingDuelId] = useState<string | null>(null);

  // Unique spotify tracks for compose picker (deduplicated)
  const uniqueRecentTracks = recentTracks.reduce(
    (acc: SpotifyTrack[], item: { track: SpotifyTrack }) => {
      if (!acc.find((t) => t.id === item.track.id)) {
        acc.push(item.track);
      }
      return acc;
    },
    [],
  );

  const fetchSpotifyData = useCallback(async () => {
    setLoading(true);
    try {
      const [recentRes, artistsRes, tracksRes] = await Promise.all([
        fetch("/api/spotify/recently-played"),
        fetch(`/api/spotify/top?type=artists&time_range=${timeRange}`),
        fetch(`/api/spotify/top?type=tracks&time_range=${timeRange}`),
      ]);

      if (recentRes.ok) {
        const data = await recentRes.json();
        setRecentTracks(data.items ?? []);
      }
      if (artistsRes.ok) {
        const data = await artistsRes.json();
        setTopArtists(data.items ?? []);
      }
      if (tracksRes.ok) {
        const data = await tracksRes.json();
        setTopTracks(data.items ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch spotify data:", err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const fetchFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const data = await getFeed();
      setFeedPosts((data.posts ?? []) as Post[]);
    } catch {}
    setFeedLoading(false);
  }, []);

  const fetchDiscover = useCallback(async () => {
    try {
      const data = await getDiscover();
      setDiscoverPosts((data.posts ?? []) as Post[]);
    } catch {}
  }, []);

  const fetchStreak = useCallback(async () => {
    try {
      const data = await getStreak(user.id);
      setCurrentStreak(data.current_streak);
      setLongestStreak(data.longest_streak);
    } catch {}
  }, [user.id]);

  const fetchDuels = useCallback(async () => {
    setDuelsLoading(true);
    try {
      setDuels(await getDuels("all"));
    } catch {}
    setDuelsLoading(false);
  }, []);

  const fetchDnaData = useCallback(async () => {
    try {
      const res = await fetch(
        "/api/spotify/top?type=artists&time_range=medium_term",
      );
      if (res.ok) {
        const data = await res.json();
        setDnaArtists(data.items ?? []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchSpotifyData();
    fetchFeed();
    fetchDiscover();
    fetchStreak();
    fetchDuels();
    fetchDnaData();
  }, [
    fetchSpotifyData,
    fetchFeed,
    fetchDiscover,
    fetchStreak,
    fetchDuels,
    fetchDnaData,
  ]);

  const displayName =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? "You";
  const avatarUrl = user.user_metadata?.avatar_url;

  const allGenres = topArtists.flatMap((a) => a.genres);
  const uniqueGenres = [...new Set(allGenres)];
  const topGenre = uniqueGenres[0] ?? "eclectic";

  // Genre counts for DNA card (uses stable medium_term data)
  const dnaGenres = dnaArtists.flatMap((a) => a.genres);
  const dnaGenreCounts = dnaGenres.reduce((acc: Record<string, number>, g) => {
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});
  const sortedGenres = Object.entries(dnaGenreCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }));

  const handleDuelCreated = (duel: Duel) => {
    setDuels((prev) => {
      // Replace existing duel if accepting, otherwise prepend
      const idx = prev.findIndex((d) => d.id === duel.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = duel;
        return updated;
      }
      return [duel, ...prev];
    });
  };

  const handlePostCreated = (post: Post) => {
    setFeedPosts((prev) => [post, ...prev]);
    setDiscoverPosts((prev) => [post, ...prev]);
  };

  const navigateToProfile = (userId: string) => {
    setViewingUserId(userId);
    setMainTab("search");
  };

  const handlePostDeleted = (id: string) => {
    setFeedPosts((prev) => prev.filter((p) => p.id !== id));
    setDiscoverPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-svh flex flex-col pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1
            className="font-display text-lg font-bold tracking-tighter cursor-pointer"
            onClick={() => {
              haptic("light");
              setMainTab("feed");
            }}
          >
            VIBE<span className="text-punk-pink">BIFY</span>
          </h1>

          <div className="flex items-center gap-2">
            {/* Search button */}
            <button
              onClick={() => {
                haptic("light");
                setMainTab("search");
                setViewingUserId(null);
              }}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                mainTab === "search"
                  ? "bg-punk-pink/20 text-punk-pink"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Search users"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Profile avatar */}
            <button
              onClick={() => {
                haptic("light");
                setMainTab("profile");
              }}
              className={`w-8 h-8 rounded-full border-2 transition-colors cursor-pointer overflow-hidden ${
                mainTab === "profile"
                  ? "border-punk-pink"
                  : "border-border hover:border-muted-foreground"
              }`}
              aria-label="Your profile"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-punk-purple flex items-center justify-center text-[10px] font-bold">
                  {displayName.charAt(0)}
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-lg mx-auto w-full">
        {/* Feed tab */}
        {mainTab === "feed" && (
          <>
            {/* Profile banner */}
            <section className="px-4 pt-5 pb-3">
              <div className="flex items-center gap-4 mb-4">
                {avatarUrl ? (
                  <div className="relative pulse-ring rounded-full">
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-14 h-14 rounded-full border-2 border-punk-pink object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-punk-pink flex items-center justify-center text-xl font-bold">
                    {displayName.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
                    Your feed
                  </p>
                  <h2 className="font-display text-xl font-bold tracking-tight">
                    {displayName}
                  </h2>
                </div>
                {currentStreak > 0 && (
                  <StreakBadge
                    currentStreak={currentStreak}
                    longestStreak={longestStreak}
                  />
                )}
              </div>

              {/* Compose CTA */}
              <button
                onClick={() => setShowCompose(true)}
                className="w-full flex items-center gap-3 bg-card border border-border p-3 hover:border-punk-pink/50 transition-colors cursor-pointer text-left"
              >
                <div className="w-8 h-8 bg-punk-pink/20 flex items-center justify-center text-punk-pink font-bold text-lg -skew-x-3">
                  <span className="skew-x-3">+</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Share what you&apos;re listening to...
                </span>
              </button>
            </section>

            {/* Genre marquee */}
            {uniqueGenres.length > 0 && (
              <MarqueeBar
                items={uniqueGenres.slice(0, 10).map((g) => g.toUpperCase())}
                bgColor="bg-punk-yellow"
                color="text-background"
                speed="normal"
              />
            )}

            {/* Feed posts */}
            <section>
              {feedLoading ? (
                <LoadingSpinner label="Loading feed..." />
              ) : feedPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
                  <span className="text-4xl">📡</span>
                  <p className="text-sm text-muted-foreground text-center">
                    Your feed is empty. Share a song or discover posts from
                    others!
                  </p>
                  <PunkButton
                    variant="outline"
                    size="sm"
                    onPress={() => setMainTab("discover")}
                  >
                    Explore
                  </PunkButton>
                </div>
              ) : (
                feedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user.id}
                    onDelete={handlePostDeleted}
                    onViewProfile={navigateToProfile}
                  />
                ))
              )}
            </section>
          </>
        )}

        {/* Discover tab */}
        {mainTab === "discover" && (
          <section>
            <div className="px-4 pt-5 pb-3">
              <SectionHeader
                title="Discover"
                subtitle="See what everyone's playing"
                accent="bg-punk-cyan"
              />
            </div>

            {discoverPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
                <span className="text-4xl">🌍</span>
                <p className="text-sm text-muted-foreground">
                  No posts yet. Be the first to share!
                </p>
              </div>
            ) : (
              discoverPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user.id}
                  onDelete={handlePostDeleted}
                  onViewProfile={navigateToProfile}
                />
              ))
            )}
          </section>
        )}

        {/* Search tab */}
        {mainTab === "search" && !viewingUserId && (
          <UserSearch onSelectUser={(id) => setViewingUserId(id)} />
        )}

        {/* User profile overlay */}
        {mainTab === "search" && viewingUserId && (
          <UserProfile
            userId={viewingUserId}
            currentUserId={user.id}
            onBack={() => setViewingUserId(null)}
            onViewProfile={(id) => setViewingUserId(id)}
          />
        )}

        {/* Stats tab */}
        {mainTab === "stats" && (
          <>
            {/* Stats badges */}
            <section className="px-4 pt-5 pb-3">
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
                <StatBadge
                  label="Top Genre"
                  value={topGenre}
                  color="border-punk-pink"
                />
                <StatBadge
                  label="Artists"
                  value={topArtists.length}
                  color="border-punk-cyan"
                />
                <StatBadge
                  label="Genres"
                  value={uniqueGenres.length}
                  color="border-punk-yellow"
                />
              </div>
            </section>

            {/* Stats sub-tabs */}
            <nav className="border-b border-border">
              <div className="flex max-w-lg mx-auto">
                {(["recent", "artists", "tracks", "dna"] as const).map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setStatsTab(tab)}
                      className={`
                      flex-1 py-3 text-xs font-bold uppercase tracking-[0.15em] text-center
                      transition-colors cursor-pointer border-b-2
                      ${
                        statsTab === tab
                          ? "border-punk-pink text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }
                    `}
                    >
                      {tab === "recent"
                        ? "Recent"
                        : tab === "artists"
                          ? "Artists"
                          : tab === "tracks"
                            ? "Tracks"
                            : "DNA"}
                    </button>
                  ),
                )}
              </div>
            </nav>

            <div className="px-4 py-5">
              {loading ? (
                <LoadingSpinner label="Fetching your vibes..." />
              ) : (
                <>
                  {statsTab === "recent" && (
                    <section>
                      <SectionHeader
                        title="Recently Played"
                        subtitle="What you've been bumping"
                        accent="bg-punk-cyan"
                      />
                      <div className="flex flex-col gap-0.5">
                        {recentTracks.map(
                          (item: {
                            track: SpotifyTrack;
                            played_at: string;
                          }) => (
                            <TrackCard
                              key={`${item.track.id}-${item.played_at}`}
                              name={item.track.name}
                              artist={item.track.artists
                                .map((a: { name: string }) => a.name)
                                .join(", ")}
                              imageUrl={item.track.album.images?.[2]?.url}
                              playedAt={item.played_at}
                            />
                          ),
                        )}
                        {recentTracks.length === 0 && (
                          <EmptyState message="No recent tracks found." />
                        )}
                      </div>
                    </section>
                  )}

                  {statsTab === "artists" && (
                    <section>
                      <SectionHeader
                        title="Top Artists"
                        subtitle="Your most played"
                        accent="bg-punk-yellow"
                      />
                      <TimeRangeTabs
                        selectedRange={timeRange}
                        onSelectionChange={setTimeRange}
                      >
                        {topArtists.length >= 3 && (
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            {topArtists.slice(0, 3).map((artist, i) => (
                              <ArtistCard
                                key={artist.id}
                                rank={i + 1}
                                name={artist.name}
                                genres={artist.genres}
                                imageUrl={artist.images?.[1]?.url}
                              />
                            ))}
                          </div>
                        )}
                        <div className="flex flex-col gap-0.5">
                          {topArtists.slice(3).map((artist, i) => (
                            <TrackCard
                              key={artist.id}
                              rank={i + 4}
                              name={artist.name}
                              artist={
                                artist.genres.slice(0, 2).join(", ") || "N/A"
                              }
                              imageUrl={artist.images?.[2]?.url}
                            />
                          ))}
                        </div>
                        {topArtists.length === 0 && (
                          <EmptyState message="No top artists found yet." />
                        )}
                      </TimeRangeTabs>
                    </section>
                  )}

                  {statsTab === "tracks" && (
                    <section>
                      <SectionHeader
                        title="Top Tracks"
                        subtitle="Your anthems"
                        accent="bg-punk-purple"
                      />
                      <TimeRangeTabs
                        selectedRange={timeRange}
                        onSelectionChange={setTimeRange}
                      >
                        <div className="flex flex-col gap-0.5">
                          {topTracks.map((track, i) => (
                            <TrackCard
                              key={track.id}
                              rank={i + 1}
                              name={track.name}
                              artist={track.artists
                                .map((a: { name: string }) => a.name)
                                .join(", ")}
                              imageUrl={track.album.images?.[2]?.url}
                            />
                          ))}
                        </div>
                        {topTracks.length === 0 && (
                          <EmptyState message="No top tracks found yet." />
                        )}
                      </TimeRangeTabs>
                    </section>
                  )}

                  {statsTab === "dna" && (
                    <section>
                      {sortedGenres.length > 0 ? (
                        <GenreDnaCard
                          displayName={displayName}
                          avatarUrl={avatarUrl}
                          genres={sortedGenres}
                          topArtists={dnaArtists.slice(0, 3).map((a) => a.name)}
                          streak={currentStreak}
                        />
                      ) : (
                        <EmptyState message="Listen to more music to build your DNA profile." />
                      )}
                    </section>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* Duels tab */}
        {mainTab === "duels" && (
          <section>
            <div className="px-4 pt-5 pb-3 flex items-center justify-between">
              <SectionHeader
                title="Song Duels"
                subtitle="Pick your weapon"
                accent="bg-punk-orange"
              />
              <PunkButton
                variant="primary"
                size="sm"
                onPress={() => {
                  haptic("medium");
                  setAcceptingDuelId(null);
                  setShowCreateDuel(true);
                }}
              >
                New Duel
              </PunkButton>
            </div>

            {duelsLoading ? (
              <LoadingSpinner label="Loading duels..." />
            ) : duels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
                <span className="text-4xl">🎯</span>
                <p className="text-sm text-muted-foreground text-center">
                  No duels yet. Start a song battle!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 px-4 pb-4">
                {duels.map((duel) => (
                  <DuelCard
                    key={duel.id}
                    duel={duel}
                    currentUserId={user.id}
                    onAccept={(duelId) => {
                      setAcceptingDuelId(duelId);
                      setShowCreateDuel(true);
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Profile tab (own profile) */}
        {mainTab === "profile" && (
          <UserProfile
            userId={user.id}
            currentUserId={user.id}
            onBack={() => setMainTab("feed")}
            onViewProfile={navigateToProfile}
          />
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-t border-border">
        <div className="flex max-w-lg mx-auto">
          <BottomTab
            icon="⚡"
            label="Feed"
            active={mainTab === "feed"}
            onClick={() => {
              haptic("light");
              setMainTab("feed");
            }}
          />
          <BottomTab
            icon="🌍"
            label="Discover"
            active={mainTab === "discover"}
            onClick={() => {
              haptic("light");
              setMainTab("discover");
            }}
          />
          {/* Center compose button */}
          <div className="flex items-center justify-center px-2">
            <button
              onClick={() => {
                haptic("medium");
                setShowCompose(true);
              }}
              className="w-12 h-12 bg-punk-pink text-white flex items-center justify-center text-2xl font-bold -skew-x-3 hover:bg-punk-pink/80 transition-colors cursor-pointer -translate-y-3 shadow-[4px_4px_0px_0px_rgba(255,45,123,0.3)]"
            >
              <span className="skew-x-3">+</span>
            </button>
          </div>
          <BottomTab
            icon="🎯"
            label="Duels"
            active={mainTab === "duels"}
            onClick={() => {
              haptic("light");
              setMainTab("duels");
            }}
          />
          <BottomTab
            icon="📊"
            label="Stats"
            active={mainTab === "stats"}
            onClick={() => {
              haptic("light");
              setMainTab("stats");
            }}
          />
        </div>
      </nav>

      {/* Compose modal */}
      <ComposePost
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        onPostCreated={(post) => {
          handlePostCreated(post);
          fetchStreak();
        }}
        recentTracks={uniqueRecentTracks}
      />

      {/* Create/Accept Duel modal */}
      <CreateDuel
        isOpen={showCreateDuel}
        onClose={() => {
          setShowCreateDuel(false);
          setAcceptingDuelId(null);
        }}
        onCreated={handleDuelCreated}
        recentTracks={uniqueRecentTracks}
        acceptingDuelId={acceptingDuelId}
      />
    </div>
  );
}

function BottomTab({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex flex-col items-center justify-center py-2 gap-0.5
        cursor-pointer transition-colors
        ${active ? "text-punk-pink" : "text-muted-foreground hover:text-foreground"}
      `}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-[9px] font-bold uppercase tracking-wider">
        {label}
      </span>
    </button>
  );
}

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-8 h-8 border-2 border-punk-pink border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
        {label}
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <span className="text-4xl">🎸</span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
