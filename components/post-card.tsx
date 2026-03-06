"use client";

import { useState } from "react";
import { Button } from "react-aria-components";
import { CommentsSheet } from "./comments-sheet";

interface PostProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  song_title: string;
  song_artist: string;
  song_album: string | null;
  song_image_url: string | null;
  spotify_track_id: string | null;
  musicbrainz_id: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: PostProfile;
  liked_by_user: boolean;
}

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onDelete?: (id: string) => void;
}

export function PostCard({ post, currentUserId, onDelete }: PostCardProps) {
  const [liked, setLiked] = useState(post.liked_by_user);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [showComments, setShowComments] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const isOwn = post.user_id === currentUserId;

  const toggleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);

    const method = liked ? "DELETE" : "POST";
    const res = await fetch(`/api/posts/${post.id}/like`, { method });

    if (res.ok || res.status === 409) {
      setLiked(!liked);
      setLikesCount((c) => c + (liked ? -1 : 1));
    }
    setLikeLoading(false);
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) onDelete?.(post.id);
  };

  const timeAgo = getTimeAgo(post.created_at);

  return (
    <article className="border-b border-border px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {post.profiles.avatar_url ? (
          <img
            src={post.profiles.avatar_url}
            alt=""
            className="w-8 h-8 rounded-full border border-border"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-punk-purple flex items-center justify-center text-xs font-bold">
            {post.profiles.display_name?.charAt(0) ?? "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">
            {post.profiles.display_name}
          </p>
          <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
        </div>
        {isOwn && (
          <Button
            onPress={handleDelete}
            className="text-[10px] text-muted-foreground hover:text-punk-red cursor-pointer uppercase tracking-wider"
          >
            Delete
          </Button>
        )}
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed mb-3">{post.content}</p>

      {/* Song card */}
      <div className="flex items-center gap-3 bg-muted border border-border p-3 mb-3">
        {post.song_image_url ? (
          <img
            src={post.song_image_url}
            alt=""
            className="w-12 h-12 object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-border flex items-center justify-center text-muted-foreground text-lg">
            ♪
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{post.song_title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {post.song_artist}
          </p>
          {post.song_album && (
            <p className="text-[10px] text-muted-foreground truncate italic">
              {post.song_album}
            </p>
          )}
        </div>
        {post.spotify_track_id && (
          <a
            href={`https://open.spotify.com/track/${post.spotify_track_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-punk-green hover:scale-110 transition-transform"
          >
            <SpotifySmallIcon />
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6">
        <Button
          onPress={toggleLike}
          className={`
            flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider
            cursor-pointer transition-colors
            ${liked ? "text-punk-pink" : "text-muted-foreground hover:text-punk-pink"}
          `}
        >
          <span className="text-base">{liked ? "♥" : "♡"}</span>
          {likesCount > 0 && likesCount}
        </Button>

        <Button
          onPress={() => setShowComments(true)}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-punk-cyan cursor-pointer transition-colors"
        >
          <span className="text-base">✦</span>
          {commentsCount > 0 && commentsCount}
        </Button>

        {post.musicbrainz_id && (
          <a
            href={`https://musicbrainz.org/recording/${post.musicbrainz_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-muted-foreground hover:text-punk-yellow uppercase tracking-wider ml-auto"
          >
            MusicBrainz ↗
          </a>
        )}
      </div>

      {/* Comments sheet */}
      {showComments && (
        <CommentsSheet
          postId={post.id}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => setCommentsCount((c) => c + 1)}
        />
      )}
    </article>
  );
}

function SpotifySmallIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString();
}
