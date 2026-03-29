"use client";

import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, eachWeekOfInterval, isSameMonth, addMonths, subMonths } from "date-fns";

interface Trade {
  date: string;
  pnl: number;
}

interface DayData {
  date: Date;
  pnl: number;
  trades: number;
  isCurrentMonth: boolean;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getPnlColor(pnl: number, maxAbs: number, isHovered: boolean = false): string {
  if (pnl === 0 || maxAbs === 0) return isHovered ? "var(--border-color)" : "var(--bg-secondary)";
  const intensity = Math.min(Math.abs(pnl) / maxAbs, 1);
  let alpha = 0.25 + (intensity * 0.65);
  if (isHovered) alpha = Math.min(alpha + 0.15, 1);
  
  return pnl > 0
    ? `rgba(46, 160, 67, ${alpha.toFixed(2)})`
    : `rgba(248, 81, 73, ${alpha.toFixed(2)})`;
}

export default function CalendarHeatmap({ trades }: { trades: Trade[] }) {
  const { dayMap, minMonth, maxMonth } = useMemo(() => {
    const map: Record<string, { pnl: number; trades: number }> = {};
    let min: Date | null = null;
    let max: Date | null = null;
    for (const t of trades) {
      const d = new Date(t.date);
      const key = format(d, "yyyy-MM-dd");
      if (!map[key]) map[key] = { pnl: 0, trades: 0 };
      map[key].pnl += t.pnl;
      map[key].trades++;
      if (!min || d < min) min = d;
      if (!max || d > max) max = d;
    }
    return {
      dayMap: map,
      minMonth: min ? new Date(min.getFullYear(), min.getMonth(), 1) : null,
      maxMonth: max ? new Date(max.getFullYear(), max.getMonth(), 1) : null,
    };
  }, [trades]);

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  if (!minMonth || !maxMonth) return null;

  const canPrev = currentMonth > minMonth;
  const canNext = currentMonth < maxMonth;

  const navBtn = (disabled: boolean, onClick: () => void, label: string) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "32px", height: "32px",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "none",
        border: "1px solid var(--border-color)",
        borderRadius: "6px",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.3 : 1,
        fontSize: "16px",
        color: "var(--text-primary)",
        transition: "background 0.1s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
        Calendar Heatmap
      </div>
      <MonthGrid
        month={currentMonth}
        dayMap={dayMap}
        navLeft={navBtn(canPrev === false, () => setCurrentMonth(m => subMonths(m, 1)), "‹")}
        navRight={navBtn(canNext === false, () => setCurrentMonth(m => addMonths(m, 1)), "›")}
      />
    </div>
  );
}

