import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { isAdmin?: boolean }).isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const [totalUsers, totalTrades, totalJournals, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.trade.count(),
    prisma.dailyJournal.count(),
    prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
  ]);

  // Count total images across all trades
  const tradesWithImages = await prisma.trade.findMany({
    where: { NOT: { imageUrls: null } },
    select: { imageUrls: true },
  });
  let totalImages = 0;
  for (const t of tradesWithImages) {
    try { totalImages += JSON.parse(t.imageUrls!).length; } catch {}
  }

  // Blocked users count
  const blockedRows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM "User" WHERE "isBlocked" = true
  `;
  const blockedUsers = Number(blockedRows[0]?.count ?? 0);

  return NextResponse.json({ totalUsers, totalTrades, totalJournals, totalImages, recentUsers, blockedUsers });
}
