import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const trades = await prisma.trade.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "asc" },
    select: {
      id: true, date: true, pnl: true, instrument: true,
      direction: true, session: true, setup: true,
      contractSize: true, rating: true,
    },
  });

  const serialized = trades.map(t => ({ ...t, date: t.date.toISOString() }));

  return (
    <div style={{ paddingTop: "16px", paddingBottom: "64px" }}>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", margin: 0 }}>Analytics</h1>
      </header>

      {trades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px", border: "1px dashed var(--border-color)", borderRadius: "8px", color: "var(--text-secondary)" }}>
          <p>No trades yet. Log some trades to see analytics.</p>
        </div>
      ) : (
        <AnalyticsDashboard allTrades={serialized} />
      )}
    </div>
  );
}
