"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "react-aria-components";
import { PostCard, type Post } from "./post-card";
import { StatBadge } from "./stat-badge";

interface ProfileData {
  id: string;
  display_name: string;
  avatar_url: string | null;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  is_self: boolean;
}

interface UserProfileProps {
  userId: string;
  currentUserId: string;
  onBack: () => void;
  onViewProfile?: (userId: string) => void;
}

export function UserProfile({
  userId,
  currentUserId,
  onBack,
  onViewProfile,
}: UserProfileProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, postsRes] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch(`/api/users/${userId}/posts`),
      ]);

      if (profileRes.ok) setProfile(await profileRes.json());
      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.posts ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const toggleFollow = async () => {
    if (!profile || followLoading) return;
    setFollowLoading(true);

    const method = profile.is_following ? "DELETE" : "POST";
    const res = await fetch("/api/follow", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ following_id: userId }),
    });

    if (res.ok || res.status === 409) {
      setProfile((p) =>
        p
          ? {
              ...p,
              is_following: !p.is_following,
              followers_count: p.followers_count + (p.is_following ? -1 : 1),
            }
          : p
      );
    }
    setFollowLoading(false);
  };

  const handlePostDeleted = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-2 border-punk-pink border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">
          Loading profile...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-3xl">👻</span>
        <p className="text-sm text-muted-foreground">User not found</p>
        <Button
          onPress={onBack}
          className="text-xs text-punk-cyan hover:underline cursor-pointer"
        >
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Back button */}
      <div className="px-4 pt-4">
        <Button
          onPress={onBack}
          className="text-xs text-muted-foreground hover:text-foreground cursor-pointer uppercase tracking-wider flex items-center gap-1"
        >
          ← Back
        </Button>
      </div>

      {/* Profile header */}
      <section className="px-4 pt-4 pb-5 border-b border-border">
        <div className="flex items-center gap-4 mb-5">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="w-20 h-20 rounded-full border-2 border-punk-pink object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-punk-purple flex items-center justify-center text-3xl font-bold">
              {profile.display_name?.charAt(0) ?? "?"}
            </div>
          )}

          <div className="flex-1">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight mb-3">
              {profile.display_name}
            </h2>

            {!profile.is_self && (
              <Button
                onPress={toggleFollow}
                isDisabled={followLoading}
                className={`
                  px-4 py-2 text-xs font-bold uppercase tracking-wider
                  cursor-pointer transition-all -skew-x-3
                  ${
                    profile.is_following
                      ? "bg-transparent border-2 border-border text-foreground hover:border-punk-red hover:text-punk-red"
                      : "bg-punk-pink text-white border-2 border-punk-pink hover:bg-punk-pink/80"
                  }
                  disabled:opacity-40
                `}
              >
                <span className="skew-x-3 block">
                  {followLoading
                    ? "..."
                    : profile.is_following
                      ? "Following"
                      : "Follow"}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <StatBadge
            label="Followers"
            value={profile.followers_count}
            color="border-punk-pink"
          />
          <StatBadge
            label="Following"
            value={profile.following_count}
            color="border-punk-cyan"
          />
          <StatBadge
            label="Posts"
            value={posts.length}
            color="border-punk-yellow"
          />
        </div>
      </section>

      {/* User's posts */}
      <section>
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-3xl">🎵</span>
            <p className="text-sm text-muted-foreground">
              No posts yet
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onDelete={handlePostDeleted}
              onViewProfile={onViewProfile}
            />
          ))
        )}
      </section>
    </div>
  );
}
