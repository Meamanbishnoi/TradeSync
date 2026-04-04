import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET — check if user has a security question set
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { securityQuestion: true },
  });

  return NextResponse.json({ hasSecurityQuestion: !!user?.securityQuestion, question: user?.securityQuestion ?? null });
}

// POST — set or update security question
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { question, answer } = await req.json();
  if (!question?.trim() || !answer?.trim()) {
    return NextResponse.json({ message: "Question and answer are required" }, { status: 400 });
  }

  const hashedAnswer = await bcrypt.hash(answer.trim().toLowerCase(), 10);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { securityQuestion: question.trim(), securityAnswer: hashedAnswer },
  });

  return NextResponse.json({ message: "Security question saved" });
}
