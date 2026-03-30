"use client";

import { useState, useEffect } from "react";
import { format, addDays, subDays } from "date-fns";
import { useToast } from "@/components/Toast";

export default function JournalPage() {
  const { showToast } = useToast();
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [prePlan, setPrePlan] = useState("");
  const [review, setReview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/journal?date=${date}`)
      .then(r => r.json())
      .then(d => { setPrePlan(d.prePlan ?? ""); setReview(d.review ?? ""); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [date]);

  const save = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/journal", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, prePlan, review }),
      });
      if (!res.ok) throw new Error("Failed to save");
      showToast("Journal saved", "success");
    } catch { showToast("Error saving journal", "error"); }
    finally { setIsSaving(false); }
  };

  const displayDate = format(new Date(date + "T12:00:00"), "EEEE, MMMM d, yyyy");

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", paddingTop: "16px", paddingBottom: "64px" }}>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", margin: 0 }}>Daily Journal</h1>
        <p style={{ color: "var(--text-secondary)", margin: 0, marginTop: "4px", fontSize: "14px" }}>Pre-market plan and end-of-day review.</p>
      </header>

      {/* Date nav */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px", padding: "12px 16px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
        <button onClick={() => setDate(format(subDays(new Date(date + "T12:00:00"), 1), "yyyy-MM-dd"))}
          className="notion-button" style={{ padding: "4px 10px", fontSize: "16px" }}>‹</button>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="notion-input" style={{ width: "auto", padding: "4px 10px", fontSize: "14px" }} />
        <span style={{ flex: 1, fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{displayDate}</span>
        <button onClick={() => setDate(format(addDays(new Date(date + "T12:00:00"), 1), "yyyy-MM-dd"))}
          className="notion-button" style={{ padding: "4px 10px", fontSize: "16px" }}>›</button>
        <button onClick={() => setDate(format(new Date(), "yyyy-MM-dd"))}
          className="notion-button" style={{ padding: "4px 10px", fontSize: "13px" }}>Today</button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "var(--text-secondary)" }}>Loading...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontSize: "18px" }}>🌅</span>
              <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Pre-Market Plan</h2>
            </div>
            <textarea value={prePlan} onChange={e => setPrePlan(e.target.value)}
              className="notion-input" style={{ minHeight: "160px", resize: "vertical", fontSize: "15px", lineHeight: 1.7 }}
              placeholder="What's your plan for today? Key levels, bias, setups to watch..." />
          </div>

          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontSize: "18px" }}>🌙</span>
              <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>End-of-Day Review</h2>
            </div>
            <textarea value={review} onChange={e => setReview(e.target.value)}
              className="notion-input" style={{ minHeight: "160px", resize: "vertical", fontSize: "15px", lineHeight: 1.7 }}
              placeholder="How did the day go? What did you do well? What to improve?" />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={save} disabled={isSaving} className="notion-button notion-button-primary" style={{ padding: "10px 24px", opacity: isSaving ? 0.7 : 1 }}>
              {isSaving ? "Saving..." : "Save Journal"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
