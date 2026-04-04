import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // Check export permission from DB
  const permRows = await prisma.$queryRaw<{ canExport: boolean; isBlocked: boolean }[]>`
    SELECT "canExport", "isBlocked" FROM "User" WHERE id = ${session.user.id} LIMIT 1
  `;
  const perms = permRows[0];
  if (perms?.isBlocked) return NextResponse.json({ message: "Your account has been blocked." }, { status: 403 });
  if (perms?.canExport === false) return NextResponse.json({ message: "You don't have permission to export reports." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const last = searchParams.get("last");
  const type = searchParams.get("type") ?? "custom";

  const userId = session.user.id;

  let where: Record<string, unknown> = { userId };
  if (start && end) {
    where.date = {
      gte: new Date(start + "T00:00:00.000Z"),
      lte: new Date(end + "T23:59:59.999Z"),
    };
  }

  let trades = await prisma.trade.findMany({
    where,
    orderBy: { date: "asc" },
    select: { id: true, instrument: true, date: true, direction: true, session: true, setup: true, entryPrice: true, exitPrice: true, contractSize: true, pnl: true, rating: true },
    ...(last ? { take: parseInt(last), orderBy: { date: "desc" } } : {}),
  });

  if (last) trades = trades.reverse();

  // Stats
  let wins = 0, losses = 0, grossWin = 0, grossLoss = 0, netPnl = 0;
  trades.forEach(t => {
    netPnl += t.pnl;
    if (t.pnl >= 0) { wins++; grossWin += t.pnl; } else { losses++; grossLoss += Math.abs(t.pnl); }
  });
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
  const avgWin = wins > 0 ? grossWin / wins : 0;
  const avgLoss = losses > 0 ? grossLoss / losses : 0;
  const rr = avgWin > 0 && avgLoss > 0 ? avgWin / avgLoss : 0;

  // Build PDF
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, margin = 16;

  // Header bar
  doc.setFillColor(37, 37, 37);
  doc.rect(0, 0, W, 28, "F");

  // Logo icon — white rounded square with chart icon
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 6, 16, 16, 3, 3, "F");
  doc.setDrawColor(37, 37, 37);
  doc.setLineWidth(1.2);
  // Chart lines inside the icon (y coords relative to icon top at y=6)
  doc.line(margin + 3, 18, margin + 3, 20);
  doc.line(margin + 3, 20, margin + 7, 16);
  doc.line(margin + 7, 16, margin + 10, 18);
  doc.line(margin + 10, 18, margin + 13, 12);

  // Brand name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("TradeSync", margin + 20, 16);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  doc.text("Trading Journal Report", margin + 20, 22);

  // Report title & date
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  const reportLabel = type === "weekly" ? "Weekly Report" : type === "daily" ? "Daily Report" : type === "last" ? `Last ${last} Trades` : "Custom Report";
  const dateRange = start && end ? `${format(new Date(start + "T12:00:00"), "MMM d, yyyy")} – ${format(new Date(end + "T12:00:00"), "MMM d, yyyy")}` : `${trades.length} trades`;
  doc.text(`${reportLabel} · ${dateRange}`, W - margin, 17, { align: "right" });
  doc.text(`Generated ${format(new Date(), "MMM d, yyyy")}`, W - margin, 22, { align: "right" });

  let y = 36;

  // KPI tiles
  const kpis = [
    { label: "Net PNL", value: `${netPnl >= 0 ? "+" : ""}$${Math.abs(netPnl).toFixed(2)}`, color: netPnl >= 0 ? [15, 123, 108] : [235, 87, 87] },
    { label: "Win Rate", value: `${winRate.toFixed(1)}%`, color: winRate >= 50 ? [15, 123, 108] : [235, 87, 87] },
    { label: "Trades", value: `${trades.length} (${wins}W/${losses}L)`, color: [80, 80, 80] },
    { label: "Avg R:R", value: rr > 0 ? rr.toFixed(2) : "—", color: [80, 80, 80] },
  ];

  const tileW = (W - margin * 2 - 12) / 4;
  kpis.forEach((k, i) => {
    const tx = margin + i * (tileW + 4);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(tx, y, tileW, 20, 2, 2, "F");
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(k.label.toUpperCase(), tx + tileW / 2, y + 6, { align: "center" });
    doc.setTextColor(k.color[0], k.color[1], k.color[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(k.value, tx + tileW / 2, y + 14, { align: "center" });
  });

  y += 28;

  // Section title
  doc.setTextColor(37, 37, 37);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Trade Log", margin, y);
  y += 6;

  // Table
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Date", "Instrument", "Dir", "Session", "Entry", "Exit", "Size", "PNL", "R"]],
    body: trades.map(t => {
      const rMult = "—"; // stopLoss available after db push
      return [
        format(new Date(t.date), "MM/dd/yy"),
        t.instrument,
        t.direction,
        t.session ?? "—",
        t.entryPrice.toFixed(2),
        t.exitPrice.toFixed(2),
        t.contractSize?.toString() ?? "—",
        `${t.pnl >= 0 ? "+" : ""}$${t.pnl.toFixed(2)}`,
        rMult,
      ];
    }),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [37, 37, 37], textColor: 255, fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      7: { halign: "right" },
      8: { halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 7) {
        const val = data.cell.raw as string;
        data.cell.styles.textColor = val.startsWith("+") ? [15, 123, 108] : [235, 87, 87];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // Footer
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(`TradeSync · Page ${i} of ${pageCount}`, W / 2, 292, { align: "center" });
  }

  const pdfBytes = doc.output("arraybuffer");

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="tradesync-report-${format(new Date(), "yyyy-MM-dd")}.pdf"`,
    },
  });
}
