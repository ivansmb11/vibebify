"use client";

import { useRef } from "react";
import { Button } from "react-aria-components";
import { haptic } from "@/lib/haptics";

interface GenreDnaCardProps {
  displayName: string;
  avatarUrl?: string;
  genres: { name: string; count: number }[];
  topArtist?: string;
  streak?: number;
}

const GENRE_COLORS: Record<string, string> = {
  pop: "#ff2d7b",
  rock: "#ff6b2b",
  "classic rock": "#ff6b2b",
  "psychedelic rock": "#b44dff",
  "progressive rock": "#b44dff",
  rap: "#f5e642",
  "hip hop": "#f5e642",
  edm: "#00f0ff",
  reggaeton: "#1DB954",
  latin: "#1DB954",
  "latin pop": "#1DB954",
  "corridos tumbados": "#ff6b2b",
  indie: "#b44dff",
  "latin indie": "#b44dff",
  ambient: "#00f0ff",
  soundtrack: "#00f0ff",
  r_b: "#ff2d7b",
  "colombian pop": "#1DB954",
  trap: "#f5e642",
  "trap latino": "#f5e642",
};

function getGenreColor(genre: string): string {
  const lower = genre.toLowerCase();
  if (GENRE_COLORS[lower]) return GENRE_COLORS[lower];
  for (const [key, color] of Object.entries(GENRE_COLORS)) {
    if (lower.includes(key) || key.includes(lower)) return color;
  }
  // Hash-based fallback
  const colors = ["#ff2d7b", "#00f0ff", "#f5e642", "#b44dff", "#ff6b2b", "#1DB954"];
  let hash = 0;
  for (let i = 0; i < genre.length; i++) hash = genre.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function GenreDnaCard({
  displayName,
  avatarUrl,
  genres,
  topArtist,
  streak,
}: GenreDnaCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const totalCount = genres.reduce((sum, g) => sum + g.count, 0);
  const topGenres = genres.slice(0, 8);

  const shareCard = async () => {
    haptic("success");
    if (!cardRef.current) return;

    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0a0a0a",
        scale: 2,
      });
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png")
      );

      if (navigator.share && navigator.canShare({ files: [new File([blob], "dna.png")] })) {
        await navigator.share({
          title: "My Music DNA — Vibebify",
          files: [new File([blob], "vibebify-dna.png", { type: "image/png" })],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "vibebify-dna.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // html2canvas not available, fallback: copy text
      const text = `My Music DNA 🧬\n${topGenres.map((g) => `${g.name}: ${Math.round((g.count / totalCount) * 100)}%`).join("\n")}\n\n— Vibebify`;
      await navigator.clipboard?.writeText(text);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* The card */}
      <div
        ref={cardRef}
        className="bg-card border border-border p-5 relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-punk-pink/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-punk-cyan/5 rounded-full blur-2xl" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 relative z-10">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-10 h-10 rounded-full border border-border"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-punk-purple flex items-center justify-center text-sm font-bold">
              {displayName.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-sm font-bold">{displayName}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
              Music DNA
            </p>
          </div>
          {streak != null && streak > 0 && (
            <span className="ml-auto text-punk-orange text-xs font-bold flex items-center gap-1">
              🔥 {streak}
            </span>
          )}
        </div>

        {/* DNA Strand visualization */}
        <div className="flex gap-1 mb-4 h-8 relative z-10">
          {topGenres.map((genre, i) => {
            const pct = (genre.count / totalCount) * 100;
            const color = getGenreColor(genre.name);
            return (
              <div
                key={genre.name}
                className="relative group h-full"
                style={{
                  width: `${Math.max(pct, 5)}%`,
                  backgroundColor: color,
                  opacity: 1 - i * 0.05,
                }}
                title={`${genre.name}: ${Math.round(pct)}%`}
              >
                {/* Pulse on first */}
                {i === 0 && (
                  <div
                    className="absolute inset-0 animate-pulse"
                    style={{ backgroundColor: color, opacity: 0.3 }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Genre labels */}
        <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
          {topGenres.map((genre) => {
            const pct = Math.round((genre.count / totalCount) * 100);
            const color = getGenreColor(genre.name);
            return (
              <span
                key={genre.name}
                className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
              >
                <span
                  className="w-2 h-2 inline-block -skew-x-6"
                  style={{ backgroundColor: color }}
                />
                <span className="text-foreground/80">{genre.name}</span>
                <span className="text-muted-foreground">{pct}%</span>
              </span>
            );
          })}
        </div>

        {/* Top artist callout */}
        {topArtist && (
          <div className="border-t border-border pt-3 relative z-10">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
              #1 Artist
            </p>
            <p className="text-sm font-bold">{topArtist}</p>
          </div>
        )}

        {/* Watermark */}
        <div className="absolute bottom-2 right-3 z-10">
          <span className="text-[8px] text-muted-foreground/50 uppercase tracking-[0.3em]">
            Vibebify
          </span>
        </div>
      </div>

      {/* Share button */}
      <Button
        onPress={shareCard}
        className="self-center px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-punk-cyan text-punk-cyan -skew-x-3 cursor-pointer hover:bg-punk-cyan/10 transition-colors"
      >
        <span className="skew-x-3 flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Share DNA Card
        </span>
      </Button>
    </div>
  );
}
