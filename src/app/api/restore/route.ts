import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import JSZip from "jszip";
import { put } from "@vercel/blob";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "No file provided." }, { status: 400 });
    }

    // ── 1. Load zip ──────────────────────────────────────────────────────
    let zip: JSZip;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      zip = await JSZip.loadAsync(buffer);
    } catch {
      return NextResponse.json({ message: "Could not read the zip file. Make sure it's a valid TradeSync backup." }, { status: 400 });
    }

    // ── 2. Parse trades.json ─────────────────────────────────────────────
    const tradesFile = zip.file("trades.json");
    if (!tradesFile) {
      return NextResponse.json({ message: "Invalid backup: trades.json not found inside the zip." }, { status: 400 });
    }

    let tradesData: Record<string, unknown>[] = [];
    try {
      const raw = await tradesFile.async("string");
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("Not an array");
      tradesData = parsed;
    } catch {
      return NextResponse.json({ message: "Invalid backup: trades.json is corrupted." }, { status: 400 });
    }

    // ── 3. Parse journals.json (optional — older backups may not have it) ─
    let journalsData: Record<string, unknown>[] = [];
    const journalsFile = zip.file("journals.json");
    if (journalsFile) {
      try {
        const raw = await journalsFile.async("string");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) journalsData = parsed;
      } catch {
        // non-fatal — skip journals if corrupted
      }
    }

    // ── 4. Re-upload images to Vercel Blob ───────────────────────────────
    // Do this BEFORE the transaction so the transaction stays fast and doesn't time out
    const newUrlMap: Record<string, string> = {};
    const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

    if (hasBlob) {
      const imagePaths = Object.keys(zip.files).filter(
        name => name.startsWith("images/") && !zip.files[name].dir
      );
      for (const zipPath of imagePaths) {
        const fileObj = zip.file(zipPath);
        if (!fileObj) continue;
        try {
          const filename = zipPath.split("/").pop()!;
          const buf = await fileObj.async("nodebuffer");
          const blob = await put(`tradesync/${filename}`, buf, { access: "public" });
          newUrlMap[filename] = blob.url;
        } catch {
          // non-fatal — continue without this image
        }
      }
    }

    // Helper to remap image URLs
    const remapUrls = (imageUrlsJson: unknown): string | null => {
      if (!imageUrlsJson || typeof imageUrlsJson !== "string") return null;
      if (Object.keys(newUrlMap).length === 0) return imageUrlsJson;
      try {
        const urls: string[] = JSON.parse(imageUrlsJson);
        const remapped = urls.map(u => {
          const filename = u.split("/").pop()?.split("?")[0] ?? "";
          return newUrlMap[filename] ?? u;
        });
        return JSON.stringify(remapped);
      } catch {
        return imageUrlsJson;
      }
    };

    // ── 5. Prepare all data before the transaction ───────────────────────
    const tradeInserts = tradesData.map(t => ({
      id: String(t.id),
      userId,
      instrument: String(t.instrument ?? ""),
      direction: String(t.direction ?? "Long"),
      date: t.date ? new Date(String(t.date)) : new Date(),
      session: t.session ? String(t.session) : null,
      entryPrice: Number(t.entryPrice ?? 0),
      exitPrice: Number(t.exitPrice ?? 0),
      stopLoss: t.stopLoss != null ? Number(t.stopLoss) : null,
      pnl: Number(t.pnl ?? 0),
      setup: t.setup ? String(t.setup) : null,
      tags: t.tags ? String(t.tags) : null,
      emotions: t.emotions ? String(t.emotions) : null,
      notes: t.notes ? String(t.notes) : null,
      imageUrls: remapUrls(t.imageUrls),
      contractSize: t.contractSize != null ? Number(t.contractSize) : null,
      rating: t.rating != null ? Number(t.rating) : null,
      createdAt: t.createdAt ? new Date(String(t.createdAt)) : new Date(),
      updatedAt: new Date(),
    }));

    const journalInserts = journalsData.map(j => ({
      id: String(j.id),
      userId,
      date: String(j.date ?? ""),
      prePlan: j.prePlan ? String(j.prePlan) : null,
      review: j.review ? String(j.review) : null,
      createdAt: j.createdAt ? new Date(String(j.createdAt)) : new Date(),
      updatedAt: new Date(),
    }));

    // ── 6. Fast transaction — only DB operations, no async I/O ──────────
    await prisma.$transaction(async (tx) => {
      await tx.trade.deleteMany({ where: { userId } });
      await tx.dailyJournal.deleteMany({ where: { userId } });

      if (tradeInserts.length > 0) {
        await tx.trade.createMany({ data: tradeInserts, skipDuplicates: true });
      }
      if (journalInserts.length > 0) {
        await tx.dailyJournal.createMany({ data: journalInserts, skipDuplicates: true });
      }
    }, {
      timeout: 30000, // 30s max for the DB operations
    });

    return NextResponse.json({
      message: `Restore complete. ${tradesData.length} trade${tradesData.length !== 1 ? "s" : ""} and ${journalsData.length} journal entr${journalsData.length !== 1 ? "ies" : "y"} restored.`,
    });
  } catch (error) {
    console.error("Restore failed:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: `Restore failed: ${msg}` }, { status: 500 });
  }
}
