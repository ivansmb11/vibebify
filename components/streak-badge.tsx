"use client";

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
  size?: "sm" | "lg";
}

export function StreakBadge({
  currentStreak,
  longestStreak,
  size = "sm",
}: StreakBadgeProps) {
  const isOnFire = currentStreak >= 3;
  const isLegendary = currentStreak >= 7;
  const isMythic = currentStreak >= 30;

  const flameColor = isMythic
    ? "text-punk-purple"
    : isLegendary
      ? "text-punk-cyan"
      : isOnFire
        ? "text-punk-orange"
        : "text-muted-foreground";

  const borderColor = isMythic
    ? "border-punk-purple"
    : isLegendary
      ? "border-punk-cyan"
      : isOnFire
        ? "border-punk-orange"
        : "border-border";

  if (currentStreak === 0) return null;

  if (size === "sm") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 border ${borderColor} text-[10px] font-bold uppercase tracking-wider ${flameColor}`}
        title={`${currentStreak} day streak (best: ${longestStreak})`}
      >
        <FlameIcon size={10} />
        {currentStreak}
      </span>
    );
  }

  return (
    <div
      className={`border-2 ${borderColor} bg-card px-4 py-3 -skew-x-3 inline-flex flex-col items-center gap-1`}
    >
      <div className={`skew-x-3 flex items-center gap-1.5 ${flameColor}`}>
        <FlameIcon size={20} />
        <span className="text-2xl font-bold font-mono">{currentStreak}</span>
      </div>
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest skew-x-3">
        Day Streak
      </span>
      {longestStreak > currentStreak && (
        <span className="text-[9px] text-muted-foreground skew-x-3">
          Best: {longestStreak}
        </span>
      )}
    </div>
  );
}

function FlameIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 23c-4.97 0-8-3.58-8-7.5 0-3.07 1.99-5.38 3.5-7.05.48-.53 1.5-.2 1.5.52 0 1.13.58 2.25 1.5 2.88.36.24.84-.06.78-.47-.14-.88-.06-2.09.67-3.38C13.39 5.55 15.47 3.9 16 2c.1-.36.57-.42.75-.08 1.53 2.87 4.25 6.65 4.25 10.58 0 3.92-3.03 7.5-8 7.5h-1z" />
    </svg>
  );
}
