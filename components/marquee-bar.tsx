"use client";

interface MarqueeBarProps {
  items: string[];
  color?: string;
  bgColor?: string;
  speed?: "slow" | "normal" | "fast";
}

const speedMap = {
  slow: "30s",
  normal: "20s",
  fast: "12s",
};

export function MarqueeBar({
  items,
  color = "text-background",
  bgColor = "bg-punk-pink",
  speed = "normal",
}: MarqueeBarProps) {
  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div
      className={`${bgColor} ${color} overflow-hidden py-2 -rotate-1 font-bold uppercase text-xs tracking-[0.2em] select-none`}
    >
      <div
        className="flex whitespace-nowrap"
        style={{ animation: `marquee ${speedMap[speed]} linear infinite` }}
      >
        {repeated.map((item, i) => (
          <span key={i} className="mx-6 flex items-center gap-2">
            <span className="text-[8px]">★</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
