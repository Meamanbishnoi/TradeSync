import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const perPage = Math.min(200, Math.max(1, parseInt(searchParams.get("perPage") ?? "24")));

  const trades = await prisma.trade.findMany({
    where: { userId: session.user.id, NOT: { imageUrls: null } },
    orderBy: { date: "desc" },
    select: { id: true, instrument: true, direction: true, date: true, pnl: true, imageUrls: true },
  });

  const allImages: { url: string; tradeId: string; instrument: string; direction: string; date: string; pnl: number }[] = [];

  for (const trade of trades) {
    if (!trade.imageUrls) continue;
    try {
      const urls: string[] = JSON.parse(trade.imageUrls);
      for (const url of urls) {
        allImages.push({ url, tradeId: trade.id, instrument: trade.instrument, direction: trade.direction, date: trade.date.toISOString(), pnl: trade.pnl });
      }
    } catch {}
  }

  const total = allImages.length;
  const start = (page - 1) * perPage;
  const images = allImages.slice(start, start + perPage);

  return NextResponse.json({ images, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}
