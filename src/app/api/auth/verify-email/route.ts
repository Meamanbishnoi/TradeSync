import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", req.url));
  }

  const user = await prisma.user.findFirst({
    where: { verifyToken: token },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", req.url));
  }

  if (user.verifyTokenExp && user.verifyTokenExp < new Date()) {
    return NextResponse.redirect(new URL("/login?error=token-expired", req.url));
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verifyToken: null, verifyTokenExp: null },
  });

  return NextResponse.redirect(new URL("/login?verified=1", req.url));
}
