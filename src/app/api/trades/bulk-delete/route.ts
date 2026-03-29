import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { ids }: { ids: string[] } = await req.json();

    if (!ids || ids.length === 0) {
      return NextResponse.json({ message: "No trade IDs provided" }, { status: 400 });
    }

    // Fetch trades to get image URLs before deletion
    const trades = await prisma.trade.findMany({
      where: { id: { in: ids }, userId },
      select: { id: true, imageUrls: true },
    });

    // Delete image files
    for (const trade of trades) {
      if (trade.imageUrls) {
        try {
          const urls: string[] = JSON.parse(trade.imageUrls);
          for (const url of urls) {
            if (url.startsWith("/uploads/")) {
              const filePath = path.join(process.cwd(), "public", url);
              await unlink(filePath).catch(() => {});
            }
          }
        } catch {}
      }
    }

    await prisma.trade.deleteMany({
      where: { id: { in: ids }, userId },
    });

    return NextResponse.json({ message: `Deleted ${trades.length} trades` }, { status: 200 });
  } catch (error) {
    console.error("Error bulk deleting trades:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
