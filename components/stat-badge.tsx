"use client";

interface StatBadgeProps {
  label: string;
  value: string | number;
  color?: string;
}

export function StatBadge({
  label,
  value,
  color = "border-punk-cyan",
}: StatBadgeProps) {
  return (
    <div
      className={`border-2 ${color} bg-card px-4 py-3 -skew-x-3 inline-flex flex-col items-center`}
    >
      <span className="text-2xl font-bold font-mono skew-x-3">{value}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest skew-x-3">
        {label}
      </span>
    </div>
  );
}
