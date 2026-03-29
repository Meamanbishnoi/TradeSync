import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TradesTable from "@/components/TradesTable";

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
    orderBy: { createdAt: "desc" },
  });

  const serializedTrades = trades.map((trade: any) => ({
    ...trade,
    date: trade.date.toISOString(),
  }));

  return (
    <div style={{ marginTop: "16px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          {trades.length} trades total
        </p>
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
