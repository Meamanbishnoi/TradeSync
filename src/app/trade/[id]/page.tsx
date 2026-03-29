import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import DeleteTradeButton from "@/components/DeleteTradeButton";
import ExpandableImage from "@/components/ExpandableImage";
import StarRating from "@/components/StarRating";

export const dynamic = "force-dynamic";

export default async function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const userId = session.user.id;
  const trade = await prisma.trade.findUnique({
    where: { id },
  });

  if (!trade || trade.userId !== userId) {
    return (
      <div style={{ textAlign: "center", marginTop: "100px" }}>
        <h1 style={{ fontSize: "26px" }}>Trade not found</h1>
        <Link href="/" className="notion-button" style={{ marginTop: "16px" }}>Go home</Link>
      </div>
    );
  }

  const isWin = trade.pnl >= 0;

  let imageUrls: string[] = [];
  try {
    if (trade.imageUrls) imageUrls = JSON.parse(trade.imageUrls);
  } catch (e) {}

  const allTrades = await prisma.trade.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true }
  });

  const currentIndex = allTrades.findIndex(t => t.id === trade.id);
  const nextTradeId = currentIndex > 0 ? allTrades[currentIndex - 1].id : null;
  const prevTradeId = currentIndex !== -1 && currentIndex < allTrades.length - 1 ? allTrades[currentIndex + 1].id : null;

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", paddingBottom: "100px" }}>
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/" style={{ color: "var(--text-secondary)", fontSize: "16px", textDecoration: "none" }}>← Back to trades</Link>
          <div style={{ display: "flex", gap: "8px" }}>
            {prevTradeId && <Link href={`/trade/${prevTradeId}`} className="notion-button" style={{ fontSize: "14px", padding: "4px 8px" }}>← Prev</Link>}
            {nextTradeId && <Link href={`/trade/${nextTradeId}`} className="notion-button" style={{ fontSize: "14px", padding: "4px 8px" }}>Next →</Link>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <DeleteTradeButton tradeId={trade.id} />
          <Link href={`/trade/${trade.id}/edit`} className="notion-button" style={{ fontSize: "14px", padding: "4px 8px" }}>Edit</Link>
        </div>
      </div>

      <div style={{ paddingBottom: "32px", borderBottom: "1px solid var(--border-color)", marginBottom: "32px" }}>
        <h1 style={{ fontSize: "42px", lineHeight: "1.2", margin: 0, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "16px" }}>
          {trade.instrument}
        </h1>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ 
            display: "inline-flex", alignItems: "center", padding: "4px 10px", 
            borderRadius: "6px", fontSize: "16px", fontWeight: 600, 
            backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)"
          }}>
            {trade.direction}
          </span>
          <span style={{ 
            color: isWin ? '#0f7b6c' : '#eb5757', 
            backgroundColor: isWin ? 'rgba(15, 123, 108, 0.1)' : 'rgba(235, 87, 87, 0.1)', 
            padding: "4px 10px", 
            borderRadius: "6px", 
            fontSize: "16px", 
            fontWeight: 600 
          }}>
            {isWin ? '+' : ''}${trade.pnl.toFixed(2)}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "48px", maxWidth: "420px" }}>
        {/* Date Row */}
        <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", minHeight: "28px", alignItems: "center" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "16px" }}>Date</span>
          <span style={{ fontSize: "16px", color: "var(--text-primary)" }}>{new Date(trade.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>

        {/* Session Row */}
        {trade.session && (
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", minHeight: "28px", alignItems: "center" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "16px" }}>Session</span>
            <span style={{ fontSize: "16px", color: "var(--text-primary)" }}><span style={{ padding: "2px 6px", backgroundColor: "var(--bg-secondary)", borderRadius: "4px" }}>{trade.session}</span></span>
          </div>
        )}

        {/* Entry Row */}
        <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", minHeight: "28px", alignItems: "center" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "16px" }}>Entry Price</span>
          <span style={{ fontSize: "16px", color: "var(--text-primary)" }}>{trade.entryPrice}</span>
        </div>

        {/* Exit Row */}
        <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", minHeight: "28px", alignItems: "center" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "16px" }}>Exit Price</span>
          <span style={{ fontSize: "16px", color: "var(--text-primary)" }}>{trade.exitPrice}</span>
        </div>

        {/* Size Row */}
        {trade.contractSize !== null && (
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", minHeight: "28px", alignItems: "center" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "16px" }}>Contracts</span>
            <span style={{ fontSize: "16px", color: "var(--text-primary)" }}>{trade.contractSize}</span>
          </div>
        )}

        {/* Setup Row */}
        {trade.setup && (
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", minHeight: "28px", alignItems: "center" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "16px" }}>Setup</span>
            <span style={{ fontSize: "16px", color: "var(--text-primary)" }}><span style={{ padding: "2px 6px", backgroundColor: "var(--bg-secondary)", borderRadius: "4px" }}>{trade.setup}</span></span>
          </div>
        )}

        {/* Rating Row */}
        {trade.rating && (
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", minHeight: "28px", alignItems: "center" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "16px" }}>Rating</span>
            <div style={{ display: "flex", alignItems: "center", marginTop: "-2px" }}>
              <StarRating rating={trade.rating} readonly />
            </div>
          </div>
        )}
      </div>

      {trade.emotions && (
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.01em", marginBottom: "16px", color: "var(--text-primary)" }}>Psychology & Emotions</h2>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.7", color: "var(--text-secondary)", fontSize: "18px", margin: 0 }}>{trade.emotions}</p>
        </div>
      )}

      {trade.notes && (
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.01em", marginBottom: "16px", color: "var(--text-primary)" }}>Trade Notes</h2>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.7", color: "var(--text-secondary)", fontSize: "18px", margin: 0 }}>{trade.notes}</p>
        </div>
      )}

      {imageUrls.length > 0 && (
        <div style={{ marginTop: "48px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.01em", marginBottom: "16px", color: "var(--text-primary)" }}>Screenshots</h2>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
            gap: "24px"
          }}>
            {imageUrls.map((url, idx) => (
              <div key={idx} style={{ 
                borderRadius: "8px", 
                overflow: "hidden",
                border: "1px solid var(--border-color)",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
                transition: "transform 0.2s ease"
              }}>
                <ExpandableImage src={url} alt={`Trade Screenshot ${idx + 1}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
