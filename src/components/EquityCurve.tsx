"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { format } from "date-fns";

interface Trade { date: string; pnl: number; }
interface Point { x: number; y: number; cumPnl: number; date: string; tradePnl: number; index: number; }

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

export default function EquityCurve({ trades }: { trades: Trade[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [tooltip, setTooltip] = useState<{ px: number; point: Point } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const H = 220;
  const PAD_T = 12;
  const PAD_B = 32;
  const PAD_L = 56;
  const PAD_R = 12;
  const chartW = Math.max(width - PAD_L - PAD_R, 1);
  const chartH = H - PAD_T - PAD_B;

  const { points, yTicks, min, max } = useMemo(() => {
    if (trades.length < 2) return { points: [], yTicks: [], min: 0, max: 0 };
    const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cum = 0;
    const raw = sorted.map((t, i) => ({ cumPnl: (cum += t.pnl), date: t.date, tradePnl: t.pnl, index: i }));
    const vals = raw.map(p => p.cumPnl);
    const rawMin = Math.min(0, ...vals);
    const rawMax = Math.max(0, ...vals);
    const range = rawMax - rawMin || 1;
    const roughStep = range / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const step = [1, 2, 2.5, 5, 10].map(s => s * mag).find(s => s >= roughStep) ?? mag;
    const nMin = Math.floor(rawMin / step) * step;
    const nMax = Math.ceil(rawMax / step) * step;
    const ticks: number[] = [];
    for (let v = nMin; v <= nMax + step * 0.01; v += step) ticks.push(parseFloat(v.toFixed(10)));
    return { points: raw, yTicks: ticks, min: nMin, max: nMax };
  }, [trades]);

  const range = max - min || 1;
  const toX = (i: number) => PAD_L + (points.length > 1 ? (i / (points.length - 1)) * chartW : chartW / 2);
  const toY = (v: number) => PAD_T + chartH - ((v - min) / range) * chartH;

  const computed: Point[] = useMemo(() =>
    points.map(p => ({ ...p, x: toX(p.index), y: toY(p.cumPnl) })),
    [points, width, min, range, chartW, chartH]
  );

  if (computed.length < 2) return null;

  const last = computed[computed.length - 1];
  const finalPnl = last.cumPnl;
  const isPos = finalPnl >= 0;
  const color = isPos ? "#10b981" : "#ef4444";
  const fillStart = isPos ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)";
  const fillEnd = "rgba(0,0,0,0)";
  const zeroY = toY(0);
  const pathD = smoothPath(computed);
  const fillD = `${pathD} L${last.x},${zeroY} L${computed[0].x},${zeroY} Z`;

  const fmtV = (v: number) => {
    const abs = Math.abs(v);
    const s = abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${abs.toFixed(0)}`;
    return v < 0 ? `-${s}` : s;
  };

  // X-axis labels: pick up to 5 evenly spaced
  const xCount = Math.min(5, computed.length);
  const xIndices = Array.from({ length: xCount }, (_, i) => Math.round(i * (computed.length - 1) / (xCount - 1)));
  const xLabels = [...new Set(xIndices)].map(i => computed[i]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * width;
    let nearest = computed[0];
    let minD = Math.abs(mx - nearest.x);
    for (const p of computed) { const d = Math.abs(mx - p.x); if (d < minD) { minD = d; nearest = p; } }
    setTooltip({ px: nearest.x, point: nearest });
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Equity Curve</span>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{computed.length} trades</span>
          <span style={{ fontSize: "15px", fontWeight: 700, color: color }}>{finalPnl >= 0 ? "+" : ""}{fmtV(finalPnl)}</span>
        </div>
      </div>

      {/* Chart */}
      <div ref={containerRef} style={{ position: "relative", width: "100%", borderRadius: "8px", overflow: "hidden", backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)" }}>
        <svg
          width="100%"
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          preserveAspectRatio="none"
          style={{ display: "block", cursor: "crosshair" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id="ec-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillStart} />
              <stop offset="100%" stopColor={fillEnd} />
            </linearGradient>
          </defs>

          {/* Y grid lines */}
          {yTicks.map(tick => {
            const ty = toY(tick);
            if (ty < PAD_T - 2 || ty > PAD_T + chartH + 2) return null;
            const isZero = Math.abs(tick) < 0.001;
            return (
              <line key={tick}
                x1={PAD_L} y1={ty} x2={width - PAD_R} y2={ty}
                stroke={isZero ? "var(--text-secondary)" : "var(--border-color)"}
                strokeWidth={isZero ? 1 : 0.5}
                strokeDasharray={isZero ? undefined : "4 4"}
                opacity={isZero ? 0.4 : 0.6}
              />
            );
          })}

          {/* Fill */}
          <path d={fillD} fill="url(#ec-fill)" />

          {/* Line */}
          <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Crosshair + dot */}
          {tooltip && (
            <g>
              <line x1={tooltip.px} y1={PAD_T} x2={tooltip.px} y2={PAD_T + chartH}
                stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
              <circle cx={tooltip.px} cy={tooltip.point.y} r="5" fill={color} stroke="var(--bg-color)" strokeWidth="2" />
            </g>
          )}

          {/* End dot */}
          {!tooltip && <circle cx={last.x} cy={last.y} r="4" fill={color} stroke="var(--bg-color)" strokeWidth="2" />}
        </svg>

        {/* Y-axis labels — HTML overlay, always readable */}
        <div style={{ position: "absolute", top: 0, left: 0, height: H, width: PAD_L, pointerEvents: "none" }}>
          {yTicks.map(tick => {
            const ty = toY(tick);
            if (ty < PAD_T - 2 || ty > PAD_T + chartH + 2) return null;
            return (
              <div key={tick} style={{
                position: "absolute", right: "6px",
                top: ty - 8,
                fontSize: "11px", color: "var(--text-secondary)",
                textAlign: "right", whiteSpace: "nowrap", lineHeight: 1,
              }}>
                {fmtV(tick)}
              </div>
            );
          })}
        </div>

        {/* X-axis labels — HTML overlay */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: PAD_B, pointerEvents: "none" }}>
          {xLabels.map((p, i) => {
            const pct = ((p.x - PAD_L) / chartW) * 100;
            const anchor = i === 0 ? "left" : i === xLabels.length - 1 ? "right" : "center";
            return (
              <div key={p.index} style={{
                position: "absolute",
                left: anchor === "right" ? undefined : `${pct}%`,
                right: anchor === "right" ? "0" : undefined,
                transform: anchor === "center" ? "translateX(-50%)" : anchor === "left" ? "translateX(0)" : undefined,
                bottom: "6px",
                fontSize: "11px", color: "var(--text-secondary)", whiteSpace: "nowrap",
              }}>
                {format(new Date(p.date), "MMM d")}
              </div>
            );
          })}
        </div>

        {/* Tooltip box */}
        {tooltip && (() => {
          const p = tooltip.point;
          const pct = ((tooltip.px - PAD_L) / chartW) * 100;
          const flipLeft = pct > 60;
          return (
            <div style={{
              position: "absolute", top: "8px",
              left: flipLeft ? undefined : `calc(${pct}% + 12px)`,
              right: flipLeft ? `calc(${100 - pct}% + 12px)` : undefined,
              backgroundColor: "var(--bg-color)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px", padding: "8px 12px",
              fontSize: "12px", pointerEvents: "none",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              minWidth: "140px", zIndex: 20,
            }}>
              <div style={{ color: "var(--text-secondary)", marginBottom: "5px", fontSize: "11px" }}>
                {format(new Date(p.date), "MMM d, yyyy")}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Trade</span>
                <span style={{ fontWeight: 600, color: p.tradePnl >= 0 ? "#10b981" : "#ef4444" }}>
                  {p.tradePnl >= 0 ? "+" : ""}{fmtV(p.tradePnl)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Total</span>
                <span style={{ fontWeight: 700, color: p.cumPnl >= 0 ? "#10b981" : "#ef4444" }}>
                  {p.cumPnl >= 0 ? "+" : ""}{fmtV(p.cumPnl)}
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
