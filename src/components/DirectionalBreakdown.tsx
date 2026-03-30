"use client";

import { useMemo } from "react";

interface Trade {
  direction: string;
  pnl: number;
}

function calcDir(trades: Trade[], dir: string) {
  const filtered = trades.filter(t => t.direction === dir);
  if (filtered.length === 0) return null;
  const wins = filtered.filter(t => t.pnl >= 0);
  const losses = filtered.filter(t => t.pnl < 0);
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = losses.reduce((s, t) => s + Math.abs(t.pnl), 0);
  const avgWin = wins.length > 0 ? grossWin / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
  const netPnl = filtered.reduce((s, t) => s + t.pnl, 0);
  const winRate = (wins.length / filtered.length) * 100;
  const rr = avgWin > 0 && avgLoss > 0 ? avgWin / avgLoss : null;
  const best = Math.max(...filtered.map(t => t.pnl));
  const worst = Math.min(...filtered.map(t => t.pnl));
  return { total: filtered.length, wins: wins.length, losses: losses.length, winRate, netPnl, avgWin, avgLoss, rr, best, worst };
}

const fmtPnl = (v: number) => `${v >= 0 ? "+" : ""}$${Math.abs(v).toFixed(2)}`;
const pnlColor = (v: number) => v >= 0 ? "#0f7b6c" : "#eb5757";

function DirCard({ label, data, color }: {
  label: string;
  data: ReturnType<typeof calcDir>;
  color: string;
}) {
  if (!data) return (
    <div style={{ padding: "16px 18px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
      <div style={{ fontSize: "13px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>{label}</div>
      <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>No trades</div>
    </div>
  );

  const rows = [
    { label: "Trades",    value: `${data.total} (${data.wins}W / ${data.losses}L)` },
    { label: "Win Rate",  value: `${data.winRate.toFixed(1)}%`, color: data.winRate >= 50 ? "#0f7b6c" : "#eb5757" },
    { label: "Net PNL",   value: fmtPnl(data.netPnl), color: pnlColor(data.netPnl) },
    { label: "Avg Win",   value: `+$${data.avgWin.toFixed(2)}`, color: "#0f7b6c" },
    { label: "Avg Loss",  value: `-$${data.avgLoss.toFixed(2)}`, color: "#eb5757" },
    { label: "Avg R:R",   value: data.rr !== null ? data.rr.toFixed(2) : "—" },
    { label: "Best",      value: fmtPnl(data.best), color: "#0f7b6c" },
    { label: "Worst",     value: fmtPnl(data.worst), color: "#eb5757" },
  ];

  return (
    <div style={{ padding: "16px 18px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <span style={{ fontSize: "14px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <span style={{ fontSize: "22px", fontWeight: 800, color: pnlColor(data.netPnl) }}>{fmtPnl(data.netPnl)}</span>
      </div>

      {/* Win rate bar */}
      <div style={{ marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Win Rate</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: data.winRate >= 50 ? "#0f7b6c" : "#eb5757" }}>{data.winRate.toFixed(1)}%</span>
        </div>
        <div style={{ height: "6px", backgroundColor: "var(--border-color)", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{ width: `${data.winRate}%`, height: "100%", backgroundColor: data.winRate >= 50 ? "#0f7b6c" : "#eb5757", borderRadius: "3px", transition: "width 0.4s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px" }}>
          <span style={{ fontSize: "12px", color: "#0f7b6c" }}>{data.wins}W</span>
          <span style={{ fontSize: "12px", color: "#eb5757" }}>{data.losses}L</span>
        </div>
      </div>

      {/* Stats rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
        {rows.slice(2).map(r => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{r.label}</span>
            <span style={{ fontSize: "15px", fontWeight: 600, color: r.color ?? "var(--text-primary)" }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DirectionalBreakdown({ trades }: { trades: Trade[] }) {
  const longData = useMemo(() => calcDir(trades, "Long"), [trades]);
  const shortData = useMemo(() => calcDir(trades, "Short"), [trades]);

  if (!longData && !shortData) return null;

  return (
    <div>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "14px" }}>
        Directional Breakdown
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
        <DirCard label="Long / Buy" data={longData} color="#0f7b6c" />
        <DirCard label="Short / Sell" data={shortData} color="#eb5757" />
      </div>
    </div>
  );
}
