import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

async function deleteImageFiles(imageUrlsJson: string | null) {
  if (!imageUrlsJson) return;
  try {
    const urls: string[] = JSON.parse(imageUrlsJson);
    for (const url of urls) {
      if (url.startsWith("/uploads/")) {
        const filePath = path.join(process.cwd(), "public", url);
        await unlink(filePath).catch(() => {}); // ignore if already gone
      }
    }
  } catch {}
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const trade = await prisma.trade.findUnique({ where: { id } });

    if (!trade || trade.userId !== userId) {
      return NextResponse.json({ message: "Trade not found" }, { status: 404 });
    }

    return NextResponse.json(trade, { status: 200 });
  } catch (error) {
    console.error("Error fetching trade:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const {
      instrument, direction, date, session: tradeSession,
      entryPrice, exitPrice, setup, emotions, notes,
      imageUrls, contractSize, rating, pnl: rawPnl,
      stopLoss, tags,
    } = await req.json();

    const existingTrade = await prisma.trade.findUnique({ where: { id } });

    if (!existingTrade || existingTrade.userId !== userId) {
      return NextResponse.json({ message: "Trade not found" }, { status: 404 });
    }

    // Delete images that were removed
    const oldUrls: string[] = existingTrade.imageUrls ? JSON.parse(existingTrade.imageUrls) : [];
    const newUrls: string[] = imageUrls ?? [];
    const removedUrls = oldUrls.filter(u => !newUrls.includes(u));
    await deleteImageFiles(JSON.stringify(removedUrls));

    const pnlValue = parseFloat(rawPnl) || 0;
    const priceDiff = parseFloat(exitPrice) - parseFloat(entryPrice);
    const isWin = direction === "Long" ? priceDiff >= 0 : priceDiff <= 0;
    const pnl = isWin ? Math.abs(pnlValue) : -Math.abs(pnlValue);

    const updatedTrade = await prisma.trade.update({
      where: { id },
      data: {
        instrument,
        direction,
        date: new Date(date),
        session: tradeSession || null,
        entryPrice: parseFloat(entryPrice) || 0,
        exitPrice: parseFloat(exitPrice) || 0,
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        pnl,
        setup: setup || null,
        tags: tags && tags.length > 0 ? JSON.stringify(tags) : null,
        emotions: emotions || null,
        notes: notes || null,
        contractSize: contractSize ? parseFloat(contractSize) : null,
        imageUrls: JSON.stringify(newUrls),
        rating: rating ? parseInt(rating) : null,
      },
    });

    return NextResponse.json(updatedTrade, { status: 200 });
  } catch (error) {
    console.error("Error updating trade:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const existingTrade = await prisma.trade.findUnique({ where: { id } });

    if (!existingTrade || existingTrade.userId !== userId) {
      return NextResponse.json({ message: "Trade not found" }, { status: 404 });
    }

    // Clean up uploaded images
    await deleteImageFiles(existingTrade.imageUrls);

    await prisma.trade.delete({ where: { id } });

    return NextResponse.json({ message: "Trade deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting trade:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
