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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        customInstruments: true,
        customSessions: true,
        createdAt: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // avatarId + customSetups added via raw SQL — fetch separately
    const extraRows = await prisma.$queryRaw<{ avatarId: string | null; customSetups: string | null }[]>`
      SELECT "avatarId", "customSetups" FROM "User" WHERE id = ${userId} LIMIT 1
    `;
    const avatarId = extraRows[0]?.avatarId ?? null;
    const customSetups = extraRows[0]?.customSetups ?? null;

    return NextResponse.json({ ...user, hasPassword: !!(user.password && user.password.length > 0), password: undefined, avatarId, customSetups });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { name, customInstruments, customSessions, customSetups } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        customInstruments: customInstruments ? JSON.stringify(customInstruments) : null,
        customSessions: customSessions ? JSON.stringify(customSessions) : null,
      },
      select: { id: true, name: true, email: true, customInstruments: true, customSessions: true },
    });

    // Save customSetups via raw SQL
    if (customSetups !== undefined) {
      await prisma.$executeRaw`
        UPDATE "User" SET "customSetups" = ${customSetups ? JSON.stringify(customSetups) : null} WHERE id = ${userId}
      `;
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
