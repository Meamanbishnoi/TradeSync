import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TradesTable from "@/components/TradesTable";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;
  const trades = await prisma.trade.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const serializedTrades = trades.map((trade: any) => ({
    ...trade,
    date: trade.date.toISOString(),
  }));

  return (
    <div style={{ paddingTop: "16px", paddingBottom: "64px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "28px", margin: 0 }}>Trade History</h1>
          <p style={{ color: "var(--text-secondary)", margin: 0, marginTop: "4px", fontSize: "14px" }}>Review, search, and manage your logged trades.</p>
        </div>
        <Link href="/trade/new" className="notion-button notion-button-primary" style={{ padding: "8px 16px" }}>
          + New Trade
        </Link>
      </header>

      {trades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px", border: "1px dashed var(--border-color)", borderRadius: "8px", color: "var(--text-secondary)" }}>
          <p style={{ marginBottom: "16px" }}>No trades logged yet.</p>
          <Link href="/trade/new" className="notion-button">Log your first trade</Link>
        </div>
      ) : (
        <TradesTable initialTrades={serializedTrades} />
      )}
    </div>
  );
}
