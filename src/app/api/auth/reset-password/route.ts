import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET — fetch the security question for an email
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ message: "Email required" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { securityQuestion: true },
  });

  if (!user) return NextResponse.json({ message: "No account found with that email" }, { status: 404 });
  if (!user.securityQuestion) return NextResponse.json({ message: "No security question set for this account" }, { status: 404 });

  return NextResponse.json({ question: user.securityQuestion });
}

// POST — verify answer and reset password
export async function POST(req: Request) {
  const { email, answer, newPassword } = await req.json();
  if (!email || !answer || !newPassword) {
    return NextResponse.json({ message: "All fields required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, securityAnswer: true },
  });

  if (!user || !user.securityAnswer) {
    return NextResponse.json({ message: "No account or security question found" }, { status: 404 });
  }

  const match = await bcrypt.compare(answer.trim().toLowerCase(), user.securityAnswer);
  if (!match) {
    return NextResponse.json({ message: "Incorrect answer" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  return NextResponse.json({ message: "Password reset successfully" });
}
