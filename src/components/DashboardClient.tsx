"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, startOfDay } from "date-fns";

interface Trade { date: string; pnl: number; }

export default function DashboardClient({ trades }: { trades: Trade[] }) {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement).isContentEditable) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); router.push("/trade/new"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  const todayKey = format(startOfDay(new Date()), "yyyy-MM-dd");
  const todayTrades = trades.filter(t => format(new Date(t.date), "yyyy-MM-dd") === todayKey);
  const todayPnl = todayTrades.reduce((s, t) => s + t.pnl, 0);
  const todayWins = todayTrades.filter(t => t.pnl >= 0).length;
  const hasTodayTrades = todayTrades.length > 0;

  const sorted = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  if (sorted.length > 0) {
    const firstIsWin = sorted[0].pnl >= 0;
    for (const t of sorted) { if ((t.pnl >= 0) === firstIsWin) streak++; else break; }
    if (!firstIsWin) streak = -streak;
  }
  const streakIsWin = streak > 0;
  const streakAbs = Math.abs(streak);

  const Cell = ({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) => (
    <div style={{
      flex: "1 1 0",
      minWidth: 0,
      padding: "12px 14px",
      borderRight: last ? "none" : "1px solid var(--border-color)",
    }}>
      <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px", whiteSpace: "nowrap" }}>{label}</div>
      {children}
    </div>
  );

  return (
    <>
      {/* Desktop: single row */}
      <div className="summary-bar-desktop" style={{
        display: "flex",
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "10px",
        marginBottom: "20px",
        overflow: "hidden",
      }}>
        <Cell label="Today">
          <div style={{ fontSize: "17px", fontWeight: 700, color: hasTodayTrades ? (todayPnl >= 0 ? "#0f7b6c" : "#eb5757") : "var(--text-secondary)" }}>
            {hasTodayTrades ? `${todayPnl >= 0 ? "+" : ""}$${Math.abs(todayPnl).toFixed(2)}` : "—"}
          </div>
        </Cell>
        <Cell label="Trades Today">
          <div style={{ fontSize: "17px", fontWeight: 700 }}>
            {todayTrades.length}
            {hasTodayTrades && <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 400, marginLeft: "5px" }}>{todayWins}W/{todayTrades.length - todayWins}L</span>}
          </div>
        </Cell>
        <Cell label="Streak">
          <div style={{ fontSize: "17px", fontWeight: 700, color: streak === 0 ? "var(--text-secondary)" : streakIsWin ? "#0f7b6c" : "#eb5757" }}>
            {streak === 0 ? "—" : `${streakAbs} ${streakIsWin ? "W" : "L"}`}
          </div>
        </Cell>
        <Cell label="Shortcut" last>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <kbd style={{ fontSize: "11px", padding: "1px 6px", borderRadius: "4px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-secondary)", fontFamily: "monospace" }}>N</kbd>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>New trade</span>
          </div>
        </Cell>
      </div>

      {/* Mobile: 2x2 grid */}
      <div className="summary-bar-mobile" style={{
        display: "none",
        gridTemplateColumns: "1fr 1fr",
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "10px",
        marginBottom: "20px",
        overflow: "hidden",
      }}>
        <div style={{ padding: "12px 14px", borderRight: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Today</div>
          <div style={{ fontSize: "17px", fontWeight: 700, color: hasTodayTrades ? (todayPnl >= 0 ? "#0f7b6c" : "#eb5757") : "var(--text-secondary)" }}>
            {hasTodayTrades ? `${todayPnl >= 0 ? "+" : ""}$${Math.abs(todayPnl).toFixed(2)}` : "—"}
          </div>
        </div>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Trades Today</div>
          <div style={{ fontSize: "17px", fontWeight: 700 }}>
            {todayTrades.length}
            {hasTodayTrades && <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 400, marginLeft: "5px" }}>{todayWins}W/{todayTrades.length - todayWins}L</span>}
          </div>
        </div>
        <div style={{ padding: "12px 14px", borderRight: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Streak</div>
          <div style={{ fontSize: "17px", fontWeight: 700, color: streak === 0 ? "var(--text-secondary)" : streakIsWin ? "#0f7b6c" : "#eb5757" }}>
            {streak === 0 ? "—" : `${streakAbs} ${streakIsWin ? "W" : "L"}`}
          </div>
        </div>
        <div style={{ padding: "12px 14px" }}>
          <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Quick Add</div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Press N</div>
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .summary-bar-desktop { display: none !important; }
          .summary-bar-mobile { display: grid !important; }
        }
      `}</style>
    </>
  );
}
