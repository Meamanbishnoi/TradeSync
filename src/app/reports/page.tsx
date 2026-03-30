"use client";

import { useState } from "react";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { useToast } from "@/components/Toast";

type ReportType = "weekly" | "daily" | "custom" | "last";

export default function ReportsPage() {
  const { showToast } = useToast();
  const [reportType, setReportType] = useState<ReportType>("weekly");
  const [customStart, setCustomStart] = useState(format(new Date(), "yyyy-MM-dd"));
  const [customEnd, setCustomEnd] = useState(format(new Date(), "yyyy-MM-dd"));
  const [lastN, setLastN] = useState(10);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const getDateRange = () => {
    const now = new Date();
    if (reportType === "daily") return { start: format(now, "yyyy-MM-dd"), end: format(now, "yyyy-MM-dd") };
    if (reportType === "weekly") {
      const ref = subWeeks(now, weekOffset);
      return { start: format(startOfWeek(ref), "yyyy-MM-dd"), end: format(endOfWeek(ref), "yyyy-MM-dd") };
    }
    if (reportType === "custom") return { start: customStart, end: customEnd };
    return { start: null, end: null, last: lastN };
  };

  const generate = async () => {
    setIsGenerating(true);
    try {
      const range = getDateRange();
      const params = new URLSearchParams();
      if (range.start) params.set("start", range.start);
      if (range.end) params.set("end", range.end);
      if (range.last) params.set("last", range.last.toString());
      params.set("type", reportType);

      const res = await fetch(`/api/reports/pdf?${params}`);
      if (!res.ok) throw new Error("Failed to generate report");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tradesync-report-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Report downloaded", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error generating report", "error");
    } finally { setIsGenerating(false); }
  };

  const weekLabel = weekOffset === 0 ? "This Week" : weekOffset === 1 ? "Last Week" : `${weekOffset} weeks ago`;

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", paddingTop: "16px", paddingBottom: "64px" }}>
      <header style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", margin: 0 }}>Reports</h1>
        <p style={{ color: "var(--text-secondary)", margin: 0, marginTop: "4px", fontSize: "14px" }}>Generate a professional PDF report of your trading activity.</p>
      </header>

      <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Report type selector */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>Report Type</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {([
              { id: "weekly", label: "📅 Weekly", desc: "Full week summary" },
              { id: "daily", label: "📆 Today", desc: "Today's trades" },
              { id: "custom", label: "🗓️ Custom Range", desc: "Pick start & end date" },
              { id: "last", label: "🔢 Last N Trades", desc: "Most recent trades" },
            ] as { id: ReportType; label: string; desc: string }[]).map(opt => (
              <button key={opt.id} type="button" onClick={() => setReportType(opt.id)}
                style={{
                  padding: "12px 14px", borderRadius: "8px", textAlign: "left", cursor: "pointer",
                  border: reportType === opt.id ? "2px solid var(--text-primary)" : "1px solid var(--border-color)",
                  backgroundColor: reportType === opt.id ? "var(--bg-hover)" : "var(--bg-color)",
                  transition: "all 0.1s",
                }}>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>{opt.label}</div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Options per type */}
        {reportType === "weekly" && (
          <div>
            <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>Select Week</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button onClick={() => setWeekOffset(w => w + 1)} className="notion-button" style={{ padding: "4px 10px" }}>‹</button>
              <span style={{ fontSize: "14px", fontWeight: 600, minWidth: "120px", textAlign: "center" }}>{weekLabel}</span>
              <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))} disabled={weekOffset === 0} className="notion-button" style={{ padding: "4px 10px", opacity: weekOffset === 0 ? 0.4 : 1 }}>›</button>
            </div>
          </div>
        )}

        {reportType === "custom" && (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 140px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>Start Date</label>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="notion-input" />
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>End Date</label>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="notion-input" />
            </div>
          </div>
        )}

        {reportType === "last" && (
          <div>
            <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>Number of Trades</label>
            <input type="number" min="1" max="200" value={lastN} onChange={e => setLastN(parseInt(e.target.value) || 10)}
              className="notion-input" style={{ width: "120px" }} />
          </div>
        )}

        {/* Preview info */}
        <div style={{ padding: "12px 16px", backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
          The PDF will include: trade table, PNL summary, win rate, equity curve data, and the TradeSync logo.
        </div>

        <button onClick={generate} disabled={isGenerating} className="notion-button notion-button-primary"
          style={{ padding: "12px", fontSize: "15px", fontWeight: 600, opacity: isGenerating ? 0.7 : 1 }}>
          {isGenerating ? "Generating..." : "⬇ Download PDF Report"}
        </button>
      </div>
    </div>
  );
}
