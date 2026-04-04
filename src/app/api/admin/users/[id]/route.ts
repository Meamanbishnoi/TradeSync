import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(session: Awaited<ReturnType<typeof getServerSession>>) {
  return session?.user && (session.user as { isAdmin?: boolean }).isAdmin;
}

// PATCH — update block status or permissions
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const allowed = ["isBlocked", "canAddTrades", "canViewAnalytics", "canExport", "maxTrades", "maxImages"];
  for (const key of allowed) {
    if (key in body) {
      const val = body[key];
      // maxTrades and maxImages can be null (unlimited) or a number
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET "${key}" = $1 WHERE id = $2`,
        val === "" ? null : val, id
      );
    }
  }

  return NextResponse.json({ message: "Updated" });
}

// DELETE — delete user and all their data
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await params;

  // Prevent deleting the admin account itself
  const rows = await prisma.$queryRaw<{ isAdmin: boolean }[]>`SELECT "isAdmin" FROM "User" WHERE id = ${id} LIMIT 1`;
  if (rows[0]?.isAdmin) return NextResponse.json({ message: "Cannot delete admin account" }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ message: "User deleted" });
}
