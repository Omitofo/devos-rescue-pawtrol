/**
 * Lightweight bar histogram for admin analytics (no chart library).
 */

export function AnalyticsBars({
  items,
  maxBars = 14,
}: {
  items: { label: string; count: number }[];
  maxBars?: number;
}) {
  const slice = items.slice(0, maxBars);
  const max = Math.max(1, ...slice.map((i) => i.count));

  if (slice.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No data in this period.</p>
    );
  }

  return (
    <div className="space-y-2">
      {slice.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-2 text-sm"
        >
          <span className="truncate text-muted-foreground" title={item.label}>
            {item.label}
          </span>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[#7C3AED]/80"
              style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }}
            />
          </div>
          <span className="tabular-nums text-primary">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

/** Vertical day histogram for daily series */
export function AnalyticsDayChart({
  days,
}: {
  days: { day: string; count: number }[];
}) {
  const max = Math.max(1, ...days.map((d) => d.count));
  if (days.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No daily data yet.</p>
    );
  }

  return (
    <div className="flex h-36 items-end gap-0.5 sm:gap-1">
      {days.map((d) => (
        <div
          key={d.day}
          className="group relative flex min-w-0 flex-1 flex-col items-center justify-end"
          title={`${d.day}: ${d.count}`}
        >
          <div
            className="w-full max-w-[12px] rounded-t bg-[#FF6B2C]/85 transition group-hover:bg-[#FF6B2C]"
            style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}
