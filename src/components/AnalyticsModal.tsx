"use client";

import { useMemo } from "react";
import { POINT_MULTIPLIERS } from "@/lib/constants";

interface Trade {
  id: string;
  instrument: string;
  date: string;
  session: string | null;
  direction: string;
  contractSize: number | null;
  setup: string | null;
  pnl: number;
  notes: string | null;
  rating: number | null;
}

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
}

function groupWinRate(trades: Trade[], key: "session" | "setup") {
  const map: Record<string, { wins: number; total: number; pnl: number }> = {};
  for (const t of trades) {
    const k = t[key] || "Unknown";
    if (!map[k]) map[k] = { wins: 0, total: 0, pnl: 0 };
    map[k].total++;
    map[k].pnl += t.pnl;
    if (t.pnl >= 0) map[k].wins++;
  }
  return Object.entries(map)
    .map(([label, v]) => ({ label, winRate: (v.wins / v.total) * 100, total: v.total, pnl: v.pnl }))
    .sort((a, b) => b.total - a.total);
}

export default function AnalyticsModal({ isOpen, onClose, trades }: AnalyticsModalProps) {
  const metrics = useMemo(() => {
    if (trades.length === 0) return null;

    let wins = 0, losses = 0;
    let longWins = 0, longTotal = 0;
    let shortWins = 0, shortTotal = 0;
    let totalWinPnl = 0, totalLossPnl = 0;
    let totalPointsCaptured = 0, tradesWithValidPoints = 0;

    trades.forEach(trade => {
      const isWin = trade.pnl >= 0;
      if (isWin) { wins++; totalWinPnl += trade.pnl; }
      else { losses++; totalLossPnl += Math.abs(trade.pnl); }

      if (trade.direction === "Long") { longTotal++; if (isWin) longWins++; }
      else if (trade.direction === "Short") { shortTotal++; if (isWin) shortWins++; }

      const multiplier = POINT_MULTIPLIERS[trade.instrument.toUpperCase()];
      if (multiplier && trade.contractSize && trade.contractSize > 0) {
        totalPointsCaptured += trade.pnl / (multiplier * trade.contractSize);
        tradesWithValidPoints++;
      }
    });

    const winRate = (wins / trades.length) * 100;
    const avgWin = wins > 0 ? totalWinPnl / wins : 0;
    const avgLoss = losses > 0 ? totalLossPnl / losses : 0;
    const avgRr: number | string = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? "∞" : 0);
    const avgPoints = tradesWithValidPoints > 0 ? totalPointsCaptured / tradesWithValidPoints : 0;

    return {
      totalTrades: trades.length,
      winRate,
      longWinRate: longTotal > 0 ? (longWins / longTotal) * 100 : 0,
      shortWinRate: shortTotal > 0 ? (shortWins / shortTotal) * 100 : 0,
      avgWin, avgLoss, avgRr, avgPoints,
    };
  }, [trades]);

  const sessionBreakdown = useMemo(() => groupWinRate(trades, "session"), [trades]);
  const setupBreakdown = useMemo(() => groupWinRate(trades, "setup"), [trades]);

  if (!isOpen) return null;

  const Row = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-color)" }}>
      <span style={{ color: "var(--text-secondary)", fontSize: "15px" }}>{label}</span>
      <span style={{ fontWeight: 500, fontSize: "15px", color: color || "var(--text-primary)" }}>{value}</span>
    </div>
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: "var(--bg-color)", borderRadius: "12px", border: "1px solid var(--border-color)", padding: "32px", width: "100%", maxWidth: "560px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>Trade Analytics</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px", color: "var(--text-secondary)", lineHeight: 1 }}>&times;</button>
        </div>

        {!metrics ? (
          <p style={{ color: "var(--text-secondary)" }}>No trades available to analyze for this period.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Top grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ padding: "16px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>Win Rate</div>
                <div style={{ fontSize: "24px", fontWeight: 600, color: metrics.winRate >= 50 ? "#0f7b6c" : "var(--text-primary)" }}>{metrics.winRate.toFixed(1)}%</div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>{metrics.totalTrades} trades</div>
              </div>
              <div style={{ padding: "16px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>Avg R:R</div>
                <div style={{ fontSize: "24px", fontWeight: 600 }}>{typeof metrics.avgRr === "number" ? `1 : ${metrics.avgRr.toFixed(2)}` : metrics.avgRr}</div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>Avg Win / Avg Loss</div>
              </div>
            </div>

            {/* Core stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Row label="Average Win" value={`+$${metrics.avgWin.toFixed(2)}`} color="#0f7b6c" />
              <Row label="Average Loss" value={`-$${metrics.avgLoss.toFixed(2)}`} color="#eb5757" />
              <Row label="Long Win Rate" value={`${metrics.longWinRate.toFixed(1)}%`} />
              <Row label="Short Win Rate" value={`${metrics.shortWinRate.toFixed(1)}%`} />
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "4px" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "15px" }}>Avg Points Captured</span>
                <span style={{ fontWeight: 600, fontSize: "16px", color: metrics.avgPoints >= 0 ? "#0f7b6c" : "#eb5757" }}>
                  {metrics.avgPoints >= 0 ? "+" : ""}{metrics.avgPoints.toFixed(2)} pts
                </span>
              </div>
            </div>

            {/* Session breakdown */}
            {sessionBreakdown.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Performance by Session</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {sessionBreakdown.map(s => (
                    <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>{s.label}</span>
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{s.total} {s.total === 1 ? 'trade' : 'trades'}</span>
                      </div>
                      <div style={{ display: "flex", gap: "24px", alignItems: "center", textAlign: "right" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Win Rate</span>
                          <span style={{ fontSize: "15px", fontWeight: 600, color: s.winRate >= 50 ? "#0f7b6c" : "var(--text-primary)" }}>{s.winRate.toFixed(0)}%</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "60px" }}>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Net PNL</span>
                          <span style={{ fontSize: "15px", fontWeight: 600, color: s.pnl >= 0 ? "#0f7b6c" : "#eb5757" }}>{s.pnl >= 0 ? "+" : ""}${s.pnl.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Setup breakdown */}
            {setupBreakdown.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Performance by Setup</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {setupBreakdown.map(s => (
                    <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>{s.label}</span>
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{s.total} {s.total === 1 ? 'trade' : 'trades'}</span>
                      </div>
                      <div style={{ display: "flex", gap: "24px", alignItems: "center", textAlign: "right" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Win Rate</span>
                          <span style={{ fontSize: "15px", fontWeight: 600, color: s.winRate >= 50 ? "#0f7b6c" : "var(--text-primary)" }}>{s.winRate.toFixed(0)}%</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "60px" }}>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Net PNL</span>
                          <span style={{ fontSize: "15px", fontWeight: 600, color: s.pnl >= 0 ? "#0f7b6c" : "#eb5757" }}>{s.pnl >= 0 ? "+" : ""}${s.pnl.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
