import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [trades, journals] = await Promise.all([
      prisma.trade.findMany({ where: { userId }, orderBy: { date: "desc" } }),
      prisma.dailyJournal.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    ]);

    const zip = new JSZip();

    // Metadata so we can validate on restore
    zip.file("manifest.json", JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      tradeCount: trades.length,
      journalCount: journals.length,
    }, null, 2));

    zip.file("trades.json", JSON.stringify(trades, null, 2));
    zip.file("journals.json", JSON.stringify(journals, null, 2));

    // Fetch and bundle cloud images
    const imagesFolder = zip.folder("images");
    if (imagesFolder) {
      const allUrls = new Set<string>();
      trades.forEach(t => {
        if (!t.imageUrls) return;
        try {
          const urls: string[] = JSON.parse(t.imageUrls);
          urls.forEach(u => { if (u?.startsWith("http")) allUrls.add(u); });
        } catch {}
      });

      for (const url of allUrls) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const buf = Buffer.from(await res.arrayBuffer());
          const filename = url.split("/").pop()?.split("?")[0] ?? "image.png";
          imagesFolder.file(filename, buf);
        } catch {
          // non-fatal — skip missing images
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "uint8array" });

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="tradesync-backup-${new Date().toISOString().split("T")[0]}.zip"`,
      },
    });
  } catch (error) {
    console.error("Backup failed:", error);
    return NextResponse.json({ message: "Backup failed" }, { status: 500 });
  }
}
