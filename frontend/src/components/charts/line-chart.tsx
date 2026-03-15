import { TimeSeriesPoint } from "@/lib/types";

export function LineChart({
  data,
  color = "#0f766e",
  height = 160,
}: {
  data: TimeSeriesPoint[];
  color?: string;
  height?: number;
}) {
  if (!data.length) {
    return <div className="text-sm text-[var(--muted)]">No chart data.</div>;
  }

  const width = 420;
  const gradientId = `line-fill-${data[0]?.date ?? "series"}-${data.length}`.replace(/[^a-zA-Z0-9_-]/g, "");
  const values = data.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const denominator = max - min || 1;
  const points = data
    .map((point, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * width;
      const y = height - ((point.value - min) / denominator) * (height - 24) - 12;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <div className="space-y-3">
      <svg className="h-auto w-full" viewBox={`0 0 ${width} ${height}`} role="img">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.24" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline fill={`url(#${gradientId})`} points={areaPoints} />
        <polyline
          fill="none"
          points={points}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
      </svg>
      <div className="flex gap-2 text-xs text-[var(--muted)]">
        {data.map((point) => (
          <div key={point.date} className="flex-1 truncate">
            {point.label}
          </div>
        ))}
      </div>
    </div>
  );
}
