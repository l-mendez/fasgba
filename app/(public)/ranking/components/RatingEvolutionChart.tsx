"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface HistoryPoint {
  filename: string;
  month: number;
  year: number;
  date: string;
  standard: number | null;
  rapid: number | null;
  blitz: number | null;
}

interface ChartPoint extends HistoryPoint {
  // First day of the ranking month (UTC ms), so the x-axis is time-scaled.
  t: number;
}

interface Props {
  playerId?: string;
  playerName: string;
}

const MONTH_SHORT_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

// Distinct color + dash per series so lines stay distinguishable in both themes.
const SERIES = [
  { key: "standard" as const, name: "Standard", color: "var(--color-amber)", dash: undefined },
  { key: "rapid" as const, name: "Rápido", color: "var(--color-terracotta)", dash: "6 3" },
  { key: "blitz" as const, name: "Blitz", color: "hsl(var(--muted-foreground))", dash: "2 3" },
];
const SERIES_ORDER: Record<string, number> = Object.fromEntries(SERIES.map((s, i) => [s.name, i]));

const monthLabel = (t: number) => {
  const d = new Date(t);
  return `${MONTH_SHORT_ES[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(-2)}`;
};

// Month-aligned ticks (every 1/2/3/6/12/24 months), at most ~5 across the range.
function timeTicks(min: number, max: number): number[] {
  const start = new Date(min);
  const end = new Date(max);
  const span = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
  const step = [1, 2, 3, 6, 12, 24].find((s) => span / s <= 5) ?? 36;
  let month = start.getUTCFullYear() * 12 + start.getUTCMonth();
  month = Math.ceil(month / step) * step;
  const ticks: number[] = [];
  const monthStart = (m: number) => Date.UTC(Math.floor(m / 12), m % 12, 1);
  for (let t = monthStart(month); t <= max; month += step, t = monthStart(month)) {
    ticks.push(t);
  }
  return ticks;
}

// Rating ticks on round numbers (multiples of 10/25/50/100/200), ~4-6 ticks.
function ratingTicks(points: ChartPoint[]): number[] | undefined {
  const values = points.flatMap((p) => SERIES.map((s) => p[s.key])).filter((v): v is number => v != null);
  if (values.length === 0) return undefined;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = [10, 25, 50, 100, 200].find((s) => (max - min) / s <= 5) ?? 500;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= Math.max(hi, lo + step); v += step) ticks.push(v);
  return ticks;
}

export function RatingEvolutionChart({ playerId, playerName }: Props) {
  const [history, setHistory] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams();
    if (playerId) params.set("playerId", playerId);
    if (playerName) params.set("name", playerName);

    fetch(`/api/ranking/player-history?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        // apiSuccess returns the payload unwrapped: { playerId, history }
        const items: HistoryPoint[] = Array.isArray(data?.history) ? data.history : [];
        setHistory(items
          .map(item => ({ ...item, t: Date.UTC(item.year, item.month - 1, 1) }))
          .sort((a, b) => a.t - b.t));
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [playerId, playerName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (history.length < 2) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Sin historial suficiente.
      </p>
    );
  }

  const xTicks = timeTicks(history[0].t, history[history.length - 1].t);
  const yTicks = ratingTicks(history);

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            ticks={xTicks}
            tickFormatter={monthLabel}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            stroke="hsl(var(--muted-foreground))"
            domain={yTicks ? [yTicks[0], yTicks[yTicks.length - 1]] : ["auto", "auto"]}
            ticks={yTicks}
            interval={0}
            width={48}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 6,
              fontSize: 12,
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            labelFormatter={(t) => monthLabel(Number(t))}
            formatter={(value) =>
              value == null ? "--" : Math.round(Number(value)).toString()
            }
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconSize={10}
            itemSorter={(item) => SERIES_ORDER[String(item.value)] ?? 0}
          />
          {SERIES.map(s => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeDasharray={s.dash}
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
