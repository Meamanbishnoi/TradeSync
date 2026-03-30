"use client";

import { useMemo } from "react";
import { format, startOfDay } from "date-fns";

interface Trade {
  date: string;
  pnl: number;
}

export default function ConsistencyMetrics({ trades }: { trades: Trade[] }) {
  const metrics = useMemo(() => {
    if (trades.length < 2) return null;

    const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // ── Drawdown ──────────────────────────────────────────────────────────
    let peak = 0, cum = 0, maxDrawdown = 0, maxDrawdownPct = 0;
    for (const t of sorted) {
      cum += t.pnl;
      if (cum > peak) peak = cum;
      const dd = peak - cum;
      if (dd > maxDrawdown) {
        maxDrawdown = dd;
        maxDrawdownPct = peak > 0 ? (dd / peak) * 100 : 0;
      }
    }

    // ── Consecutive wins/losses (trade-level) ─────────────────────────────
    let maxConsecWins = 0, maxConsecLosses = 0, tempW = 0, tempL = 0;
    let currentConsecWins = 0, currentConsecLosses = 0;
    for (const t of sorted) {
      if (t.pnl >= 0) { tempW++; tempL = 0; maxConsecWins = Math.max(maxConsecWins, tempW); }
      else { tempL++; tempW = 0; maxConsecLosses = Math.max(maxConsecLosses, tempL); }
    }
    // Current streak
    const lastIsWin = sorted[sorted.length - 1].pnl >= 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if ((sorted[i].pnl >= 0) === lastIsWin) {
        if (lastIsWin) currentConsecWins++; else currentConsecLosses++;
      } else break;
    }

    // ── Profitable days % ─────────────────────────────────────────────────
    const dayMap: Record<string, number> = {};
    for (const t of trades) {
      const key = format(startOfDay(new Date(t.date)), "yyyy-MM-dd");
      dayMap[key] = (dayMap[key] ?? 0) + t.pnl;
    }
    const days = Object.values(dayMap);
    const profitableDays = days.filter(p => p >= 0).length;
    const profitableDaysPct = days.length > 0 ? (profitableDays / days.length) * 100 : 0;

    // ── Expectancy (avg PNL per trade) ────────────────────────────────────
    const expectancy = trades.reduce((s, t) => s + t.pnl, 0) / trades.length;

    // ── Avg trades per day ────────────────────────────────────────────────
    const avgTradesPerDay = trades.length / days.length;

    // ── Recovery factor ───────────────────────────────────────────────────
    const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
    const recoveryFactor = maxDrawdown > 0 ? netPnl / maxDrawdown : null;

    return {
      maxDrawdown,
      maxDrawdownPct,
      maxConsecWins,
      maxConsecLosses,
      currentConsecWins: lastIsWin ? currentConsecWins : 0,
      currentConsecLosses: lastIsWin ? 0 : currentConsecLosses,
      currentStreakIsWin: lastIsWin,
      profitableDays,
      totalDays: days.length,
      profitableDaysPct,
      expectancy,
      avgTradesPerDay,
      recoveryFactor,
    };
  }, [trades]);

  if (!metrics) return null;

  const fmtPnl = (v: number) => `${v >= 0 ? "+" : ""}$${Math.abs(v).toFixed(2)}`;

  const cards = [
    {
      label: "Max Drawdown",
      value: `-$${metrics.maxDrawdown.toFixed(2)}`,
      sub: `${metrics.maxDrawdownPct.toFixed(1)}% from peak`,
      color: "#eb5757",
    },
    {
      label: "Expectancy",
      value: fmtPnl(metrics.expectancy),
      sub: "Avg PNL per trade",
      color: metrics.expectancy >= 0 ? "#0f7b6c" : "#eb5757",
    },
    {
      label: "Profitable Days",
      value: `${metrics.profitableDaysPct.toFixed(0)}%`,
      sub: `${metrics.profitableDays} of ${metrics.totalDays} days`,
      color: metrics.profitableDaysPct >= 50 ? "#0f7b6c" : "#eb5757",
    },
    {
      label: "Recovery Factor",
      value: metrics.recoveryFactor !== null ? metrics.recoveryFactor.toFixed(2) : "—",
      sub: "Net PNL ÷ Max Drawdown",
      color: metrics.recoveryFactor !== null && metrics.recoveryFactor >= 1 ? "#0f7b6c" : "var(--text-primary)",
    },
    {
      label: "Max Win Streak",
      value: `${metrics.maxConsecWins} trades`,
      sub: "Consecutive wins",
      color: "#0f7b6c",
    },
    {
      label: "Max Loss Streak",
      value: `${metrics.maxConsecLosses} trades`,
      sub: "Consecutive losses",
      color: "#eb5757",
    },
    {
      label: "Current Streak",
      value: `${metrics.currentStreakIsWin ? metrics.currentConsecWins : metrics.currentConsecLosses} trades`,
      sub: metrics.currentStreakIsWin ? "Winning" : "Losing",
      color: metrics.currentStreakIsWin ? "#0f7b6c" : "#eb5757",
    },
    {
      label: "Avg Trades / Day",
      value: metrics.avgTradesPerDay.toFixed(1),
      sub: "On active trading days",
      color: "var(--text-primary)",
    },
  ];

  return (
    <div>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "14px" }}>
        Consistency Metrics
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
        {cards.map(c => (
          <div key={c.label} style={{ padding: "14px 16px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.label}</div>
            <div style={{ fontSize: "19px", fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
