import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import EquityCurve from "@/components/EquityCurve";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div style={{ textAlign: "center", marginTop: "120px" }}>
        <h1 style={{ fontSize: "42px", marginBottom: "16px" }}>Your Trading Hub</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "20px" }}>
          A minimalist space to journalise every trade, track emotions, and improve edge.
        </p>
        <Link href="/login" className="notion-button notion-button-primary" style={{ padding: "10px 20px", fontSize: "18px" }}>
          Get Started
        </Link>
      </div>
    );
  }

  const userId = session.user.id;
  const trades = await prisma.trade.findMany({
    where: { userId },
    orderBy: { date: "asc" }, // sorting asc for equity curve chronological order
  });

  const serializedTrades = trades.map((trade: any) => ({
    ...trade,
    date: trade.date.toISOString(),
  }));

  // Calculations
  const totalTrades = trades.length;
  let wins = 0;
  let losses = 0;
  let grossWin = 0;
  let grossLoss = 0;
  let netPnl = 0;

  trades.forEach(t => {
    netPnl += t.pnl;
    if (t.pnl >= 0) {
      wins++;
      grossWin += t.pnl;
    } else {
      losses++;
      grossLoss += Math.abs(t.pnl);
    }
  });

  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const avgWin = wins > 0 ? grossWin / wins : 0;
  const avgLoss = losses > 0 ? grossLoss / losses : 0;
  const avgRRR = (avgWin > 0 && avgLoss > 0) ? (avgWin / avgLoss) : 0;

  // For display, we want recent trades (descending)
  const recentTrades = [...serializedTrades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  const StatTile = ({ label, value, sub, highlight }: { label: string, value: string, sub?: React.ReactNode, highlight?: boolean }) => (
    <div style={{ 
      padding: "20px", 
      backgroundColor: "var(--bg-secondary)", 
      border: "1px solid var(--border-color)", 
      borderRadius: "12px",
      boxShadow: "var(--shadow-sm)"
    }}>
      <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: 700, color: highlight ? (netPnl >= 0 ? "#0f7b6c" : "#eb5757") : "var(--text-primary)" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ paddingTop: "16px", paddingBottom: "64px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "32px", margin: 0 }}>Dashboard</h1>
          <p style={{ color: "var(--text-secondary)", margin: 0, marginTop: "4px" }}>Welcome back to your trading journal.</p>
        </div>
        <Link href="/trade/new" className="notion-button notion-button-primary" style={{ padding: "8px 16px" }}>
          + New Trade
        </Link>
      </header>

      {/* KPI Tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        <StatTile 
          label="Net PNL" 
          value={`${netPnl >= 0 ? '+' : ''}$${Math.abs(netPnl).toFixed(2)}`} 
          highlight 
        />
        <StatTile 
          label="Win Rate" 
          value={`${winRate.toFixed(1)}%`} 
          sub={<span style={{ color: winRate >= 50 ? "#0f7b6c" : "#eb5757" }}>{wins}W - {losses}L</span>}
        />
        <StatTile 
          label="Avg RRR" 
          value={avgRRR > 0 ? avgRRR.toFixed(2) : "—"} 
          sub={`Avg W: $${avgWin.toFixed(0)} | Avg L: $${avgLoss.toFixed(0)}`}
        />
        <StatTile 
          label="Total Trades" 
          value={totalTrades.toString()} 
        />
      </div>

      {/* Main Grid: equity curve left, recent trades right */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px", alignItems: "stretch" }} className="dashboard-grid">
        {/* Equity Curve card */}
        <div className="equity-curve-card" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column", minHeight: "380px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", flexShrink: 0 }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Performance</span>
            <Link href="/analytics" style={{ fontSize: "12px", color: "var(--accent-color)" }}>Full analytics →</Link>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "stretch" }}>
            {trades.length > 1 ? (
              <EquityCurve trades={serializedTrades} />
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: "14px" }}>
                Log more trades to see your curve.
              </div>
            )}
          </div>
        </div>

        {/* Recent Trades card */}
        <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column", minHeight: "380px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexShrink: 0 }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Recent Trades</span>
            <Link href="/trades" style={{ fontSize: "12px", color: "var(--accent-color)" }}>View all →</Link>
          </div>
          {recentTrades.length > 0 ? (
            <div style={{ flex: 1, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <th style={{ padding: "6px 8px", fontWeight: 500, color: "var(--text-secondary)", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Instrument</th>
                    <th style={{ padding: "6px 8px", fontWeight: 500, color: "var(--text-secondary)", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Date</th>
                    <th style={{ padding: "6px 8px", fontWeight: 500, color: "var(--text-secondary)", textAlign: "left", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Dir</th>
                    <th style={{ padding: "6px 8px", fontWeight: 500, color: "var(--text-secondary)", textAlign: "right", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>PNL</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((trade: any) => {
                    const isWin = trade.pnl >= 0;
                    return (
                      <tr key={trade.id} className="notion-table-row" style={{ borderBottom: "1px solid var(--border-color)" }}>
                        <td style={{ padding: 0 }}>
                          <Link href={`/trade/${trade.id}`} style={{ display: "block", padding: "9px 8px", fontWeight: 700, color: "var(--text-primary)" }}>{trade.instrument}</Link>
                        </td>
                        <td style={{ padding: 0 }}>
                          <Link href={`/trade/${trade.id}`} style={{ display: "block", padding: "9px 8px", color: "var(--text-secondary)" }}>{format(new Date(trade.date), "MMM d")}</Link>
                        </td>
                        <td style={{ padding: 0 }}>
                          <Link href={`/trade/${trade.id}`} style={{ display: "block", padding: "9px 8px" }}>
                            <span style={{ padding: "1px 6px", borderRadius: "4px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)", fontSize: "11px", color: "var(--text-secondary)" }}>{trade.direction}</span>
                          </Link>
                        </td>
                        <td style={{ padding: 0, textAlign: "right" }}>
                          <Link href={`/trade/${trade.id}`} style={{ display: "block", padding: "9px 8px", fontWeight: 700, color: isWin ? "#0f7b6c" : "#eb5757" }}>
                            {isWin ? "+" : ""}${trade.pnl.toFixed(2)}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: "14px" }}>
              No trades yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
