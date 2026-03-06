"use client";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  accent?: string;
}

export function SectionHeader({
  title,
  subtitle,
  accent = "bg-punk-pink",
}: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-1.5 h-8 ${accent} -skew-x-12`} />
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
