import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check image limit from DB
    const permRows = await prisma.$queryRaw<{ isBlocked: boolean; maxImages: number | null }[]>`
      SELECT "isBlocked", "maxImages" FROM "User" WHERE id = ${userId} LIMIT 1
    `;
    const perms = permRows[0];
    if (perms?.isBlocked) return NextResponse.json({ message: "Your account has been blocked." }, { status: 403 });

    if (perms?.maxImages != null) {
      const tradesWithImages = await prisma.trade.findMany({
        where: { userId, NOT: { imageUrls: null } },
        select: { imageUrls: true },
      });
      let totalImages = 0;
      for (const t of tradesWithImages) {
        try { totalImages += JSON.parse(t.imageUrls!).length; } catch {}
      }
      if (totalImages >= perms.maxImages) {
        return NextResponse.json({ message: `Image limit reached (${perms.maxImages} images max).` }, { status: 403 });
      }
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'png';
    const filename = `tradesync/${crypto.randomBytes(16).toString('hex')}.${ext}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, { access: 'public' });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (error) {
    console.error("Vercel Blob Upload Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
