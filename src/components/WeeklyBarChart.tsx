"use client";

import { useMemo } from "react";
import { format, subDays, startOfDay } from "date-fns";

interface Trade {
  date: string;
  pnl: number;
}

export default function WeeklyBarChart({ trades }: { trades: Trade[] }) {
  const days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i);
      const key = format(d, "yyyy-MM-dd");
      const dayTrades = trades.filter(t => format(new Date(t.date), "yyyy-MM-dd") === key);
      const pnl = dayTrades.reduce((s, t) => s + t.pnl, 0);
      return { label: format(d, "EEE"), key, pnl, count: dayTrades.length };
    });
  }, [trades]);

  const maxAbs = Math.max(...days.map(d => Math.abs(d.pnl)), 1);
  const BAR_MAX_H = 48;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: `${BAR_MAX_H + 28}px` }}>
        {days.map(day => {
          const h = Math.max((Math.abs(day.pnl) / maxAbs) * BAR_MAX_H, day.count > 0 ? 3 : 0);
          const isPos = day.pnl >= 0;
          const color = day.count === 0 ? "var(--border-color)" : isPos ? "rgba(15,123,108,0.7)" : "rgba(235,87,87,0.7)";
          const isToday = day.key === format(new Date(), "yyyy-MM-dd");
          return (
            <div key={day.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              {/* Bar */}
              <div style={{ width: "100%", height: `${BAR_MAX_H}px`, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <div
                  title={day.count > 0 ? `${day.label}: ${day.pnl >= 0 ? "+" : ""}$${day.pnl.toFixed(0)} (${day.count} trade${day.count !== 1 ? "s" : ""})` : `${day.label}: No trades`}
                  style={{
                    width: "100%", height: `${h}px`,
                    backgroundColor: color,
                    borderRadius: "3px 3px 0 0",
                    transition: "height 0.3s ease",
                    minHeight: day.count > 0 ? "3px" : "0",
                  }}
                />
              </div>
              {/* Label */}
              <span style={{
                fontSize: "10px",
                color: isToday ? "var(--text-primary)" : "var(--text-secondary)",
                fontWeight: isToday ? 700 : 400,
              }}>
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
