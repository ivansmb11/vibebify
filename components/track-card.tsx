/* eslint-disable @next/next/no-img-element */
"use client";

interface TrackCardProps {
  rank?: number;
  name: string;
  artist: string;
  imageUrl?: string;
  playedAt?: string;
  accentColor?: string;
}

const accents = [
  "border-l-punk-pink",
  "border-l-punk-cyan",
  "border-l-punk-yellow",
  "border-l-punk-purple",
  "border-l-punk-orange",
];

export function TrackCard({
  rank,
  name,
  artist,
  imageUrl,
  playedAt,
  accentColor,
}: TrackCardProps) {
  const borderClass = accentColor ?? accents[(rank ?? 0) % accents.length];

  return (
    <div
      className={`
        group flex items-center gap-3 p-3
        bg-card border-l-4 ${borderClass}
        hover:bg-card-hover transition-colors
        cursor-default
      `}
    >
      {rank != null && (
        <span className="font-mono text-xs text-muted-foreground w-6 text-right tabular-nums">
          {String(rank).padStart(2, "0")}
        </span>
      )}

      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="w-10 h-10 object-cover grayscale group-hover:grayscale-0 transition-all"
        />
      ) : (
        <div className="w-10 h-10 bg-border flex items-center justify-center text-muted-foreground text-xs">
          ♪
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{artist}</p>
      </div>

      {playedAt && (
        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
          {new Date(playedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      )}
    </div>
  );
}
