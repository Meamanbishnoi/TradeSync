"use client";

import { useMemo } from "react";

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

// Map of Instruments to their Point Multipliers (Dollars per Point)
const POINT_MULTIPLIERS: Record<string, number> = {
  "ES": 50,
  "MES": 5,
  "NQ": 20,
  "MNQ": 2,
  "YM": 5,
  "MYM": 0.5,
  "RTY": 50,
  "M2K": 5,
  "GC": 100,
  "MGC": 10,
  "CL": 1000,
  "QM": 500,
  "NG": 10000,
};

export default function AnalyticsModal({ isOpen, onClose, trades }: AnalyticsModalProps) {
  const metrics = useMemo(() => {
    if (trades.length === 0) return null;

    let wins = 0;
    let losses = 0;
    let longWins = 0;
    let longTotal = 0;
    let shortWins = 0;
    let shortTotal = 0;
    
    let totalWinPnl = 0;
    let totalLossPnl = 0;
    
    let totalPointsCaptured = 0;
    let tradesWithValidPoints = 0;

    trades.forEach(trade => {
      const isWin = trade.pnl >= 0;
      
      // Global Wins/Losses
      if (isWin) {
        wins++;
        totalWinPnl += trade.pnl;
      } else {
        losses++;
        totalLossPnl += Math.abs(trade.pnl);
      }

      // Directional
      if (trade.direction === "Long") {
        longTotal++;
        if (isWin) longWins++;
      } else if (trade.direction === "Short") {
        shortTotal++;
        if (isWin) shortWins++;
      }

      // Points Captured
      const multiplier = POINT_MULTIPLIERS[trade.instrument.toUpperCase()];
      if (multiplier && trade.contractSize && trade.contractSize > 0) {
        // PNL = Points * Mutliplier * Contracts => Points = PNL / (Multiplier * Contracts)
        const points = trade.pnl / (multiplier * trade.contractSize);
        totalPointsCaptured += points;
        tradesWithValidPoints++;
      }
    });

    const winRate = (wins / trades.length) * 100;
    const longWinRate = longTotal > 0 ? (longWins / longTotal) * 100 : 0;
    const shortWinRate = shortTotal > 0 ? (shortWins / shortTotal) * 100 : 0;
    
    const avgWin = wins > 0 ? totalWinPnl / wins : 0;
    const avgLoss = losses > 0 ? totalLossPnl / losses : 0;
    const avgRr = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? "Infinite" : 0);

    const avgPoints = tradesWithValidPoints > 0 ? totalPointsCaptured / tradesWithValidPoints : 0;

    return {
      totalTrades: trades.length,
      winRate,
      longWinRate,
      shortWinRate,
      avgWin,
      avgLoss,
      avgRr,
      avgPoints,
      totalPointsCaptured
    };
  }, [trades]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      backdropFilter: "blur(2px)"
    }} onClick={onClose}>
      <div 
        style={{
          backgroundColor: "var(--bg-color)",
          borderRadius: "12px",
          border: "1px solid var(--border-color)",
          padding: "32px",
          width: "100%",
          maxWidth: "500px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          maxHeight: "90vh",
          overflowY: "auto"
        }}
        onClick={e => e.stopPropagation()} // Prevent clicks inside modal from closing it
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "26px", fontWeight: 700, letterSpacing: "-0.01em" }}>Trade Analytics</h2>
          <button 
            onClick={onClose}
            style={{ 
              background: "none", border: "none", cursor: "pointer", 
              fontSize: "26px", color: "var(--text-secondary)", lineHeight: 1 
            }}
          >
            &times;
          </button>
        </div>

        {!metrics ? (
          <p style={{ color: "var(--text-secondary)" }}>No trades available to analyze for this period.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Top Level Metric Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ padding: "16px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "4px" }}>Win Rate</div>
                <div style={{ fontSize: "26px", fontWeight: 600, color: metrics.winRate >= 50 ? "#0f7b6c" : "var(--text-primary)" }}>
                  {metrics.winRate.toFixed(1)}%
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>Across {metrics.totalTrades} Trades</div>
              </div>

              <div style={{ padding: "16px", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "4px" }}>Average R:R</div>
                <div style={{ fontSize: "26px", fontWeight: 600 }}>
                  {typeof metrics.avgRr === "number" ? `1 : ${metrics.avgRr.toFixed(2)}` : metrics.avgRr}
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>Avg Win / Avg Loss</div>
              </div>
            </div>

            {/* List Properties */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-color)" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "16px" }}>Average Win</span>
                <span style={{ fontWeight: 500, fontSize: "16px", color: "#0f7b6c" }}>+${metrics.avgWin.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-color)" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "16px" }}>Average Loss</span>
                <span style={{ fontWeight: 500, fontSize: "16px", color: "#eb5757" }}>-${metrics.avgLoss.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-color)" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "16px" }}>Buy (Long) Win Rate</span>
                <span style={{ fontWeight: 500, fontSize: "16px" }}>{metrics.longWinRate.toFixed(1)}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--border-color)" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "16px" }}>Sell (Short) Win Rate</span>
                <span style={{ fontWeight: 500, fontSize: "16px" }}>{metrics.shortWinRate.toFixed(1)}%</span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "8px" }}>
                <div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "16px" }}>Average Points Captured</div>
                  <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>(Per Trade, Multiplier Adj.)</div>
                </div>
                <span style={{ fontWeight: 600, fontSize: "18px", color: metrics.avgPoints >= 0 ? "#0f7b6c" : "#eb5757" }}>
                  {metrics.avgPoints >= 0 ? "+" : ""}{metrics.avgPoints.toFixed(2)} pts
                </span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
