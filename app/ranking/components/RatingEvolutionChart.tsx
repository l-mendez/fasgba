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
  label: string;
}

interface Props {
  playerId?: string;
  playerName: string;
}

const MONTH_SHORT_ES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const SERIES = [
  { key: "standard" as const, name: "Standard", color: "#daa056" },
  { key: "rapid" as const, name: "Rápido", color: "#3b82f6" },
  { key: "blitz" as const, name: "Blitz", color: "#8f3f12" },
];

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
        const items: HistoryPoint[] = data?.success && Array.isArray(data.data?.history)
          ? data.data.history
          : [];
        setHistory(items.map(item => ({
          ...item,
          label: `${MONTH_SHORT_ES[item.month - 1]} ${String(item.year).slice(-2)}`,
        })));
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
        Historial insuficiente para mostrar la evolución
      </p>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            stroke="hsl(var(--muted-foreground))"
            minTickGap={20}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            stroke="hsl(var(--muted-foreground))"
            domain={["dataMin - 30", "dataMax + 30"]}
            tickFormatter={v => String(Math.round(v))}
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
            formatter={(value) =>
              value == null ? "--" : Math.round(Number(value)).toString()
            }
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconSize={10} />
          {SERIES.map(s => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
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
