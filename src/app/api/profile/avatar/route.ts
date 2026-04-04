import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { avatarId } = await req.json();

  // avatarId can be null (remove avatar) or a string
  await prisma.$executeRaw`
    UPDATE "User" SET "avatarId" = ${avatarId ?? null} WHERE id = ${session.user.id}
  `;

  return NextResponse.json({ message: "Avatar updated" });
}
