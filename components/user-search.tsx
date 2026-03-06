"use client";

import { useState, useCallback, useRef } from "react";
import { TextField, Input, Button } from "react-aria-components";

interface UserResult {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_following: boolean;
}

interface UserSearchProps {
  onSelectUser: (userId: string) => void;
}

export function UserSearch({ onSelectUser }: UserSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/search/users?q=${encodeURIComponent(q)}`
        );
        if (res.ok) {
          setResults(await res.json());
        }
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const toggleFollow = async (userId: string, isFollowing: boolean) => {
    setFollowLoading(userId);
    const method = isFollowing ? "DELETE" : "POST";
    const res = await fetch("/api/follow", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ following_id: userId }),
    });

    if (res.ok || res.status === 409) {
      setResults((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_following: !isFollowing } : u
        )
      );
    }
    setFollowLoading(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="px-4 pt-5 pb-3">
        <TextField
          value={query}
          onChange={(v) => {
            setQuery(v);
            search(v);
          }}
          aria-label="Search users"
        >
          <Input
            placeholder="Search people..."
            className="w-full bg-muted border-2 border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-punk-cyan transition-colors"
            autoFocus
          />
        </TextField>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {searching && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-punk-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!searching && query.length >= 2 && results.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-2">
            <span className="text-3xl">🔍</span>
            <p className="text-sm text-muted-foreground">No users found</p>
          </div>
        )}

        {!searching && query.length < 2 && (
          <div className="flex flex-col items-center py-16 gap-2">
            <span className="text-3xl">👥</span>
            <p className="text-sm text-muted-foreground">
              Type at least 2 characters to search
            </p>
          </div>
        )}

        {results.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-card-hover transition-colors"
          >
            <button
              onClick={() => onSelectUser(user.id)}
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer text-left"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="w-10 h-10 rounded-full border border-border"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-punk-purple flex items-center justify-center text-sm font-bold shrink-0">
                  {user.display_name?.charAt(0) ?? "?"}
                </div>
              )}
              <span className="text-sm font-semibold truncate">
                {user.display_name}
              </span>
            </button>

            <Button
              onPress={() => toggleFollow(user.id, user.is_following)}
              isDisabled={followLoading === user.id}
              className={`
                px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider
                cursor-pointer transition-all -skew-x-3 shrink-0
                ${
                  user.is_following
                    ? "bg-transparent border-2 border-border text-foreground hover:border-punk-red hover:text-punk-red"
                    : "bg-punk-pink text-white border-2 border-punk-pink hover:bg-punk-pink/80"
                }
                disabled:opacity-40
              `}
            >
              <span className="skew-x-3 block">
                {followLoading === user.id
                  ? "..."
                  : user.is_following
                    ? "Following"
                    : "Follow"}
              </span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
