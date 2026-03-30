"use client";

import { useMemo } from "react";
import { format, startOfDay } from "date-fns";

interface Trade {
  date: string;
  pnl: number;
  direction?: string;
  setup?: string | null;
}

const DOW_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DOW_SHORT  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StatsPanel({ trades }: { trades: Trade[] }) {
  const { streaks, dowStats, monthlyRows } = useMemo(() => {
    if (trades.length === 0) return { streaks: null, dowStats: null, monthlyRows: [] };

    // ── Day-level aggregation ──────────────────────────────────────────────
    const dayMap: Record<string, { pnl: number; trades: number }> = {};
    for (const t of trades) {
      const key = format(startOfDay(new Date(t.date)), "yyyy-MM-dd");
      if (!dayMap[key]) dayMap[key] = { pnl: 0, trades: 0 };
      dayMap[key].pnl += t.pnl;
      dayMap[key].trades++;
    }

    const tradingDays = Object.entries(dayMap)
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Streak tracking (day-wise) ─────────────────────────────────────────
    let currentStreak = 0;
    let currentType: "win" | "loss" | null = null;
    let longestWin = 0;
    let longestLoss = 0;
    let tempWin = 0;
    let tempLoss = 0;

    for (const day of tradingDays) {
      const isWin = day.pnl >= 0;
      if (isWin) {
        tempWin++;
        tempLoss = 0;
        longestWin = Math.max(longestWin, tempWin);
      } else {
        tempLoss++;
        tempWin = 0;
        longestLoss = Math.max(longestLoss, tempLoss);
      }
    }

    // Current streak from the end
    if (tradingDays.length > 0) {
      const lastIsWin = tradingDays[tradingDays.length - 1].pnl >= 0;
      currentType = lastIsWin ? "win" : "loss";
      currentStreak = 0;
      for (let i = tradingDays.length - 1; i >= 0; i--) {
        const dayIsWin = tradingDays[i].pnl >= 0;
        if (dayIsWin === lastIsWin) currentStreak++;
        else break;
      }
    }

    // ── Day of week stats ──────────────────────────────────────────────────
    const dowMap: Record<number, { pnl: number; wins: number; total: number }> = {};
    for (const day of tradingDays) {
      const dow = new Date(day.date).getDay();
      if (!dowMap[dow]) dowMap[dow] = { pnl: 0, wins: 0, total: 0 };
      dowMap[dow].pnl += day.pnl;
      dowMap[dow].total++;
      if (day.pnl >= 0) dowMap[dow].wins++;
    }

    const dowRows = Object.entries(dowMap).map(([dow, v]) => ({
      dow: parseInt(dow),
      label: DOW_LABELS[parseInt(dow)],
      short: DOW_SHORT[parseInt(dow)],
      pnl: v.pnl,
      winRate: (v.wins / v.total) * 100,
      total: v.total,
    })).sort((a, b) => a.dow - b.dow);

    const bestDay  = [...dowRows].sort((a, b) => b.pnl - a.pnl)[0];
    const worstDay = [...dowRows].sort((a, b) => a.pnl - b.pnl)[0];

    // ── Monthly summary ────────────────────────────────────────────────────
    const monthMap: Record<string, { pnl: number; wins: number; losses: number; trades: number; grossWin: number; grossLoss: number }> = {};
    for (const t of trades) {
      const key = format(new Date(t.date), "yyyy-MM");
      if (!monthMap[key]) monthMap[key] = { pnl: 0, wins: 0, losses: 0, trades: 0, grossWin: 0, grossLoss: 0 };
      monthMap[key].pnl += t.pnl;
      monthMap[key].trades++;
      if (t.pnl >= 0) {
        monthMap[key].wins++;
        monthMap[key].grossWin += t.pnl;
      } else {
        monthMap[key].losses++;
        monthMap[key].grossLoss += Math.abs(t.pnl);
      }
    }

    const monthlyRows = Object.entries(monthMap)
      .map(([key, v]) => ({
        key,
        label: format(new Date(key + "-01"), "MMM yyyy"),
        pnl: v.pnl,
        trades: v.trades,
        wins: v.wins,
        losses: v.losses,
        winRate: (v.wins / v.trades) * 100,
        grossWin: v.grossWin,
        grossLoss: v.grossLoss,
        rrr: (v.wins > 0 && v.losses > 0) ? (v.grossWin / v.wins) / (v.grossLoss / v.losses) : null,
      }))
      .sort((a, b) => b.key.localeCompare(a.key));

    return {
      streaks: { currentStreak, currentType, longestWin, longestLoss },
      dowStats: { rows: dowRows, bestDay, worstDay },
      monthlyRows,
    };
  }, [trades]);

  if (!streaks || !dowStats) return null;

  const pnlColor = (v: number) => v >= 0 ? "#0f7b6c" : "#eb5757";
  const fmtPnl = (v: number) => `${v >= 0 ? "+" : ""}$${Math.abs(v).toFixed(2)}`;

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "14px" }}>
      {children}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginBottom: "32px" }}>

      {/* ── Streak Tracking ── */}
      <div>
        <SectionLabel>Streak Tracking</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
          <StatCard
            label="Current Streak"
            value={`${streaks.currentStreak} day${streaks.currentStreak !== 1 ? "s" : ""}`}
            sub={streaks.currentType === "win" ? "Winning" : "Losing"}
            color={streaks.currentType === "win" ? "#0f7b6c" : "#eb5757"}
          />
          <StatCard
            label="Longest Win Streak"
            value={`${streaks.longestWin} day${streaks.longestWin !== 1 ? "s" : ""}`}
            color="#0f7b6c"
          />
          <StatCard
            label="Longest Loss Streak"
            value={`${streaks.longestLoss} day${streaks.longestLoss !== 1 ? "s" : ""}`}
            color="#eb5757"
          />
        </div>
      </div>

      {/* ── Day of Week Stats ── */}
      <div>
        <SectionLabel>Day of Week Performance</SectionLabel>

        {/* Best / Worst callout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div style={{ padding: "14px 16px", backgroundColor: "rgba(15,123,108,0.08)", border: "1px solid rgba(15,123,108,0.2)", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", color: "#0f7b6c", fontWeight: 600, marginBottom: "4px" }}>Best Day</div>
            <div style={{ fontSize: "18px", fontWeight: 700 }}>{dowStats.bestDay.label}</div>
            <div style={{ fontSize: "13px", color: "#0f7b6c", marginTop: "2px" }}>{fmtPnl(dowStats.bestDay.pnl)} · {dowStats.bestDay.winRate.toFixed(0)}% WR</div>
          </div>
          <div style={{ padding: "14px 16px", backgroundColor: "rgba(235,87,87,0.08)", border: "1px solid rgba(235,87,87,0.2)", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", color: "#eb5757", fontWeight: 600, marginBottom: "4px" }}>Worst Day</div>
            <div style={{ fontSize: "18px", fontWeight: 700 }}>{dowStats.worstDay.label}</div>
            <div style={{ fontSize: "13px", color: "#eb5757", marginTop: "2px" }}>{fmtPnl(dowStats.worstDay.pnl)} · {dowStats.worstDay.winRate.toFixed(0)}% WR</div>
          </div>
        </div>

        {/* Bar chart per day */}
        <DowBarChart rows={dowStats.rows} />
      </div>

      {/* ── Monthly Summary Table ── */}
      {monthlyRows.length > 0 && (
        <div>
          <SectionLabel>Monthly Summary</SectionLabel>
          <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}>
                  {["Month", "Trades", "Wins", "Losses", "Win Rate", "Avg RRR", "PNL"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", fontWeight: 500, textAlign: h === "PNL" ? "right" : "left", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyRows.map((row, i) => (
                  <tr key={row.key} style={{ borderBottom: i < monthlyRows.length - 1 ? "1px solid var(--border-color)" : "none" }} className="notion-table-row">
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>{row.label}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>{row.trades}</td>
                    <td style={{ padding: "10px 14px", color: "#0f7b6c" }}>{row.wins}</td>
                    <td style={{ padding: "10px 14px", color: "#eb5757" }}>{row.losses}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, height: "4px", backgroundColor: "var(--border-color)", borderRadius: "2px", minWidth: "60px" }}>
                          <div style={{ width: `${row.winRate}%`, height: "100%", backgroundColor: row.winRate >= 50 ? "#0f7b6c" : "#eb5757", borderRadius: "2px" }} />
                        </div>
                        <span style={{ color: row.winRate >= 50 ? "#0f7b6c" : "#eb5757", fontWeight: 500, minWidth: "36px" }}>{row.winRate.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 500, color: "var(--text-secondary)" }}>
                      {row.rrr !== null ? `${row.rrr.toFixed(2)}` : "—"}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: pnlColor(row.pnl) }}>
                      {fmtPnl(row.pnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totals row */}
              <tfoot>
                <tr style={{ borderTop: "2px solid var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700 }}>Total</td>
                  <td style={{ padding: "10px 14px", fontWeight: 600 }}>{monthlyRows.reduce((s, r) => s + r.trades, 0)}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0f7b6c" }}>{monthlyRows.reduce((s, r) => s + r.wins, 0)}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "#eb5757" }}>{monthlyRows.reduce((s, r) => s + r.losses, 0)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    {(() => {
                      const totalWins = monthlyRows.reduce((s, r) => s + r.wins, 0);
                      const totalTrades = monthlyRows.reduce((s, r) => s + r.trades, 0);
                      const wr = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ flex: 1, height: "4px", backgroundColor: "var(--border-color)", borderRadius: "2px", minWidth: "60px" }}>
                            <div style={{ width: `${wr}%`, height: "100%", backgroundColor: wr >= 50 ? "#0f7b6c" : "#eb5757", borderRadius: "2px" }} />
                          </div>
                          <span style={{ color: wr >= 50 ? "#0f7b6c" : "#eb5757", fontWeight: 600, minWidth: "36px" }}>{wr.toFixed(0)}%</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-secondary)" }}>
                    {(() => {
                      const gWin = monthlyRows.reduce((s, r) => s + r.grossWin, 0);
                      const gLoss = monthlyRows.reduce((s, r) => s + r.grossLoss, 0);
                      const tWins = monthlyRows.reduce((s, r) => s + r.wins, 0);
                      const tLosses = monthlyRows.reduce((s, r) => s + r.losses, 0);
                      const avgW = tWins > 0 ? gWin / tWins : 0;
                      const avgL = tLosses > 0 ? gLoss / tLosses : 0;
                      return (avgW > 0 && avgL > 0) ? (avgW / avgL).toFixed(2) : "—";
                    })()}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: pnlColor(monthlyRows.reduce((s, r) => s + r.pnl, 0)) }}>
                    {fmtPnl(monthlyRows.reduce((s, r) => s + r.pnl, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ padding: "16px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: "22px", fontWeight: 700, color: color || "var(--text-primary)" }}>{value}</div>
      {sub && <div style={{ fontSize: "12px", color: color || "var(--text-secondary)", marginTop: "2px" }}>{sub}</div>}
    </div>
  );
}

function DowBarChart({ rows }: { rows: { dow: number; short: string; pnl: number; winRate: number; total: number }[] }) {
  const maxAbs = Math.max(...rows.map(r => Math.abs(r.pnl)), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {rows.map(row => {
        const barWidth = (Math.abs(row.pnl) / maxAbs) * 100;
        const isPos = row.pnl >= 0;
        return (
          <div key={row.dow} style={{ display: "grid", gridTemplateColumns: "56px 1fr 80px 56px", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>{row.short}</span>
            <div style={{ height: "8px", backgroundColor: "var(--border-color)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{
                width: `${barWidth}%`,
                height: "100%",
                backgroundColor: isPos ? "#0f7b6c" : "#eb5757",
                borderRadius: "4px",
                transition: "width 0.3s ease",
              }} />
            </div>
            <span style={{ fontSize: "13px", fontWeight: 600, color: isPos ? "#0f7b6c" : "#eb5757", textAlign: "right" }}>
              {row.pnl >= 0 ? "+" : ""}${Math.abs(row.pnl) >= 1000 ? `${(row.pnl / 1000).toFixed(1)}k` : row.pnl.toFixed(0)}
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", textAlign: "right" }}>
              {row.winRate.toFixed(0)}% WR
            </span>
          </div>
        );
      })}
    </div>
  );
}
