import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Called client-side on every page load to get fresh permission state from DB
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const rows = await prisma.$queryRaw<{
      isBlocked: boolean;
      canAddTrades: boolean;
      canViewAnalytics: boolean;
      canExport: boolean;
      maxTrades: number | null;
      maxImages: number | null;
    }[]>`
      SELECT "isBlocked", "canAddTrades", "canViewAnalytics", "canExport", "maxTrades", "maxImages"
      FROM "User" WHERE id = ${session.user.id} LIMIT 1
    `;

    const r = rows[0];
    if (!r) return NextResponse.json({ ok: false }, { status: 404 });

    return NextResponse.json({
      ok: true,
      isBlocked: r.isBlocked ?? false,
      canAddTrades: r.canAddTrades ?? true,
      canViewAnalytics: r.canViewAnalytics ?? true,
      canExport: r.canExport ?? true,
      maxTrades: r.maxTrades ?? null,
      maxImages: r.maxImages ?? null,
    });
  } catch {
    // Columns may not exist yet — return safe defaults
    return NextResponse.json({
      ok: true,
      isBlocked: false,
      canAddTrades: true,
      canViewAnalytics: true,
      canExport: true,
      maxTrades: null,
      maxImages: null,
    });
  }
}
