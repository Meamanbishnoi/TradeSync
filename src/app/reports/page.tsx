"use client";

import { useState } from "react";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { useToast } from "@/components/Toast";

type ReportType = "weekly" | "daily" | "custom" | "last";

const TYPES: { id: ReportType; label: string; desc: string }[] = [
  { id: "daily",   label: "Today",         desc: "Today's trades only" },
  { id: "weekly",  label: "Weekly",        desc: "Full week summary" },
  { id: "custom",  label: "Custom Range",  desc: "Pick a date range" },
  { id: "last",    label: "Last N Trades", desc: "Most recent trades" },
];

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
      const params = new URLSearchParams({ type: reportType });
      if (range.start) params.set("start", range.start);
      if (range.end) params.set("end", range.end);
      if ("last" in range && range.last) params.set("last", range.last.toString());

      const res = await fetch(`/api/reports/pdf?${params}`);
      if (!res.ok) throw new Error("Failed to generate report");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${format(new Date(), "yyyy-MM-dd")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Report downloaded", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error generating report", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const weekLabel = weekOffset === 0 ? "This week" : weekOffset === 1 ? "Last week" : `${weekOffset} weeks ago`;

  return (
    <div style={{ maxWidth: "520px", margin: "0 auto", paddingTop: "16px", paddingBottom: "64px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", margin: 0, fontWeight: 700 }}>Reports</h1>
        <p style={{ color: "var(--text-secondary)", margin: "4px 0 0", fontSize: "14px" }}>
          Download a PDF summary of your trading activity.
        </p>
      </div>

      {/* Report type */}
      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: 500 }}>Report type</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {TYPES.map(opt => (
            <label
              key={opt.id}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 14px",
                border: "1px solid " + (reportType === opt.id ? "var(--text-primary)" : "var(--border-color)"),
                borderRadius: "8px",
                cursor: "pointer",
                backgroundColor: reportType === opt.id ? "var(--bg-hover)" : "var(--bg-secondary)",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <input
                type="radio"
                name="reportType"
                value={opt.id}
                checked={reportType === opt.id}
                onChange={() => setReportType(opt.id)}
                style={{ accentColor: "var(--text-primary)", width: "15px", height: "15px", flexShrink: 0 }}
              />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{opt.label}</div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "1px" }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Options */}
      {reportType === "weekly" && (
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: 500 }}>Select week</p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={() => setWeekOffset(w => w + 1)} className="notion-button" style={{ padding: "6px 12px" }}>‹</button>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", minWidth: "110px", textAlign: "center" }}>{weekLabel}</span>
            <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))} disabled={weekOffset === 0} className="notion-button" style={{ padding: "6px 12px", opacity: weekOffset === 0 ? 0.4 : 1 }}>›</button>
          </div>
        </div>
      )}

      {reportType === "custom" && (
        <div style={{ marginBottom: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 140px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 500 }}>Start date</p>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="notion-input" />
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 500 }}>End date</p>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="notion-input" />
          </div>
        </div>
      )}

      {reportType === "last" && (
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 500 }}>Number of trades</p>
          <input
            type="number" min="1" max="500" value={lastN}
            onChange={e => setLastN(parseInt(e.target.value) || 10)}
            className="notion-input" style={{ width: "100px" }}
          />
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={isGenerating}
        className="notion-button notion-button-primary"
        style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: 600, opacity: isGenerating ? 0.7 : 1 }}
      >
        {isGenerating ? "Generating PDF..." : "Download PDF Report"}
      </button>
    </div>
  );
}
