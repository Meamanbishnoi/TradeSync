import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ avatarId: null });

  try {
    const rows = await prisma.$queryRaw<{ avatarId: string | null }[]>`
      SELECT "avatarId" FROM "User" WHERE id = ${session.user.id} LIMIT 1
    `;
    return NextResponse.json({ avatarId: rows[0]?.avatarId ?? null });
  } catch {
    return NextResponse.json({ avatarId: null });
  }
}
