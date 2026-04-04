import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [user, trades, journals] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, createdAt: true } }),
      prisma.trade.findMany({ where: { userId }, orderBy: { date: "desc" } }),
      prisma.dailyJournal.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    ]);

    // Fetch and base64-encode all images
    const imageCache: Record<string, string> = {};
    for (const trade of trades) {
      if (!trade.imageUrls) continue;
      try {
        const urls: string[] = JSON.parse(trade.imageUrls);
        for (const url of urls) {
          if (!url || imageCache[url]) continue;
          try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const buf = Buffer.from(await res.arrayBuffer());
            const mime = res.headers.get("content-type") || "image/png";
            imageCache[url] = `data:${mime};base64,${buf.toString("base64")}`;
          } catch { /* skip */ }
        }
      } catch { /* skip */ }
    }

    const fmtDate = (d: Date | string) => format(new Date(d), "MMM d, yyyy");
    const fmtDateTime = (d: Date | string) => format(new Date(d), "MMM d, yyyy");
    const esc = (s: string | null | undefined) => (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Build trade cards HTML
    const tradeCards = trades.map(t => {
      let imageUrls: string[] = [];
      try { if (t.imageUrls) imageUrls = JSON.parse(t.imageUrls); } catch {}

      const isWin = t.pnl >= 0;
      const pnlColor = isWin ? "#0f7b6c" : "#eb5757";
      const pnlStr = `${isWin ? "+" : ""}$${Math.abs(t.pnl).toFixed(2)}`;

      const images = imageUrls.map(url => {
        const src = imageCache[url] || url;
        return `<img src="${src}" alt="Trade screenshot" style="max-width:100%;border-radius:6px;margin-top:8px;display:block;" />`;
      }).join("");

      const rows = [
        ["Date", fmtDate(t.date)],
        ["Direction", t.direction],
        ["Session", t.session || "—"],
        ["Entry", `$${t.entryPrice}`],
        ["Exit", `$${t.exitPrice}`],
        t.stopLoss != null ? ["Stop Loss", `$${t.stopLoss}`] : null,
        t.contractSize != null ? ["Contracts", String(t.contractSize)] : null,
        t.setup ? ["Setup", esc(t.setup)] : null,
        t.rating ? ["Rating", "★".repeat(t.rating) + "☆".repeat(5 - t.rating)] : null,
      ].filter(Boolean) as [string, string][];

      const rowsHtml = rows.map(([k, v]) =>
        `<tr><td style="color:#888;padding:4px 12px 4px 0;font-size:13px;white-space:nowrap;">${k}</td><td style="padding:4px 0;font-size:13px;">${v}</td></tr>`
      ).join("");

      return `
<div style="border:1px solid #e0e0e0;border-radius:10px;padding:20px;margin-bottom:20px;page-break-inside:avoid;">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
    <div>
      <span style="font-size:20px;font-weight:700;">${esc(t.instrument)}</span>
      <span style="margin-left:10px;font-size:13px;padding:2px 8px;border-radius:4px;background:#f0f0f0;color:#555;">${esc(t.direction)}</span>
    </div>
    <span style="font-size:18px;font-weight:700;color:${pnlColor};">${pnlStr}</span>
  </div>
  <table style="border-collapse:collapse;margin-bottom:${t.emotions || t.notes || images ? "12px" : "0"};">${rowsHtml}</table>
  ${t.emotions ? `<div style="margin-bottom:10px;"><div style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Emotions</div><div style="font-size:14px;line-height:1.6;white-space:pre-wrap;">${esc(t.emotions)}</div></div>` : ""}
  ${t.notes ? `<div style="margin-bottom:10px;"><div style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Notes</div><div style="font-size:14px;line-height:1.6;white-space:pre-wrap;">${esc(t.notes)}</div></div>` : ""}
  ${images ? `<div><div style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Screenshots</div>${images}</div>` : ""}
</div>`;
    }).join("");

    // Build journal entries HTML
    const journalEntries = journals.map(j => {
      if (!j.prePlan && !j.review) return "";
      return `
<div style="border:1px solid #e0e0e0;border-radius:10px;padding:20px;margin-bottom:16px;page-break-inside:avoid;">
  <div style="font-size:16px;font-weight:700;margin-bottom:12px;">${j.date}</div>
  ${j.prePlan ? `<div style="font-size:14px;line-height:1.7;">${j.prePlan}</div>` : ""}
</div>`;
    }).filter(Boolean).join("");

    // Stats
    const wins = trades.filter(t => t.pnl >= 0).length;
    const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
    const winRate = trades.length > 0 ? ((wins / trades.length) * 100).toFixed(1) : "0";
    const netPnlStr = `${netPnl >= 0 ? "+" : ""}$${Math.abs(netPnl).toFixed(2)}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>TradeSync Backup — ${user?.name || user?.email || "Journal"}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1a1a1a; background: #fff; padding: 32px 24px; max-width: 860px; margin: 0 auto; }
  h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
  h2 { font-size: 20px; font-weight: 700; margin: 40px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #f0f0f0; }
  .meta { font-size: 13px; color: #888; margin-bottom: 32px; }
  .stats { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 32px; }
  .stat { background: #f7f7f7; border-radius: 8px; padding: 14px 20px; min-width: 120px; }
  .stat-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 4px; }
  .stat-value { font-size: 22px; font-weight: 700; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
<h1>TradeSync Journal</h1>
<div class="meta">
  ${user?.name ? `<strong>${esc(user.name)}</strong> · ` : ""}${esc(user?.email || "")} · Exported ${fmtDateTime(new Date())}
</div>

<div class="stats">
  <div class="stat"><div class="stat-label">Total Trades</div><div class="stat-value">${trades.length}</div></div>
  <div class="stat"><div class="stat-label">Win Rate</div><div class="stat-value" style="color:${parseFloat(winRate) >= 50 ? "#0f7b6c" : "#eb5757"}">${winRate}%</div></div>
  <div class="stat"><div class="stat-label">Net PNL</div><div class="stat-value" style="color:${netPnl >= 0 ? "#0f7b6c" : "#eb5757"}">${netPnlStr}</div></div>
  <div class="stat"><div class="stat-label">Journal Entries</div><div class="stat-value">${journals.length}</div></div>
</div>

${trades.length > 0 ? `<h2>Trades (${trades.length})</h2>${tradeCards}` : ""}
${journalEntries ? `<h2>Journal Entries</h2>${journalEntries}` : ""}
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="tradesync-backup-${format(new Date(), "yyyy-MM-dd")}.html"`,
      },
    });
  } catch (error) {
    console.error("Backup failed:", error);
    return NextResponse.json({ message: "Backup failed" }, { status: 500 });
  }
}
