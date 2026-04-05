import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Check permission from DB
  const permRows = await prisma.$queryRaw<{ canViewAnalytics: boolean; isBlocked: boolean }[]>`
    SELECT "canViewAnalytics", "isBlocked" FROM "User" WHERE id = ${session.user.id} LIMIT 1
  `;
  const perms = permRows[0];
  if (perms?.isBlocked) redirect("/login?error=blocked");
  if (perms?.canViewAnalytics === false) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-secondary)" }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "16px", opacity: 0.4 }}>
          <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
        <p style={{ fontSize: "15px", fontWeight: 500 }}>Analytics access restricted</p>
        <p style={{ fontSize: "13px", marginTop: "6px" }}>Your account doesn&apos;t have permission to view analytics. Contact your administrator.</p>
      </div>
    );
  }

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
