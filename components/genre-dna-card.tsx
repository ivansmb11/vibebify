"use client";

import { useState } from "react";
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
  const colors = ["#ff2d7b", "#00f0ff", "#f5e642", "#b44dff", "#ff6b2b", "#1DB954"];
  let hash = 0;
  for (let i = 0; i < genre.length; i++) hash = genre.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// Instagram story: 1080x1920
const W = 1080;
const H = 1920;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function generateStoryImage(
  displayName: string,
  avatarUrl: string | undefined,
  genres: { name: string; count: number }[],
  topArtist: string | undefined,
  streak: number | undefined,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background — dark with noise-like grain
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);

  // Decorative glow blobs
  const gradient1 = ctx.createRadialGradient(W * 0.8, H * 0.15, 0, W * 0.8, H * 0.15, 400);
  gradient1.addColorStop(0, "rgba(255, 45, 123, 0.15)");
  gradient1.addColorStop(1, "rgba(255, 45, 123, 0)");
  ctx.fillStyle = gradient1;
  ctx.fillRect(0, 0, W, H);

  const gradient2 = ctx.createRadialGradient(W * 0.2, H * 0.85, 0, W * 0.2, H * 0.85, 400);
  gradient2.addColorStop(0, "rgba(0, 240, 255, 0.12)");
  gradient2.addColorStop(1, "rgba(0, 240, 255, 0)");
  ctx.fillStyle = gradient2;
  ctx.fillRect(0, 0, W, H);

  const gradient3 = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, 500);
  gradient3.addColorStop(0, "rgba(180, 77, 255, 0.08)");
  gradient3.addColorStop(1, "rgba(180, 77, 255, 0)");
  ctx.fillStyle = gradient3;
  ctx.fillRect(0, 0, W, H);

  // Subtle diagonal lines pattern
  ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
  ctx.lineWidth = 1;
  for (let i = -H; i < W + H; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }

  const pad = 80;
  let y = 120;

  // ── VIBEBIFY Logo ──
  ctx.save();
  ctx.font = "bold 72px system-ui, -apple-system, sans-serif";
  ctx.letterSpacing = "-2px";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("VIBE", pad, y);
  const vibeW = ctx.measureText("VIBE").width;
  ctx.fillStyle = "#ff2d7b";
  ctx.fillText("BIFY", pad + vibeW, y);
  ctx.restore();

  // Accent bar under logo
  ctx.fillStyle = "#ff2d7b";
  y += 16;
  ctx.save();
  ctx.transform(1, 0, -0.15, 1, 0, 0); // skew
  ctx.fillRect(pad, y, 160, 6);
  ctx.restore();

  y += 80;

  // ── Avatar + Name ──
  const avatarSize = 100;
  if (avatarUrl) {
    try {
      const img = await loadImage(avatarUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(pad + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, pad, y, avatarSize, avatarSize);
      ctx.restore();
      // Border
      ctx.strokeStyle = "#ff2d7b";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(pad + avatarSize / 2, y + avatarSize / 2, avatarSize / 2 + 2, 0, Math.PI * 2);
      ctx.stroke();
    } catch {
      // fallback circle
      ctx.fillStyle = "#b44dff";
      ctx.beginPath();
      ctx.arc(pad + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 48px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(displayName.charAt(0), pad + avatarSize / 2, y + avatarSize / 2 + 16);
      ctx.textAlign = "left";
    }
  } else {
    ctx.fillStyle = "#b44dff";
    ctx.beginPath();
    ctx.arc(pad + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 48px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(displayName.charAt(0), pad + avatarSize / 2, y + avatarSize / 2 + 16);
    ctx.textAlign = "left";
  }

  // Name next to avatar
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 52px system-ui, -apple-system, sans-serif";
  ctx.fillText(displayName, pad + avatarSize + 28, y + 45);

  // "Music DNA" label
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
  ctx.letterSpacing = "6px";
  ctx.fillText("MUSIC DNA", pad + avatarSize + 28, y + 80);
  ctx.letterSpacing = "0px";

  // Streak badge
  if (streak && streak > 0) {
    const streakX = W - pad - 120;
    ctx.fillStyle = streak >= 30 ? "#b44dff" : streak >= 7 ? "#00f0ff" : "#ff6b2b";
    ctx.font = "bold 40px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`🔥 ${streak}`, streakX + 120, y + 55);
    ctx.textAlign = "left";
  }

  y += avatarSize + 70;

  // ── DNA Bar visualization ──
  const totalCount = genres.reduce((sum, g) => sum + g.count, 0);
  const topGenres = genres.slice(0, 8);

  const barH = 60;
  const barGap = 6;
  let barX = pad;
  const barW = W - pad * 2;

  for (let i = 0; i < topGenres.length; i++) {
    const genre = topGenres[i];
    const pct = genre.count / totalCount;
    const segW = Math.max(pct * barW, barW * 0.04);
    const color = getGenreColor(genre.name);

    ctx.fillStyle = color;
    ctx.globalAlpha = 1 - i * 0.04;
    ctx.fillRect(barX, y, segW - barGap, barH);
    ctx.globalAlpha = 1;
    barX += segW;
  }

  y += barH + 50;

  // ── Genre breakdown ──
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
  ctx.letterSpacing = "5px";
  ctx.fillText("GENRE BREAKDOWN", pad, y);
  ctx.letterSpacing = "0px";
  y += 44;

  for (let i = 0; i < topGenres.length; i++) {
    const genre = topGenres[i];
    const pct = Math.round((genre.count / totalCount) * 100);
    const color = getGenreColor(genre.name);

    // Color swatch (skewed parallelogram)
    ctx.save();
    ctx.transform(1, 0, -0.2, 1, 0, 0);
    ctx.fillStyle = color;
    ctx.fillRect(pad + 10, y - 22, 20, 28);
    ctx.restore();

    // Genre name
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "bold 34px system-ui, -apple-system, sans-serif";
    ctx.fillText(genre.name.toUpperCase(), pad + 50, y);

    // Percentage
    ctx.fillStyle = color;
    ctx.font = "bold 34px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${pct}%`, W - pad, y);
    ctx.textAlign = "left";

    // Subtle bar behind
    const rowBarW = W - pad * 2 - 50;
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(pad + 50, y + 10, rowBarW, 4);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(pad + 50, y + 10, rowBarW * (pct / 100), 4);
    ctx.globalAlpha = 1;

    y += 66;
  }

  y += 20;

  // ── Top Artist ──
  if (topArtist) {
    // Divider line
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(W - pad, y);
    ctx.stroke();
    y += 44;

    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
    ctx.letterSpacing = "5px";
    ctx.fillText("#1 ARTIST", pad, y);
    ctx.letterSpacing = "0px";
    y += 48;

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px system-ui, -apple-system, sans-serif";
    ctx.fillText(topArtist, pad, y);
  }

  // ── Bottom watermark area ──
  const bottomY = H - 100;

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, bottomY - 30);
  ctx.lineTo(W - pad, bottomY - 30);
  ctx.stroke();

  // @ivannsmb handle
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
  ctx.fillText("@ivannsmb", pad, bottomY + 10);

  // URL on the right
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.font = "22px system-ui, -apple-system, sans-serif";
  ctx.fillText("vibebify.ivanmendoza.dev", W - pad, bottomY + 10);
  ctx.textAlign = "left";

  // Mini logo bottom center
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText("VIBEBIFY", W / 2, bottomY + 55);
  ctx.letterSpacing = "0px";
  ctx.textAlign = "left";

  return new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/png")
  );
}

export function GenreDnaCard({
  displayName,
  avatarUrl,
  genres,
  topArtist,
  streak,
}: GenreDnaCardProps) {
  const [sharing, setSharing] = useState(false);

  const totalCount = genres.reduce((sum, g) => sum + g.count, 0);
  const topGenres = genres.slice(0, 8);

  const shareCard = async () => {
    haptic("success");
    setSharing(true);

    try {
      const blob = await generateStoryImage(displayName, avatarUrl, genres, topArtist, streak);

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
      const text = `My Music DNA 🧬\n${topGenres.map((g) => `${g.name}: ${Math.round((g.count / totalCount) * 100)}%`).join("\n")}\n\nvibebify.ivanmendoza.dev`;
      await navigator.clipboard?.writeText(text);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Preview card (in-page) */}
      <div className="bg-card border border-border p-5 relative overflow-hidden">
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
        isDisabled={sharing}
        className="self-center px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-punk-cyan text-punk-cyan -skew-x-3 cursor-pointer hover:bg-punk-cyan/10 transition-colors disabled:opacity-40"
      >
        <span className="skew-x-3 flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          {sharing ? "Generating..." : "Share DNA Card"}
        </span>
      </Button>
    </div>
  );
}
