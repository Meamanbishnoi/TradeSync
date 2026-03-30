"use client";

import { useState, useMemo } from "react";
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  subWeeks, subMonths, startOfDay, endOfDay,
} from "date-fns";
import EquityCurve from "@/components/EquityCurve";
import StatsPanel from "@/components/StatsPanel";
import DirectionalBreakdown from "@/components/DirectionalBreakdown";
import ConsistencyMetrics from "@/components/ConsistencyMetrics";
import SetupPerformance from "@/components/SetupPerformance";
import InstrumentBreakdown from "@/components/InstrumentBreakdown";

interface Trade {
  id: string;
  date: string;
  pnl: number;
  instrument: string;
  direction: string;
  session: string | null;
  setup: string | null;
  contractSize: number | null;
  rating: number | null;
}

type FilterId = "today" | "this_week" | "last_week" | "this_month" | "last_month" | "last_n" | "custom" | "all";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all",        label: "All Time" },
  { id: "today",      label: "Today" },
  { id: "this_week",  label: "This Week" },
  { id: "last_week",  label: "Last Week" },
  { id: "this_month", label: "This Month" },
  { id: "last_month", label: "Last Month" },
  { id: "last_n",     label: "Last N" },
  { id: "custom",     label: "Custom" },
];

function filterTrades(trades: Trade[], filter: FilterId, lastN: number, customStart: string, customEnd: string): Trade[] {
  const now = new Date();
  switch (filter) {
    case "today":
      return trades.filter(t => {
        const d = new Date(t.date);
        return format(d, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");
      });
    case "this_week": {
      const s = startOfWeek(now, { weekStartsOn: 1 });
      const e = endOfWeek(now, { weekStartsOn: 1 });
      return trades.filter(t => { const d = new Date(t.date); return d >= s && d <= e; });
    }
    case "last_week": {
      const s = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const e = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      return trades.filter(t => { const d = new Date(t.date); return d >= s && d <= e; });
    }
    case "this_month": {
      const s = startOfMonth(now);
      const e = endOfMonth(now);
      return trades.filter(t => { const d = new Date(t.date); return d >= s && d <= e; });
    }
    case "last_month": {
      const s = startOfMonth(subMonths(now, 1));
      const e = endOfMonth(subMonths(now, 1));
      return trades.filter(t => { const d = new Date(t.date); return d >= s && d <= e; });
    }
    case "last_n":
      return [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, lastN);
    case "custom": {
      if (!customStart || !customEnd) return trades;
      const s = startOfDay(new Date(customStart));
      const e = endOfDay(new Date(customEnd));
      return trades.filter(t => { const d = new Date(t.date); return d >= s && d <= e; });
    }
    default:
      return trades;
  }
}

function calcKpis(trades: Trade[]) {
  let wins = 0, losses = 0, grossWin = 0, grossLoss = 0, netPnl = 0;
  trades.forEach(t => {
    netPnl += t.pnl;
    if (t.pnl >= 0) { wins++; grossWin += t.pnl; }
    else { losses++; grossLoss += Math.abs(t.pnl); }
  });
  const total = trades.length;
  const winRate = total > 0 ? (wins / total) * 100 : 0;
  const avgWin = wins > 0 ? grossWin / wins : 0;
  const avgLoss = losses > 0 ? grossLoss / losses : 0;
  const avgRRR = avgWin > 0 && avgLoss > 0 ? avgWin / avgLoss : 0;
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
  const bestTrade = total > 0 ? Math.max(...trades.map(t => t.pnl)) : null;
  const worstTrade = total > 0 ? Math.min(...trades.map(t => t.pnl)) : null;

  return [
    { label: "Net PNL",       value: `${netPnl >= 0 ? "+" : ""}$${Math.abs(netPnl).toFixed(2)}`,  color: netPnl >= 0 ? "#0f7b6c" : "#eb5757" },
    { label: "Win Rate",      value: `${winRate.toFixed(1)}%`,  sub: `${wins}W — ${losses}L`,       color: winRate >= 50 ? "#0f7b6c" : "#eb5757" },
    { label: "Avg R:R",       value: avgRRR > 0 ? avgRRR.toFixed(2) : "—", sub: `W: $${avgWin.toFixed(0)} / L: $${avgLoss.toFixed(0)}` },
    { label: "Profit Factor", value: isFinite(profitFactor) ? profitFactor.toFixed(2) : "∞",        color: profitFactor >= 1 ? "#0f7b6c" : "#eb5757" },
    { label: "Total Trades",  value: total.toString() },
    { label: "Gross Profit",  value: `+$${grossWin.toFixed(2)}`,  color: "#0f7b6c" },
    { label: "Gross Loss",    value: `-$${grossLoss.toFixed(2)}`,  color: "#eb5757" },
    { label: "Best Trade",    value: bestTrade !== null ? `+$${bestTrade.toFixed(2)}` : "—",         color: "#0f7b6c" },
    { label: "Worst Trade",   value: worstTrade !== null ? `-$${Math.abs(worstTrade).toFixed(2)}` : "—", color: "#eb5757" },
  ];
}

export default function AnalyticsDashboard({ allTrades }: { allTrades: Trade[] }) {
  const [filter, setFilter] = useState<FilterId>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("analytics_filter") as FilterId | null;
      if (saved && FILTERS.some(f => f.id === saved)) return saved;
    }
    return "all";
  });
  const [lastN, setLastN] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("analytics_last_n");
      return saved ? parseInt(saved) : 20;
    }
    return 20;
  });
  const [customStart, setCustomStart] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("analytics_custom_start") ?? format(new Date(), "yyyy-MM-dd");
    }
    return format(new Date(), "yyyy-MM-dd");
  });
  const [customEnd, setCustomEnd] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("analytics_custom_end") ?? format(new Date(), "yyyy-MM-dd");
    }
    return format(new Date(), "yyyy-MM-dd");
  });

  const handleSetFilter = (f: FilterId) => {
    setFilter(f);
    localStorage.setItem("analytics_filter", f);
  };

  const handleSetLastN = (n: number) => {
    setLastN(n);
    localStorage.setItem("analytics_last_n", n.toString());
  };

  const handleSetCustomStart = (v: string) => {
    setCustomStart(v);
    localStorage.setItem("analytics_custom_start", v);
  };

  const handleSetCustomEnd = (v: string) => {
    setCustomEnd(v);
    localStorage.setItem("analytics_custom_end", v);
  };

  const trades = useMemo(
    () => filterTrades(allTrades, filter, lastN, customStart, customEnd),
    [allTrades, filter, lastN, customStart, customEnd]
  );

  const kpis = useMemo(() => calcKpis(trades), [trades]);

  const activeLabel = FILTERS.find(f => f.id === filter)?.label ?? "All Time";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Filter bar */}
      <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "14px 16px" }}>
        <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
          Time Period
        </div>

        {/* Pill buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => handleSetFilter(f.id)}
              style={{
                padding: "5px 14px",
                fontSize: "13px",
                fontWeight: filter === f.id ? 600 : 400,
                borderRadius: "20px",
                border: filter === f.id ? "1.5px solid var(--text-primary)" : "1px solid var(--border-color)",
                backgroundColor: filter === f.id ? "var(--text-primary)" : "var(--bg-color)",
                color: filter === f.id ? "var(--bg-color)" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontFamily: "var(--font-family)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Last N input */}
        {filter === "last_n" && (
          <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Number of trades</label>
            <input
              type="number" min="1" max="500" value={lastN}
              onChange={e => handleSetLastN(Math.max(1, parseInt(e.target.value) || 1))}
              className="notion-input"
              style={{ width: "80px", padding: "5px 10px", fontSize: "13px" }}
            />
          </div>
        )}

        {/* Custom date range */}
        {filter === "custom" && (
          <div style={{ marginTop: "12px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>Start</label>
              <input type="date" value={customStart} onChange={e => handleSetCustomStart(e.target.value)} className="notion-input" style={{ padding: "5px 10px", fontSize: "13px", width: "auto" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>End</label>
              <input type="date" value={customEnd} onChange={e => handleSetCustomEnd(e.target.value)} className="notion-input" style={{ padding: "5px 10px", fontSize: "13px", width: "auto" }} />
            </div>
          </div>
        )}

        {/* Active range summary */}
        <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--text-secondary)" }}>
          Showing <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{trades.length}</span> trade{trades.length !== 1 ? "s" : ""} — {activeLabel}
        </div>
      </div>

      {trades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px", border: "1px dashed var(--border-color)", borderRadius: "8px", color: "var(--text-secondary)" }}>
          <p>No trades found for this period.</p>
        </div>
      ) : (
        <>
          {/* KPI grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
            {kpis.map(k => (
              <div key={k.label} style={{ padding: "14px 16px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: k.color ?? "var(--text-primary)", lineHeight: 1 }}>{k.value}</div>
                {k.sub && <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>{k.sub}</div>}
              </div>
            ))}
          </div>

          {/* Equity Curve */}
          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px 12px 12px" }}>
            <EquityCurve trades={trades} />
          </div>

          {/* Directional Breakdown */}
          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px" }}>
            <DirectionalBreakdown trades={trades} />
          </div>

          {/* Consistency Metrics */}
          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px" }}>
            <ConsistencyMetrics trades={trades} />
          </div>

          {/* Setup Performance */}
          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px" }}>
            <SetupPerformance trades={trades} />
          </div>

          {/* Instrument Breakdown */}
          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px" }}>
            <InstrumentBreakdown trades={trades} />
          </div>

          {/* Stats Panel (streaks, DOW, monthly) */}
          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>Detailed Breakdown</div>
            <StatsPanel trades={trades} />
          </div>
        </>
      )}
    </div>
  );
}
