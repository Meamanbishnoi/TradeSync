"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, startOfDay } from "date-fns";

interface Trade {
  date: string;
  pnl: number;
}

interface Props {
  trades: Trade[];
}

export default function DashboardClient({ trades }: Props) {
  const router = useRouter();

  // Keyboard shortcut: N → new trade
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement).isContentEditable) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        router.push("/trade/new");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  // Today's stats
  const todayKey = format(startOfDay(new Date()), "yyyy-MM-dd");
  const todayTrades = trades.filter(t => format(new Date(t.date), "yyyy-MM-dd") === todayKey);
  const todayPnl = todayTrades.reduce((s, t) => s + t.pnl, 0);
  const todayWins = todayTrades.filter(t => t.pnl >= 0).length;

  // Current win streak (trade-level, from most recent)
  const sorted = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  if (sorted.length > 0) {
    const firstIsWin = sorted[0].pnl >= 0;
    for (const t of sorted) {
      if ((t.pnl >= 0) === firstIsWin) streak++;
      else break;
    }
    if (!firstIsWin) streak = -streak; // negative = losing streak
  }

  const hasTodayTrades = todayTrades.length > 0;
  const streakIsWin = streak > 0;
  const streakAbs = Math.abs(streak);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0",
      backgroundColor: "var(--bg-secondary)",
      border: "1px solid var(--border-color)",
      borderRadius: "10px",
      marginBottom: "20px",
      overflow: "hidden",
      flexWrap: "wrap",
    }}>
      {/* Today's PNL */}
      <div style={{ flex: "1 1 120px", padding: "12px 16px", borderRight: "1px solid var(--border-color)" }}>
        <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>Today</div>
        <div style={{ fontSize: "18px", fontWeight: 700, color: hasTodayTrades ? (todayPnl >= 0 ? "#0f7b6c" : "#eb5757") : "var(--text-secondary)" }}>
          {hasTodayTrades ? `${todayPnl >= 0 ? "+" : ""}$${Math.abs(todayPnl).toFixed(2)}` : "—"}
        </div>
      </div>

      {/* Today's trades */}
      <div style={{ flex: "1 1 100px", padding: "12px 16px", borderRight: "1px solid var(--border-color)" }}>
        <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>Trades Today</div>
        <div style={{ fontSize: "18px", fontWeight: 700 }}>
          {todayTrades.length}
          {hasTodayTrades && <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 400, marginLeft: "6px" }}>{todayWins}W / {todayTrades.length - todayWins}L</span>}
        </div>
      </div>

      {/* Streak */}
      <div style={{ flex: "1 1 120px", padding: "12px 16px", borderRight: "1px solid var(--border-color)" }}>
        <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>Streak</div>
        <div style={{ fontSize: "18px", fontWeight: 700, color: streak === 0 ? "var(--text-secondary)" : streakIsWin ? "#0f7b6c" : "#eb5757" }}>
          {streak === 0 ? "—" : `${streakAbs} ${streakIsWin ? "W" : "L"}`}
        </div>
      </div>

      {/* Keyboard hint */}
      <div style={{ flex: "1 1 120px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "6px" }}>
        <kbd style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", color: "var(--text-secondary)", fontFamily: "monospace" }}>N</kbd>
        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>New trade</span>
      </div>
    </div>
  );
}
