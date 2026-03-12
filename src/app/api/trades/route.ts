import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

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

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { instrument, direction, date, session: tradeSession, entryPrice, exitPrice, setup, emotions, notes, imageUrls, contractSize, rating, pnl: rawPnl } = await req.json();

    // Auto-compute PNL sign based on entry/exit and direction
    const pnlValue = parseFloat(rawPnl) || 0;
    const priceDiff = parseFloat(exitPrice) - parseFloat(entryPrice);
    const isWin = direction === "Long" ? priceDiff >= 0 : priceDiff <= 0;
    
    // The user might enter a positive number for pnl, we set the sign appropriately
    const pnl = isWin ? Math.abs(pnlValue) : -Math.abs(pnlValue);

    const entryPriceNum = parseFloat(entryPrice) || 0;
    const exitPriceNum = parseFloat(exitPrice) || 0;
    const contractSizeNum = contractSize ? parseFloat(contractSize) : null;
    const ratingNum = rating ? parseInt(rating) : null;

    const newTrade = await prisma.trade.create({
      data: {
        userId,
        instrument,
        direction,
        date: new Date(date),
        session: tradeSession,
        entryPrice: entryPriceNum,
        exitPrice: exitPriceNum,
        pnl,
        setup,
        emotions,
        notes,
        contractSize: contractSizeNum,
        imageUrls: imageUrls ? JSON.stringify(imageUrls) : null,
        rating: ratingNum,
      },
    });

    return NextResponse.json(newTrade, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
