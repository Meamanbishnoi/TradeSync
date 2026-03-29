import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import EquityCurve from "@/components/EquityCurve";
import StatsPanel from "@/components/StatsPanel";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;
  const trades = await prisma.trade.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });

  const serializedTrades = trades.map((trade: any) => ({
    ...trade,
    date: trade.date.toISOString(),
  }));

  return (
    <div style={{ paddingTop: "16px", paddingBottom: "64px" }}>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "32px", margin: 0 }}>Analytics</h1>
        <p style={{ color: "var(--text-secondary)", margin: 0, marginTop: "4px" }}>Deep dive into your performance metrics.</p>
      </header>

      {trades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px", border: "1px dashed var(--border-color)", borderRadius: "8px", color: "var(--text-secondary)" }}>
          <p style={{ marginBottom: "16px" }}>Not enough data for analytics.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <div style={{ backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "24px", boxShadow: "var(--shadow-sm)" }}>
            <h2 style={{ fontSize: "18px", margin: 0, marginBottom: "16px" }}>Equity Curve</h2>
            <div style={{ height: "300px" }}>
              <EquityCurve trades={serializedTrades} />
            </div>
          </div>
          
          <StatsPanel trades={serializedTrades} />
        </div>
      )}
    </div>
  );
}
