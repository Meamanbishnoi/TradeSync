import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface TradeTemplate {
  id: string;
  name: string;
  instrument: string;
  direction: string;
  session: string;
  contractSize: string;
  setup: string;
  tags: string[];
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const rows = await prisma.$queryRaw<{ tradeTemplates: string | null }[]>`
    SELECT "tradeTemplates" FROM "User" WHERE id = ${session.user.id} LIMIT 1
  `;
  const raw = rows[0]?.tradeTemplates;
  const templates: TradeTemplate[] = raw ? JSON.parse(raw) : [];
  return NextResponse.json(templates);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const templates: TradeTemplate[] = await req.json();
  await prisma.$executeRaw`
    UPDATE "User" SET "tradeTemplates" = ${JSON.stringify(templates)} WHERE id = ${session.user.id}
  `;
  return NextResponse.json({ message: "Templates saved" });
}
