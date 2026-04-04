import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET — fetch the security question for an email
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ message: "Email required" }, { status: 400 });

  // Use raw query since securityQuestion was added via raw SQL migration
  const rows = await prisma.$queryRaw<{ securityQuestion: string | null }[]>`
    SELECT "securityQuestion" FROM "User" WHERE email = ${email} LIMIT 1
  `;

  if (!rows.length) return NextResponse.json({ message: "No account found with that email" }, { status: 404 });
  if (!rows[0].securityQuestion) return NextResponse.json({ message: "No security question set for this account" }, { status: 404 });

  return NextResponse.json({ question: rows[0].securityQuestion });
}

// POST — verify answer and reset password
export async function POST(req: Request) {
  const { email, answer, newPassword } = await req.json();
  if (!email || !answer || !newPassword) {
    return NextResponse.json({ message: "All fields required" }, { status: 400 });
  }

  const rows = await prisma.$queryRaw<{ id: string; securityAnswer: string | null }[]>`
    SELECT id, "securityAnswer" FROM "User" WHERE email = ${email} LIMIT 1
  `;

  if (!rows.length || !rows[0].securityAnswer) {
    return NextResponse.json({ message: "No account or security question found" }, { status: 404 });
  }

  const match = await bcrypt.compare(answer.trim().toLowerCase(), rows[0].securityAnswer);
  if (!match) {
    return NextResponse.json({ message: "Incorrect answer" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.$executeRaw`UPDATE "User" SET password = ${hashed} WHERE id = ${rows[0].id}`;

  return NextResponse.json({ message: "Password reset successfully" });
}
