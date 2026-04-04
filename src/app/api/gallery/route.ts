import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const trades = await prisma.trade.findMany({
    where: { userId: session.user.id, NOT: { imageUrls: null } },
    orderBy: { date: "desc" },
    select: { id: true, instrument: true, direction: true, date: true, pnl: true, imageUrls: true },
  });

  const images: { url: string; tradeId: string; instrument: string; direction: string; date: string; pnl: number }[] = [];

  for (const trade of trades) {
    if (!trade.imageUrls) continue;
    try {
      const urls: string[] = JSON.parse(trade.imageUrls);
      for (const url of urls) {
        images.push({
          url,
          tradeId: trade.id,
          instrument: trade.instrument,
          direction: trade.direction,
          date: trade.date.toISOString(),
          pnl: trade.pnl,
        });
      }
    } catch {}
  }

  return NextResponse.json(images);
}
