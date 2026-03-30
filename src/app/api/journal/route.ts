import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ message: "date required" }, { status: 400 });

  const entry = await prisma.dailyJournal.findUnique({
    where: { userId_date: { userId: session.user.id, date } },
  });

  return NextResponse.json(entry ?? { date, prePlan: "", review: "" });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { date, prePlan, review } = await req.json();
  if (!date) return NextResponse.json({ message: "date required" }, { status: 400 });

  const entry = await prisma.dailyJournal.upsert({
    where: { userId_date: { userId: session.user.id, date } },
    update: { prePlan, review },
    create: { userId: session.user.id, date, prePlan, review },
  });

  return NextResponse.json(entry);
}
