import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch all user trades
    const trades = await prisma.trade.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" }
    });

    const zip = new JSZip();

    // Add JSON database data
    zip.file("trades.json", JSON.stringify(trades, null, 2));

    // Create a folder for media
    const imagesFolder = zip.folder("images");

    if (imagesFolder) {
      const publicDir = path.join(process.cwd(), "public");

      // Loop through trades and aggregate all image URLs
      const allImageUrls = new Set<string>();
      
      trades.forEach(trade => {
        if (trade.imageUrls) {
          try {
            const parsedUrls: string[] = JSON.parse(trade.imageUrls);
            parsedUrls.forEach(url => {
              if (url && typeof url === "string" && (url.startsWith("/uploads/") || url.includes("blob.vercel-storage.com"))) {
                allImageUrls.add(url);
              }
            });
          } catch (e) {
            console.error("Failed to parse image URLs for trade ID:", trade.id);
          }
        }
      });

      // Package each physical image file from either Vercel Blob or local fallback into the zip
      for (const url of Array.from(allImageUrls)) {
        try {
          const filename = path.basename(url);
          let fileBuffer: Buffer | Uint8Array;
          
          if (url.startsWith("http")) {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch cloud image");
            const arrayBuf = await res.arrayBuffer();
            fileBuffer = Buffer.from(arrayBuf);
          } else {
            const absoluteFilePath = path.join(publicDir, "uploads", filename);
            fileBuffer = await fs.readFile(absoluteFilePath);
          }
          
          imagesFolder.file(filename, fileBuffer);
        } catch (e) {
          console.error(`Missing image file for backup: ${url}`);
          // If a file is missing on disk but exists in DB, we skip it so the backup does not hard crash
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "uint8array" });

    // Stream the finalized zip buffer to the client
    return new NextResponse(zipBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="tradesync-backup-${new Date().toISOString().split("T")[0]}.zip"`,
      },
    });

  } catch (error) {
    console.error("Backup generator failed:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