function MonthGrid({
  month, dayMap, navLeft, navRight,
}: {
  month: Date;
  dayMap: Record<string, { pnl: number; trades: number }>;
  navLeft: React.ReactNode;
  navRight: React.ReactNode;
}) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const { weeks, maxAbs, monthPnl, tradingDays } = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });

    let maxAbs = 0, monthPnl = 0, tradingDays = 0;
    for (const d of days) {
      const data = dayMap[format(d, "yyyy-MM-dd")];
      if (data) {
        maxAbs = Math.max(maxAbs, Math.abs(data.pnl));
        monthPnl += data.pnl;
        tradingDays++;
      }
    }

    const weekStarts = eachWeekOfInterval({ start: startOfWeek(start), end: endOfWeek(end) });
    const weeks = weekStarts.map(weekStart => {
      const weekDays: (DayData | null)[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + d);
        const data = dayMap[format(date, "yyyy-MM-dd")];
        weekDays.push({
          date,
          pnl: data?.pnl ?? 0,
          trades: data?.trades ?? 0,
          isCurrentMonth: isSameMonth(date, month),
        });
      }
      return weekDays;
    });

    return { weeks, maxAbs, monthPnl, tradingDays };
  }, [month, dayMap]);

  return (
    <div>
      {/* Header with nav — two rows so it never overflows on mobile */}
      <div style={{ marginBottom: "12px" }}>
        {/* Row 1: arrows + month name */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {navLeft}
            <span style={{ fontSize: "16px", fontWeight: 700 }}>
              {format(month, "MMMM yyyy")}
            </span>
            {navRight}
          </div>
        </div>
        {/* Row 2: stats */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{tradingDays} trading day{tradingDays !== 1 ? "s" : ""}</span>
          <span style={{ fontSize: "14px", fontWeight: 700, color: monthPnl >= 0 ? "#0f7b6c" : "#eb5757" }}>
            {monthPnl >= 0 ? "+" : ""}${monthPnl.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", marginBottom: "6px" }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: "12px", color: "var(--text-secondary)", padding: "2px 0", fontWeight: 500 }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
            {week.map((day, di) => {
              if (!day) return <div key={di} />;
              const key = format(day.date, "yyyy-MM-dd");
              const hasData = day.trades > 0;
              const isHovered = hoveredDay === key;
              const bg = !day.isCurrentMonth ? "transparent"
                : hasData ? getPnlColor(day.pnl, maxAbs, isHovered)
                : isHovered ? "var(--border-color)" : "var(--bg-secondary)";

              const intensity = hasData ? Math.abs(day.pnl) / (maxAbs || 1) : 0;
              const useLightText = hasData && intensity > 0.4;
              const dayNumColor = useLightText ? "rgba(255,255,255,0.95)" : hasData ? "var(--text-primary)" : "var(--text-secondary)";
              const pnlColor = hasData ? (useLightText ? "rgba(255,255,255,0.85)" : day.pnl >= 0 ? "#43c461" : "#f85149") : "transparent";

              return (
                <div
                  key={di}
                  onMouseEnter={() => setHoveredDay(key)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{
                    position: "relative",
                    height: "68px",
                    borderRadius: "6px",
                    backgroundColor: bg,
                    border: day.isCurrentMonth ? "1px solid var(--border-color)" : "none",
                    opacity: day.isCurrentMonth ? 1 : 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: hasData ? "pointer" : "default",
                    transition: "all 0.15s ease",
                    transform: isHovered && hasData ? "scale(1.08)" : "scale(1)",
                    boxShadow: isHovered && hasData ? "0 4px 12px rgba(0,0,0,0.3)" : "none",
                    zIndex: isHovered ? 10 : 1,
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: hasData ? 600 : 400, color: dayNumColor, lineHeight: 1 }}>
                    {format(day.date, "d")}
                  </span>
                  {hasData && (
                    <span style={{ fontSize: "12px", color: pnlColor, lineHeight: 1, marginTop: "5px", fontWeight: 600 }}>
                      {day.pnl >= 0 ? "+" : ""}{Math.abs(day.pnl) >= 1000 ? `${(day.pnl / 1000).toFixed(1)}k` : day.pnl.toFixed(0)}
                    </span>
                  )}

                  {isHovered && hasData && (
                    <div style={{
                      position: "absolute",
                      bottom: "calc(100% + 6px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "var(--bg-color)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      whiteSpace: "nowrap",
                      zIndex: 100,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                      pointerEvents: "none",
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: "4px" }}>{format(day.date, "MMM d, yyyy")}</div>
                      <div style={{ color: "var(--text-secondary)" }}>{day.trades} trade{day.trades !== 1 ? "s" : ""}</div>
                      <div style={{ fontWeight: 700, color: day.pnl >= 0 ? "#0f7b6c" : "#eb5757" }}>
                        {day.pnl >= 0 ? "+" : ""}${day.pnl.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", justifyContent: "flex-end" }}>
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Loss</span>
        {[0.9, 0.6, 0.3].map(a => (
          <div key={a} style={{ width: "14px", height: "14px", borderRadius: "3px", backgroundColor: `rgba(248,81,73,${a})` }} />
        ))}
        <div style={{ width: "14px", height: "14px", borderRadius: "3px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)" }} />
        {[0.3, 0.6, 0.9].map(a => (
          <div key={a} style={{ width: "14px", height: "14px", borderRadius: "3px", backgroundColor: `rgba(46,160,67,${a})` }} />
        ))}
        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Win</span>
      </div>
    </div>
  );
}
