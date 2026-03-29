import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(trades);
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const {
      instrument, direction, date, session: tradeSession,
      entryPrice, exitPrice, setup, emotions, notes,
      imageUrls, contractSize, rating, pnl: rawPnl,
    } = await req.json();

    if (!instrument || !direction || !date || !entryPrice || !exitPrice) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const pnlValue = parseFloat(rawPnl) || 0;
    const priceDiff = parseFloat(exitPrice) - parseFloat(entryPrice);
    const isWin = direction === "Long" ? priceDiff >= 0 : priceDiff <= 0;
    const pnl = isWin ? Math.abs(pnlValue) : -Math.abs(pnlValue);

    const newTrade = await prisma.trade.create({
      data: {
        userId,
        instrument,
        direction,
        date: new Date(date),
        session: tradeSession || null,
        entryPrice: parseFloat(entryPrice) || 0,
        exitPrice: parseFloat(exitPrice) || 0,
        pnl,
        setup: setup || null,
        emotions: emotions || null,
        notes: notes || null,
        contractSize: contractSize ? parseFloat(contractSize) : null,
        imageUrls: imageUrls ? JSON.stringify(imageUrls) : null,
        rating: rating ? parseInt(rating) : null,
      },
    });

    return NextResponse.json(newTrade, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
