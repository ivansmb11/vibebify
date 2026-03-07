/* eslint-disable @next/next/no-img-element */
"use client";

interface ArtistCardProps {
  rank: number;
  name: string;
  genres: string[];
  imageUrl?: string;
}

const rankColors: Record<number, string> = {
  1: "text-punk-yellow",
  2: "text-punk-cyan",
  3: "text-punk-pink",
};

export function ArtistCard({ rank, name, genres, imageUrl }: ArtistCardProps) {
  const isTop3 = rank <= 3;

  return (
    <div
      className={`
        relative flex flex-col items-center gap-2 p-4
        ${isTop3 ? "bg-card border border-border" : ""}
        group transition-all
      `}
    >
      {/* Rank badge */}
      <span
        className={`
          absolute -top-2 -left-1 font-mono font-bold text-lg
          ${rankColors[rank] ?? "text-muted-foreground"}
          ${isTop3 ? "text-2xl" : "text-base"}
        `}
      >
        #{rank}
      </span>

      {/* Image */}
      <div
        className={`
          relative overflow-hidden
          ${isTop3 ? "w-24 h-24" : "w-16 h-16"}
          rounded-full
          border-2 ${isTop3 ? "border-punk-pink" : "border-border"}
          group-hover:border-punk-cyan transition-colors
        `}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover grayscale-50 group-hover:grayscale-0 transition-all"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-2xl">
            ♫
          </div>
        )}
      </div>

      {/* Info */}
      <div className="text-center">
        <p
          className={`font-bold truncate max-w-[120px] ${isTop3 ? "text-sm" : "text-xs"}`}
        >
          {name}
        </p>
        {genres.length > 0 && (
          <p className="text-[10px] text-muted-foreground truncate max-w-[120px] uppercase tracking-wider">
            {genres.slice(0, 2).join(" / ")}
          </p>
        )}
      </div>
    </div>
  );
}
