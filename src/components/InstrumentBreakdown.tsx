"use client";

import { useMemo } from "react";

interface Trade {
  instrument: string;
  pnl: number;
  direction: string;
}

interface InstrumentStats {
  instrument: string;
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnl: number;
  grossWin: number;
  grossLoss: number;
  avgWin: number;
  avgLoss: number;
  rr: number | null;
  best: number;
  worst: number;
  longCount: number;
  shortCount: number;
}

export default function InstrumentBreakdown({ trades }: { trades: Trade[] }) {
  const instruments = useMemo((): InstrumentStats[] => {
    const map: Record<string, { pnls: number[]; directions: string[] }> = {};

    for (const t of trades) {
      const key = t.instrument.toUpperCase().trim();
      if (!map[key]) map[key] = { pnls: [], directions: [] };
      map[key].pnls.push(t.pnl);
      map[key].directions.push(t.direction);
    }

    return Object.entries(map).map(([instrument, { pnls, directions }]) => {
      const wins = pnls.filter(p => p >= 0);
      const losses = pnls.filter(p => p < 0);
      const grossWin = wins.reduce((s, p) => s + p, 0);
      const grossLoss = losses.reduce((s, p) => s + Math.abs(p), 0);
      const avgWin = wins.length > 0 ? grossWin / wins.length : 0;
      const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
      return {
        instrument,
        total: pnls.length,
        wins: wins.length,
        losses: losses.length,
        winRate: (wins.length / pnls.length) * 100,
        netPnl: pnls.reduce((s, p) => s + p, 0),
        grossWin,
        grossLoss,
        avgWin,
        avgLoss,
        rr: avgWin > 0 && avgLoss > 0 ? avgWin / avgLoss : null,
        best: Math.max(...pnls),
        worst: Math.min(...pnls),
        longCount: directions.filter(d => d === "Long").length,
        shortCount: directions.filter(d => d === "Short").length,
      };
    }).sort((a, b) => b.netPnl - a.netPnl);
  }, [trades]);

  if (instruments.length === 0) return null;

  const maxAbs = Math.max(...instruments.map(s => Math.abs(s.netPnl)), 1);
  const fmtPnl = (v: number) =>
    `${v >= 0 ? "+" : ""}$${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.abs(v).toFixed(0)}`;
  const pnlColor = (v: number) => v >= 0 ? "#0f7b6c" : "#eb5757";

  return (
    <div>
      <div style={{
        fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)",
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "14px",
      }}>
        Instrument Breakdown
      </div>

      {/* Table — hidden on small screens */}
      <div className="instrument-table-wrapper" style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "10px", marginBottom: "16px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}>
              {["Instrument", "Trades", "Win %", "Net PNL", "Avg Win", "Avg Loss", "R:R", "Best", "Worst", "L/S"].map(h => (
                <th key={h} style={{
                  padding: "9px 12px", fontWeight: 500, fontSize: "12px",
                  textAlign: ["Net PNL", "Best", "Worst"].includes(h) ? "right" : "left",
                  color: "var(--text-secondary)", whiteSpace: "nowrap",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {instruments.map((s, i) => (
              <tr
                key={s.instrument}
                className="notion-table-row"
                style={{ borderBottom: i < instruments.length - 1 ? "1px solid var(--border-color)" : "none" }}
              >
                <td style={{ padding: "9px 12px", fontWeight: 700, fontSize: "14px" }}>{s.instrument}</td>
                <td style={{ padding: "9px 12px", color: "var(--text-secondary)" }}>{s.total}</td>
                <td style={{ padding: "9px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "40px", height: "4px", backgroundColor: "var(--border-color)", borderRadius: "2px", overflow: "hidden", flexShrink: 0 }}>
                      <div style={{ width: `${s.winRate}%`, height: "100%", backgroundColor: s.winRate >= 50 ? "#0f7b6c" : "#eb5757", borderRadius: "2px" }} />
                    </div>
                    <span style={{ color: s.winRate >= 50 ? "#0f7b6c" : "#eb5757", fontWeight: 600 }}>{s.winRate.toFixed(0)}%</span>
                  </div>
                </td>
                <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: pnlColor(s.netPnl) }}>{fmtPnl(s.netPnl)}</td>
                <td style={{ padding: "9px 12px", color: "#0f7b6c", fontWeight: 500 }}>+${s.avgWin.toFixed(0)}</td>
                <td style={{ padding: "9px 12px", color: "#eb5757", fontWeight: 500 }}>-${s.avgLoss.toFixed(0)}</td>
                <td style={{ padding: "9px 12px", color: "var(--text-secondary)" }}>{s.rr !== null ? s.rr.toFixed(2) : "—"}</td>
                <td style={{ padding: "9px 12px", textAlign: "right", color: "#0f7b6c" }}>+${s.best.toFixed(0)}</td>
                <td style={{ padding: "9px 12px", textAlign: "right", color: "#eb5757" }}>-${Math.abs(s.worst).toFixed(0)}</td>
                <td style={{ padding: "9px 12px", color: "var(--text-secondary)", fontSize: "12px" }}>{s.longCount}L/{s.shortCount}S</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bar chart — always visible, works great on mobile */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {instruments.map(s => (
          <div key={s.instrument}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", minWidth: "40px" }}>{s.instrument}</span>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{s.total} trade{s.total !== 1 ? "s" : ""}</span>
                <span style={{
                  fontSize: "12px", fontWeight: 600, padding: "1px 7px",
                  borderRadius: "10px",
                  backgroundColor: s.winRate >= 50 ? "rgba(15,123,108,0.1)" : "rgba(235,87,87,0.1)",
                  color: s.winRate >= 50 ? "#0f7b6c" : "#eb5757",
                }}>{s.winRate.toFixed(0)}% WR</span>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  W: <span style={{ color: "#0f7b6c", fontWeight: 600 }}>+${s.avgWin.toFixed(0)}</span>
                  {" / "}
                  L: <span style={{ color: "#eb5757", fontWeight: 600 }}>-${s.avgLoss.toFixed(0)}</span>
                </span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: pnlColor(s.netPnl) }}>{fmtPnl(s.netPnl)}</span>
              </div>
            </div>
            <div style={{ height: "5px", backgroundColor: "var(--border-color)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{
                width: `${(Math.abs(s.netPnl) / maxAbs) * 100}%`,
                height: "100%",
                backgroundColor: s.netPnl >= 0 ? "rgba(15,123,108,0.5)" : "rgba(235,87,87,0.5)",
                borderRadius: "4px",
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
