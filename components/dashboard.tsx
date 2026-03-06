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

type MainTab = "feed" | "discover" | "stats";
type StatsTab = "recent" | "artists" | "tracks";

export function Dashboard({ user, onSignOut }: DashboardProps) {
  const [recentTracks, setRecentTracks] = useState<any[]>([]);
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

  // Unique spotify tracks for compose picker (deduplicated)
  const uniqueRecentTracks = recentTracks.reduce(
    (acc: SpotifyTrack[], item: any) => {
      if (!acc.find((t) => t.id === item.track.id)) {
        acc.push(item.track);
      }
      return acc;
    },
    []
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
      const res = await fetch("/api/feed");
      if (res.ok) {
        const data = await res.json();
        setFeedPosts(data.posts ?? []);
      }
    } finally {
      setFeedLoading(false);
    }
  }, []);

  const fetchDiscover = useCallback(async () => {
    try {
      const res = await fetch("/api/discover");
      if (res.ok) {
        const data = await res.json();
        setDiscoverPosts(data.posts ?? []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchSpotifyData();
    fetchFeed();
    fetchDiscover();
  }, [fetchSpotifyData, fetchFeed, fetchDiscover]);

  const displayName =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? "You";
  const avatarUrl = user.user_metadata?.avatar_url;

  const allGenres = topArtists.flatMap((a) => a.genres);
  const uniqueGenres = [...new Set(allGenres)];
  const topGenre = uniqueGenres[0] ?? "eclectic";

  const handlePostCreated = (post: Post) => {
    setFeedPosts((prev) => [post, ...prev]);
    setDiscoverPosts((prev) => [post, ...prev]);
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
          <h1 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tighter">
            VIBE<span className="text-punk-pink">BIFY</span>
          </h1>

          <div className="flex items-center gap-3">
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-7 h-7 rounded-full border border-border"
              />
            )}
            <PunkButton variant="ghost" size="sm" onPress={onSignOut}>
              Exit
            </PunkButton>
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
                  <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
                    {displayName}
                  </h2>
                </div>
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
                />
              ))
            )}
          </section>
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
                {(["recent", "artists", "tracks"] as const).map((tab) => (
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
                        ? "Top Artists"
                        : "Top Tracks"}
                  </button>
                ))}
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
                        {recentTracks.map((item: any) => (
                          <TrackCard
                            key={`${item.track.id}-${item.played_at}`}
                            name={item.track.name}
                            artist={item.track.artists
                              .map((a: any) => a.name)
                              .join(", ")}
                            imageUrl={item.track.album.images?.[2]?.url}
                            playedAt={item.played_at}
                          />
                        ))}
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
                                .map((a: any) => a.name)
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
                </>
              )}
            </div>
          </>
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-md border-t border-border">
        <div className="flex max-w-lg mx-auto">
          <BottomTab
            icon="⚡"
            label="Feed"
            active={mainTab === "feed"}
            onClick={() => setMainTab("feed")}
          />
          <BottomTab
            icon="🌍"
            label="Discover"
            active={mainTab === "discover"}
            onClick={() => setMainTab("discover")}
          />
          {/* Center compose button */}
          <div className="flex items-center justify-center px-2">
            <button
              onClick={() => setShowCompose(true)}
              className="w-12 h-12 bg-punk-pink text-white flex items-center justify-center text-2xl font-bold -skew-x-3 hover:bg-punk-pink/80 transition-colors cursor-pointer -translate-y-3 shadow-[4px_4px_0px_0px_rgba(255,45,123,0.3)]"
            >
              <span className="skew-x-3">+</span>
            </button>
          </div>
          <BottomTab
            icon="📊"
            label="Stats"
            active={mainTab === "stats"}
            onClick={() => setMainTab("stats")}
          />
          <BottomTab
            icon="👤"
            label="Profile"
            active={false}
            onClick={() => {}}
          />
        </div>
      </nav>

      {/* Compose modal */}
      <ComposePost
        isOpen={showCompose}
        onClose={() => setShowCompose(false)}
        onPostCreated={handlePostCreated}
        recentTracks={uniqueRecentTracks}
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
