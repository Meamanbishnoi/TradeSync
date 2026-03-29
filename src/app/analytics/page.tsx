import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import EquityCurve from "@/components/EquityCurve";
import StatsPanel from "@/components/StatsPanel";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;
  const trades = await prisma.trade.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });

  const serializedTrades = trades.map((trade: any) => ({
    ...trade,
    date: trade.date.toISOString(),
  }));

  // KPI calculations
  let wins = 0, losses = 0, grossWin = 0, grossLoss = 0, netPnl = 0;
  trades.forEach(t => {
    netPnl += t.pnl;
    if (t.pnl >= 0) { wins++; grossWin += t.pnl; }
    else { losses++; grossLoss += Math.abs(t.pnl); }
  });
  const totalTrades = trades.length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const avgWin = wins > 0 ? grossWin / wins : 0;
  const avgLoss = losses > 0 ? grossLoss / losses : 0;
  const avgRRR = avgWin > 0 && avgLoss > 0 ? avgWin / avgLoss : 0;
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;

  const kpis = [
    { label: "Net PNL", value: `${netPnl >= 0 ? "+" : ""}$${Math.abs(netPnl).toFixed(2)}`, color: netPnl >= 0 ? "#0f7b6c" : "#eb5757" },
    { label: "Win Rate", value: `${winRate.toFixed(1)}%`, sub: `${wins}W — ${losses}L`, color: winRate >= 50 ? "#0f7b6c" : "#eb5757" },
    { label: "Avg RRR", value: avgRRR > 0 ? avgRRR.toFixed(2) : "—", sub: `W: $${avgWin.toFixed(0)} / L: $${avgLoss.toFixed(0)}` },
    { label: "Profit Factor", value: isFinite(profitFactor) ? profitFactor.toFixed(2) : "∞", color: profitFactor >= 1 ? "#0f7b6c" : "#eb5757" },
    { label: "Total Trades", value: totalTrades.toString() },
    { label: "Gross Profit", value: `$${grossWin.toFixed(2)}`, color: "#0f7b6c" },
    { label: "Gross Loss", value: `-$${grossLoss.toFixed(2)}`, color: "#eb5757" },
    { label: "Best Trade", value: trades.length ? `+$${Math.max(...trades.map(t => t.pnl)).toFixed(2)}` : "—", color: "#0f7b6c" },
  ];

  return (
    <div style={{ paddingTop: "16px", paddingBottom: "64px" }}>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", margin: 0 }}>Analytics</h1>
        <p style={{ color: "var(--text-secondary)", margin: 0, marginTop: "4px", fontSize: "14px" }}>Deep dive into your performance metrics.</p>
      </header>

      {trades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px", border: "1px dashed var(--border-color)", borderRadius: "8px", color: "var(--text-secondary)" }}>
          <p>No trades yet. Log some trades to see analytics.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* KPI grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
            {kpis.map(k => (
              <div key={k.label} style={{ padding: "16px 18px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: k.color ?? "var(--text-primary)", lineHeight: 1 }}>{k.value}</div>
                {k.sub && <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>{k.sub}</div>}
              </div>
            ))}
          </div>

          {/* Equity Curve */}
          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Equity Curve</div>
            <EquityCurve trades={serializedTrades} />
          </div>

          {/* Stats Panel */}
          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>Detailed Breakdown</div>
            <StatsPanel trades={serializedTrades} />
          </div>

        </div>
      )}
    </div>
  );
}
