import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CalendarHeatmap from "@/components/CalendarHeatmap";

export const dynamic = "force-dynamic";

export default async function HeatmapPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;
  const trades = await prisma.trade.findMany({
    where: { userId },
    select: { date: true, pnl: true },
  });

  const serializedTrades = trades.map(trade => ({
    date: trade.date.toISOString(),
    pnl: trade.pnl,
  }));

  return (
    <div style={{ paddingTop: "16px", paddingBottom: "64px" }}>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "32px", margin: 0 }}>Calendar Heatmap</h1>
        <p style={{ color: "var(--text-secondary)", margin: 0, marginTop: "4px" }}>Visualize your trading activity and profitability by day.</p>
      </header>

      {trades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px", border: "1px dashed var(--border-color)", borderRadius: "8px", color: "var(--text-secondary)" }}>
          <p style={{ marginBottom: "16px" }}>Not enough data for a heatmap.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "24px", boxShadow: "var(--shadow-sm)" }}>
          <CalendarHeatmap trades={serializedTrades} />
        </div>
      )}
    </div>
  );
}
