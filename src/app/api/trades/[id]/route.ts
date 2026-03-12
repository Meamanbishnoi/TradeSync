import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const { instrument, direction, date, session: tradeSession, entryPrice, exitPrice, setup, emotions, notes, imageUrls, contractSize, rating, pnl: rawPnl } = await req.json();

    const existingTrade = await prisma.trade.findUnique({
      where: { id },
    });

    if (!existingTrade || existingTrade.userId !== userId) {
      return NextResponse.json({ message: "Trade not found" }, { status: 404 });
    }

    // Auto-compute PNL sign based on entry/exit and direction
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
        session: tradeSession,
        entryPrice: parseFloat(entryPrice) || 0,
        exitPrice: parseFloat(exitPrice) || 0,
        pnl,
        setup,
        emotions,
        notes,
        contractSize: contractSize ? parseFloat(contractSize) : null,
        imageUrls: imageUrls ? JSON.stringify(imageUrls) : "[]",
        rating: rating ? parseInt(rating) : null,
      },
    });

    return NextResponse.json(updatedTrade, { status: 200 });
  } catch (error) {
    console.error("Error updating trade:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;

    const existingTrade = await prisma.trade.findUnique({
      where: { id },
    });

    if (!existingTrade || existingTrade.userId !== userId) {
      return NextResponse.json({ message: "Trade not found" }, { status: 404 });
    }

    await prisma.trade.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Trade deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting trade:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;

    const trade = await prisma.trade.findUnique({
      where: { id },
    });

    if (!trade || trade.userId !== userId) {
      return NextResponse.json({ message: "Trade not found" }, { status: 404 });
    }

    return NextResponse.json(trade, { status: 200 });
  } catch (error) {
    console.error("Error fetching trade:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
