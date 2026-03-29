import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const original = await prisma.trade.findUnique({ where: { id } });

    if (!original || original.userId !== userId) {
      return NextResponse.json({ message: "Trade not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = original;

    const duplicate = await prisma.trade.create({
      data: {
        ...rest,
        date: new Date(),
        imageUrls: null, // don't copy images
      },
    });

    return NextResponse.json(duplicate, { status: 201 });
  } catch (error) {
    console.error("Error duplicating trade:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
