import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Missing email or password" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      // If they exist but haven't verified, resend the email
      if (!existingUser.emailVerified) {
        const token = randomBytes(32).toString("hex");
        const exp = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { verifyToken: token, verifyTokenExp: exp },
        });
        await sendVerificationEmail(email, token);
        return NextResponse.json({ message: "Verification email resent. Please check your inbox." }, { status: 200 });
      }
      return NextResponse.json({ message: "An account with this email already exists." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = randomBytes(32).toString("hex");
    const exp = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        emailVerified: false,
        verifyToken: token,
        verifyTokenExp: exp,
      },
    });

    await sendVerificationEmail(email, token);

    return NextResponse.json(
      { message: "Account created! Please check your email to verify your account." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
