"use client";

import { useState, useEffect } from "react";
import { Button } from "react-aria-components";
import { haptic } from "@/lib/haptics";

interface GenreDnaCardProps {
  displayName: string;
  avatarUrl?: string;
  genres: { name: string; count: number }[];
  topArtists?: string[];
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

// ─── Story image generation (1080x1920) ───

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

function drawPieChart(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  outerR: number, innerR: number,
  genres: { name: string; count: number }[],
  totalCount: number,
) {
  let startAngle = -Math.PI / 2;
  for (let i = 0; i < genres.length; i++) {
    const genre = genres[i];
    const sliceAngle = (genre.count / totalCount) * Math.PI * 2;
    const color = getGenreColor(genre.name);

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
    ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.globalAlpha = 1 - i * 0.03;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#0a0a0a";
    ctx.lineWidth = 3;
    ctx.stroke();
    startAngle += sliceAngle;
  }
}

async function drawAvatarCenter(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number,
  avatarUrl: string | undefined, displayName: string,
) {
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
  ctx.fillStyle = "#0a0a0a";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
  ctx.strokeStyle = "#ff2d7b";
  ctx.lineWidth = 4;
  ctx.stroke();

  if (avatarUrl) {
    try {
      const img = await loadImage(avatarUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
      ctx.restore();
      return;
    } catch { /* fallback */ }
  }
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#b44dff";
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 80px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(displayName.charAt(0), cx, cy);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

async function generateStoryImage(
  displayName: string,
  avatarUrl: string | undefined,
  genres: { name: string; count: number }[],
  topArtists: string[],
  streak: number | undefined,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);

  // Glow blobs
  for (const [bx, by, br, bc] of [
    [W * 0.8, H * 0.12, 400, "rgba(255,45,123,0.15)"],
    [W * 0.15, H * 0.55, 350, "rgba(0,240,255,0.10)"],
    [W * 0.5, H * 0.85, 400, "rgba(180,77,255,0.08)"],
  ] as [number, number, number, string][]) {
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    g.addColorStop(0, bc);
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // Diagonal lines
  ctx.strokeStyle = "rgba(255,255,255,0.02)";
  ctx.lineWidth = 1;
  for (let i = -H; i < W + H; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }

  const pad = 80;
  let y = 120;

  // Logo
  ctx.save();
  ctx.font = "bold 72px system-ui, -apple-system, sans-serif";
  ctx.letterSpacing = "-2px";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("VIBE", pad, y);
  const vibeW = ctx.measureText("VIBE").width;
  ctx.fillStyle = "#ff2d7b";
  ctx.fillText("BIFY", pad + vibeW, y);
  ctx.restore();

  ctx.fillStyle = "#ff2d7b";
  y += 16;
  ctx.save();
  ctx.transform(1, 0, -0.15, 1, 0, 0);
  ctx.fillRect(pad, y, 160, 6);
  ctx.restore();

  y += 60;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 52px system-ui, -apple-system, sans-serif";
  ctx.fillText(displayName, pad, y);
  y += 36;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
  ctx.letterSpacing = "6px";
  ctx.fillText("MUSIC DNA", pad, y);
  ctx.letterSpacing = "0px";

  if (streak && streak > 0) {
    ctx.fillStyle = streak >= 30 ? "#b44dff" : streak >= 7 ? "#00f0ff" : "#ff6b2b";
    ctx.font = "bold 40px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`🔥 ${streak}`, W - pad, 120);
    ctx.textAlign = "left";
  }

  // Pie chart
  const topGenres = genres.slice(0, 8);
  const totalCount = topGenres.reduce((sum, g) => sum + g.count, 0);
  const chartCx = W / 2;
  const chartCy = y + 300;
  const outerR = 240;
  const innerR = 130;

  drawPieChart(ctx, chartCx, chartCy, outerR, innerR, topGenres, totalCount);
  await drawAvatarCenter(ctx, chartCx, chartCy, innerR - 12, avatarUrl, displayName);

  y = chartCy + outerR + 60;

  // Genre legend
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

    ctx.save();
    ctx.transform(1, 0, -0.2, 1, 0, 0);
    ctx.fillStyle = color;
    ctx.fillRect(pad + 10, y - 22, 20, 28);
    ctx.restore();

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
    ctx.fillText(genre.name.toUpperCase(), pad + 50, y);

    ctx.fillStyle = color;
    ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${pct}%`, W - pad, y);
    ctx.textAlign = "left";

    const rowBarW = W - pad * 2 - 50;
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(pad + 50, y + 10, rowBarW, 4);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(pad + 50, y + 10, rowBarW * (pct / 100), 4);
    ctx.globalAlpha = 1;

    y += 58;
  }

  y += 20;

  // Top 3 artists
  if (topArtists.length > 0) {
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
    ctx.fillText("TOP ARTISTS", pad, y);
    ctx.letterSpacing = "0px";
    y += 48;

    const medals = ["🥇", "🥈", "🥉"];
    const artistColors = ["#ff2d7b", "#00f0ff", "#f5e642"];
    for (let i = 0; i < Math.min(topArtists.length, 3); i++) {
      ctx.font = "40px system-ui, -apple-system, sans-serif";
      ctx.fillText(medals[i], pad, y);
      ctx.fillStyle = artistColors[i];
      ctx.font = "bold 40px system-ui, -apple-system, sans-serif";
      ctx.fillText(topArtists[i], pad + 60, y);
      y += 56;
    }
  }

  // Watermark
  const bottomY = H - 100;
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, bottomY - 30);
  ctx.lineTo(W - pad, bottomY - 30);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "bold 24px system-ui, -apple-system, sans-serif";
  ctx.fillText("@ivannsmb", pad, bottomY + 10);

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.font = "22px system-ui, -apple-system, sans-serif";
  ctx.fillText("vibebify.ivanmendoza.dev", W - pad, bottomY + 10);
  ctx.textAlign = "left";

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

// ─── In-page component ───

export function GenreDnaCard({
  displayName,
  avatarUrl,
  genres,
  topArtists = [],
  streak,
}: GenreDnaCardProps) {
  const [sharing, setSharing] = useState(false);
  const [animate, setAnimate] = useState(false);

  const topGenres = genres.slice(0, 8);
  const totalCount = topGenres.reduce((sum, g) => sum + g.count, 0);

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(t);
  }, []);

  const shareCard = async () => {
    haptic("success");
    setSharing(true);
    try {
      const blob = await generateStoryImage(displayName, avatarUrl, genres, topArtists, streak);
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

  const topGenre = topGenres[0];
  const topColor = topGenre ? getGenreColor(topGenre.name) : "#ff2d7b";

  return (
    <div className="flex flex-col gap-5">
      {/* Hero section — pie chart with avatar */}
      <div className="relative overflow-hidden rounded-lg">
        {/* Glowing background */}
        <div className="absolute inset-0 bg-card" />
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[100px] opacity-20"
          style={{ backgroundColor: topColor }}
        />
        <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full blur-[80px] opacity-10 bg-punk-cyan" />
        <div className="absolute top-0 left-0 w-32 h-32 rounded-full blur-[60px] opacity-10 bg-punk-purple" />

        <div className="relative z-10 px-5 pt-5 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full border-2 border-punk-pink" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-punk-purple flex items-center justify-center text-xs font-bold">
                  {displayName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-sm font-bold leading-tight">{displayName}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-[0.25em]">Music DNA</p>
              </div>
            </div>
            {streak != null && streak > 0 && (
              <span className="text-punk-orange text-xs font-bold flex items-center gap-1">
                🔥 {streak}
              </span>
            )}
          </div>

          {/* Pie chart centered */}
          <div
            className="flex justify-center my-5 transition-all duration-1000 ease-out"
            style={{
              opacity: animate ? 1 : 0,
              transform: animate ? "scale(1) rotate(0deg)" : "scale(0.7) rotate(-30deg)",
            }}
          >
            <PieChartSVG
              genres={topGenres}
              totalCount={totalCount}
              avatarUrl={avatarUrl}
              displayName={displayName}
              animate={animate}
            />
          </div>

          {/* Genre pills in a ring-style layout */}
          <div
            className="flex flex-wrap justify-center gap-1.5 transition-all duration-700 delay-500"
            style={{ opacity: animate ? 1 : 0, transform: animate ? "translateY(0)" : "translateY(12px)" }}
          >
            {topGenres.map((genre, i) => {
              const pct = Math.round((genre.count / totalCount) * 100);
              const color = getGenreColor(genre.name);
              return (
                <span
                  key={genre.name}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 border text-[10px] font-bold uppercase tracking-wider transition-all duration-500"
                  style={{
                    borderColor: color + "40",
                    backgroundColor: color + "10",
                    transitionDelay: `${600 + i * 80}ms`,
                    opacity: animate ? 1 : 0,
                    transform: animate ? "translateY(0)" : "translateY(8px)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-foreground/90">{genre.name}</span>
                  <span style={{ color }}>{pct}%</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top 3 Artists */}
      {topArtists.length > 0 && (
        <div
          className="bg-card border border-border p-4 relative overflow-hidden transition-all duration-700 delay-700"
          style={{ opacity: animate ? 1 : 0, transform: animate ? "translateY(0)" : "translateY(16px)" }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[60px] opacity-10 bg-punk-pink" />
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.25em] mb-3 relative z-10">
            Top Artists
          </p>
          <div className="flex flex-col gap-2.5 relative z-10">
            {topArtists.slice(0, 3).map((artist, i) => {
              const medals = ["🥇", "🥈", "🥉"];
              const colors = ["text-punk-pink", "text-punk-cyan", "text-punk-yellow"];
              return (
                <div
                  key={artist}
                  className="flex items-center gap-3 transition-all duration-500"
                  style={{
                    transitionDelay: `${900 + i * 150}ms`,
                    opacity: animate ? 1 : 0,
                    transform: animate ? "translateX(0)" : "translateX(-20px)",
                  }}
                >
                  <span className="text-lg w-7 text-center">{medals[i]}</span>
                  <span className={`text-sm font-bold ${colors[i]}`}>{artist}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share button */}
      <Button
        onPress={shareCard}
        isDisabled={sharing}
        className="self-center px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-2 border-punk-cyan text-punk-cyan -skew-x-3 cursor-pointer hover:bg-punk-cyan/10 transition-colors disabled:opacity-40"
      >
        <span className="skew-x-3 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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

// ─── SVG Donut Pie Chart with Avatar Center ───

function PieChartSVG({
  genres,
  totalCount,
  avatarUrl,
  displayName,
  animate,
}: {
  genres: { name: string; count: number }[];
  totalCount: number;
  avatarUrl?: string;
  displayName: string;
  animate: boolean;
}) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 105;
  const innerR = 60;

  const slices: { d: string; color: string }[] = [];
  let startAngle = -Math.PI / 2;

  for (const genre of genres) {
    const sliceAngle = (genre.count / totalCount) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;
    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const x1o = cx + outerR * Math.cos(startAngle);
    const y1o = cy + outerR * Math.sin(startAngle);
    const x2o = cx + outerR * Math.cos(endAngle);
    const y2o = cy + outerR * Math.sin(endAngle);
    const x1i = cx + innerR * Math.cos(endAngle);
    const y1i = cy + innerR * Math.sin(endAngle);
    const x2i = cx + innerR * Math.cos(startAngle);
    const y2i = cy + innerR * Math.sin(startAngle);

    const d = [
      `M ${x1o} ${y1o}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o}`,
      `L ${x1i} ${y1i}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i}`,
      "Z",
    ].join(" ");

    slices.push({ d, color: getGenreColor(genre.name) });
    startAngle = endAngle;
  }

  // Glow filter
  const topColor = genres[0] ? getGenreColor(genres[0].name) : "#ff2d7b";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="drop-shadow-lg"
    >
      <defs>
        <filter id="pie-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor={topColor} floodOpacity="0.3" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="avatar-clip-preview">
          <circle cx={cx} cy={cy} r={innerR - 5} />
        </clipPath>
      </defs>

      {/* Glow ring */}
      <circle
        cx={cx}
        cy={cy}
        r={outerR + 4}
        fill="none"
        stroke={topColor}
        strokeWidth="1"
        opacity="0.2"
      />

      {/* Pie slices */}
      <g filter="url(#pie-glow)">
        {slices.map((slice, i) => (
          <path
            key={i}
            d={slice.d}
            fill={slice.color}
            opacity={1 - i * 0.04}
            stroke="#0a0a0a"
            strokeWidth="2"
            style={{
              transition: "opacity 0.6s ease-out",
              transitionDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </g>

      {/* Inner dark circle */}
      <circle cx={cx} cy={cy} r={innerR + 1} fill="#0a0a0a" />

      {/* Pink ring around avatar */}
      <circle cx={cx} cy={cy} r={innerR - 2} fill="none" stroke="#ff2d7b" strokeWidth="2" opacity="0.8" />

      {/* Spinning accent ring */}
      <circle
        cx={cx}
        cy={cy}
        r={outerR + 8}
        fill="none"
        stroke="url(#ring-gradient)"
        strokeWidth="1.5"
        strokeDasharray="8 16"
        opacity={animate ? "0.4" : "0"}
        style={{ transition: "opacity 1s ease-out", transformOrigin: "center" }}
        className="animate-[spin_20s_linear_infinite]"
      />
      <defs>
        <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff2d7b" />
          <stop offset="50%" stopColor="#00f0ff" />
          <stop offset="100%" stopColor="#b44dff" />
        </linearGradient>
      </defs>

      {/* Avatar */}
      {avatarUrl ? (
        <image
          href={avatarUrl}
          x={cx - (innerR - 5)}
          y={cy - (innerR - 5)}
          width={(innerR - 5) * 2}
          height={(innerR - 5) * 2}
          clipPath="url(#avatar-clip-preview)"
        />
      ) : (
        <>
          <circle cx={cx} cy={cy} r={innerR - 5} fill="#b44dff" />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize="32"
            fontWeight="bold"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {displayName.charAt(0)}
          </text>
        </>
      )}
    </svg>
  );
}
