"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { format } from "date-fns";

interface Trade {
  date: string;
  pnl: number;
}

interface Point {
  x: number;
  y: number;
  cumPnl: number;
  date: string;
  tradePnl: number;
  index: number;
}

export default function EquityCurve({ trades }: { trades: Trade[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: Point } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { points, min, max, yTicks } = useMemo(() => {
    if (trades.length === 0) return { points: [], min: 0, max: 0, yTicks: [] };

    const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let cumulative = 0;
    const rawPoints = sorted.map((t, i) => {
      cumulative += t.pnl;
      return { cumPnl: cumulative, date: t.date, tradePnl: t.pnl, index: i };
    });

    const values = rawPoints.map(p => p.cumPnl);
    const rawMin = Math.min(0, ...values);
    const rawMax = Math.max(0, ...values);

    // Nice round tick spacing
    const range = rawMax - rawMin || 1;
    const roughStep = range / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const niceSteps = [1, 2, 2.5, 5, 10];
    const step = niceSteps.map(s => s * magnitude).find(s => s >= roughStep) ?? magnitude;

    const niceMin = Math.floor(rawMin / step) * step;
    const niceMax = Math.ceil(rawMax / step) * step;

    const ticks: number[] = [];
    for (let v = niceMin; v <= niceMax + step * 0.01; v += step) {
      ticks.push(parseFloat(v.toFixed(10)));
    }

    return { points: rawPoints, min: niceMin, max: niceMax, yTicks: ticks };
  }, [trades]);

  const W = 800;
  const H = 280;
  const PAD_TOP = 16;
  const PAD_BOTTOM = 36;
  const PAD_LEFT = 72;
  const PAD_RIGHT = 16;

  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;
  const range = max - min || 1;

  const toX = useCallback((i: number) =>
    PAD_LEFT + (points.length > 1 ? (i / (points.length - 1)) * chartW : chartW / 2),
    [points.length, chartW]
  );

  const toY = useCallback((v: number) =>
    PAD_TOP + chartH - ((v - min) / range) * chartH,
    [min, range, chartH, PAD_TOP]
  );

  const computedPoints: Point[] = useMemo(() =>
    points.map(p => ({ ...p, x: toX(p.index), y: toY(p.cumPnl) })),
    [points, toX, toY]
  );

  if (computedPoints.length < 2) return null;

  const zeroY = toY(0);
  const finalPnl = computedPoints[computedPoints.length - 1].cumPnl;
  const isPositive = finalPnl >= 0;
  const lineColor = isPositive ? "#0f7b6c" : "#eb5757";
  const fillColorStart = isPositive ? "rgba(15,123,108,0.18)" : "rgba(235,87,87,0.18)";
  const fillColorEnd = isPositive ? "rgba(15,123,108,0)" : "rgba(235,87,87,0)";

  const pathD = computedPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = computedPoints[computedPoints.length - 1];
  const first = computedPoints[0];
  const fillD = `${pathD} L${last.x.toFixed(1)},${zeroY.toFixed(1)} L${first.x.toFixed(1)},${zeroY.toFixed(1)} Z`;

  const gradientId = `eq-grad-${isPositive ? "pos" : "neg"}`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || computedPoints.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = W / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    // Find nearest point
    let nearest = computedPoints[0];
    let minDist = Math.abs(mouseX - nearest.x);
    for (const p of computedPoints) {
      const d = Math.abs(mouseX - p.x);
      if (d < minDist) { minDist = d; nearest = p; }
    }
    setTooltip({ x: nearest.x, y: nearest.y, point: nearest });
  };

  const fmtPnl = (v: number) => `${v >= 0 ? "+" : ""}$${Math.abs(v).toFixed(2)}`;
  const fmtTick = (v: number) => {
    if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}k`;
    return `$${v.toFixed(0)}`;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Equity Curve</span>
        <div style={{ display: "flex", gap: "16px", alignItems: "baseline" }}>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{computedPoints.length} trades</span>
          <span style={{ fontSize: "16px", fontWeight: 700, color: lineColor }}>{fmtPnl(finalPnl)}</span>
        </div>
      </div>

      <div style={{ border: "1px solid var(--border-color)", borderRadius: "10px", overflow: "hidden", backgroundColor: "var(--bg-secondary)", position: "relative" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", display: "block", cursor: "crosshair" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColorStart} />
              <stop offset="100%" stopColor={fillColorEnd} />
            </linearGradient>
            <clipPath id="chart-clip">
              <rect x={PAD_LEFT} y={PAD_TOP} width={chartW} height={chartH} />
            </clipPath>
          </defs>

          {/* Y-axis grid lines + labels */}
          {yTicks.map(tick => {
            const ty = toY(tick);
            if (ty < PAD_TOP - 2 || ty > PAD_TOP + chartH + 2) return null;
            const isZero = Math.abs(tick) < 0.001;
            return (
              <g key={tick}>
                <line
                  x1={PAD_LEFT} y1={ty} x2={W - PAD_RIGHT} y2={ty}
                  stroke={isZero ? "var(--text-secondary)" : "var(--border-color)"}
                  strokeWidth={isZero ? 1 : 0.5}
                  strokeDasharray={isZero ? "none" : "3 4"}
                  opacity={isZero ? 0.5 : 0.8}
                />
                <text
                  x={PAD_LEFT - 6} y={ty + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="var(--text-secondary)"
                  fontFamily="var(--font-family)"
                >
                  {fmtTick(tick)}
                </text>
              </g>
            );
          })}

          {/* Fill area */}
          <path d={fillD} fill={`url(#${gradientId})`} clipPath="url(#chart-clip)" />

          {/* Main line */}
          <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" clipPath="url(#chart-clip)" />

          {/* Tooltip crosshair */}
          {tooltip && (
            <g>
              <line
                x1={tooltip.x} y1={PAD_TOP}
                x2={tooltip.x} y2={PAD_TOP + chartH}
                stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6"
              />
              <circle cx={tooltip.x} cy={tooltip.y} r="5" fill={lineColor} stroke="var(--bg-secondary)" strokeWidth="2" />
            </g>
          )}

          {/* End dot (always visible) */}
          {!tooltip && (
            <circle cx={last.x} cy={last.y} r="4" fill={lineColor} stroke="var(--bg-secondary)" strokeWidth="2" />
          )}

          {/* X-axis baseline */}
          <line
            x1={PAD_LEFT} y1={PAD_TOP + chartH}
            x2={W - PAD_RIGHT} y2={PAD_TOP + chartH}
            stroke="var(--border-color)" strokeWidth="0.5" opacity="0.8"
          />

          {/* X-axis date labels */}
          {(() => {
            const count = Math.min(6, computedPoints.length);
            const indices = Array.from({ length: count }, (_, i) =>
              Math.round(i * (computedPoints.length - 1) / (count - 1))
            );
            // deduplicate
            const unique = [...new Set(indices)];
            return unique.map(idx => {
              const p = computedPoints[idx];
              return (
                <text
                  key={idx}
                  x={p.x}
                  y={PAD_TOP + chartH + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--text-secondary)"
                  fontFamily="var(--font-family)"
                >
                  {format(new Date(p.date), "MMM d")}
                </text>
              );
            });
          })()}
        </svg>

        {/* Tooltip box — always clamped inside the container */}
        {tooltip && (() => {
          const p = tooltip.point;
          const isWin = p.tradePnl >= 0;
          const svgEl = svgRef.current;
          const svgWidth = svgEl?.getBoundingClientRect().width ?? W;
          const pxX = (tooltip.x / W) * svgWidth;
          const tooltipW = 150;
          const flipLeft = pxX > svgWidth - tooltipW - 16;
          return (
            <div style={{
              position: "absolute",
              top: "8px",
              left: flipLeft ? undefined : `${Math.min(pxX + 10, svgWidth - tooltipW - 8)}px`,
              right: flipLeft ? `${svgWidth - pxX + 10}px` : undefined,
              backgroundColor: "var(--bg-color)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "12px",
              pointerEvents: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              width: `${tooltipW}px`,
              zIndex: 10,
            }}>
              <div style={{ color: "var(--text-secondary)", marginBottom: "5px", fontSize: "11px" }}>
                {format(new Date(p.date), "MMM d, yyyy")}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>Trade</span>
                <span style={{ fontWeight: 600, color: isWin ? "#0f7b6c" : "#eb5757", fontSize: "12px" }}>{fmtPnl(p.tradePnl)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>Total</span>
                <span style={{ fontWeight: 700, color: p.cumPnl >= 0 ? "#0f7b6c" : "#eb5757", fontSize: "12px" }}>{fmtPnl(p.cumPnl)}</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
