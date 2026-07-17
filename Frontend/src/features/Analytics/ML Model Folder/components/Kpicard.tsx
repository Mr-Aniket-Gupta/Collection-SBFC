import { KPIData } from "@/features/Analytics/ML Model Folder/types";

interface KPICardProps {
  data: KPIData;
}

const trendColor: Record<string, string> = {
  up: "text-[var(--color-gold)]",
  down: "text-[var(--color-blue)]",
  flat: "text-[var(--color-ink-muted)]",
};

const trendSymbol: Record<string, string> = {
  up: "▲",
  down: "▼",
  flat: "→",
};

export function KPICard({ data }: KPICardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[rgba(5,0,88,0.1)] bg-white p-4 shadow-[0_8px_24px_rgba(5,0,88,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-[rgba(0,1,130,0.25)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="absolute bottom-0 left-0 h-8 w-8 border-b border-l border-[rgba(0,1,130,0)] transition group-hover:border-[rgba(0,1,130,0.16)]" />
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-ink-muted)]">
        {data.label}
      </p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-semibold tracking-tight text-[var(--color-navy)]">
          {data.value}
        </p>
        {data.trend && (
          <span
            className={`text-xs font-semibold ${trendColor[data.trend.direction]}`}
          >
            {trendSymbol[data.trend.direction]} {data.trend.value}
          </span>
        )}
      </div>
    </div>
  );
}

interface KPIGridProps {
  items: KPIData[];
}

export function KPIGrid({ items }: KPIGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <KPICard key={item.label} data={item} />
      ))}
    </div>
  );
}
