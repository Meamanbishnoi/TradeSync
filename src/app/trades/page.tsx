import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TradesTable from "@/components/TradesTable";
import { redirect } from "next/navigation";
import FloatingAddButton from "@/components/FloatingAddButton";

export default async function TradesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;
  const trades = await prisma.trade.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, instrument: true, date: true, session: true,
      direction: true, contractSize: true, setup: true,
      pnl: true, notes: true, rating: true,
    },
  });

  const serializedTrades = trades.map(trade => ({
    ...trade,
    date: trade.date.toISOString(),
  }));

  return (
    <div style={{ paddingTop: "16px", paddingBottom: "64px" }}>
      <FloatingAddButton />

      {trades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px", border: "1px dashed var(--border-color)", borderRadius: "8px", color: "var(--text-secondary)" }}>
          <p style={{ marginBottom: "16px" }}>No trades logged yet.</p>
        </div>
      ) : (
        <TradesTable initialTrades={serializedTrades} />
      )}
    </div>
  );
}
