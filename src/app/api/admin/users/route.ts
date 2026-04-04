import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as { isAdmin?: boolean }).isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, createdAt: true, emailVerified: true },
  });

  // Fetch admin columns via raw SQL
  const adminCols = await prisma.$queryRaw<{
    id: string; isAdmin: boolean; isBlocked: boolean;
    canAddTrades: boolean; canViewAnalytics: boolean; canExport: boolean;
    maxTrades: number | null; maxImages: number | null;
  }[]>`SELECT id, "isAdmin", "isBlocked", "canAddTrades", "canViewAnalytics", "canExport", "maxTrades", "maxImages" FROM "User"`;

  const colMap = Object.fromEntries(adminCols.map(r => [r.id, r]));

  // Trade + image counts per user
  const tradeCounts = await prisma.trade.groupBy({ by: ["userId"], _count: { id: true } });
  const tradeMap = Object.fromEntries(tradeCounts.map(r => [r.userId, r._count.id]));

  const tradesWithImages = await prisma.trade.findMany({
    where: { NOT: { imageUrls: null } },
    select: { userId: true, imageUrls: true },
  });
  const imageMap: Record<string, number> = {};
  for (const t of tradesWithImages) {
    try {
      const urls = JSON.parse(t.imageUrls!);
      imageMap[t.userId] = (imageMap[t.userId] ?? 0) + urls.length;
    } catch {}
  }

  const result = users.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    ...(colMap[u.id] ?? { isAdmin: false, isBlocked: false, canAddTrades: true, canViewAnalytics: true, canExport: true, maxTrades: null, maxImages: null }),
    tradeCount: tradeMap[u.id] ?? 0,
    imageCount: imageMap[u.id] ?? 0,
  }));

  return NextResponse.json(result);
}
