"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import MultiImageUploader from "@/components/MultiImageUploader";
import ComboBox from "@/components/ComboBox";
import StarRating from "@/components/StarRating";
import { useToast } from "@/components/Toast";
import { POINT_MULTIPLIERS, DEFAULT_SESSIONS } from "@/lib/constants";

function calcPnl(entry: string, exit: string, contracts: string, instrument: string, direction: string): string {
  const e = parseFloat(entry);
  const x = parseFloat(exit);
  const c = parseFloat(contracts) || 1;
  if (isNaN(e) || isNaN(x)) return "";
  const multiplier = POINT_MULTIPLIERS[instrument.toUpperCase()];
  if (multiplier) {
    const points = direction === "Long" ? x - e : e - x;
    return (points * multiplier * c).toFixed(2);
  }
  const diff = direction === "Long" ? x - e : e - x;
  return (diff * c).toFixed(2);
}

export default function EditTradePage() {
  const router = useRouter();
  const params = useParams();
  const tradeId = params?.id as string;
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    instrument: "",
    direction: "Long",
    date: new Date().toISOString().slice(0, 10),
    session: "",
    entryPrice: "",
    exitPrice: "",
    contractSize: "",
    pnl: "",
    setup: "",
    emotions: "",
    notes: "",
    rating: 0,
  });

  const [customInstruments, setCustomInstruments] = useState<string[]>([]);
  const [customSessions, setCustomSessions] = useState<string[]>([]);
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [pnlAutoCalc, setPnlAutoCalc] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    async function fetchTrade() {
      try {
        const res = await fetch(`/api/trades/${tradeId}`);
        if (!res.ok) throw new Error("Failed to load trade");
        const data = await res.json();

        setFormData({
          instrument: data.instrument || "",
          direction: data.direction || "Long",
          date: new Date(data.date).toISOString().slice(0, 10),
          session: data.session || "",
          entryPrice: data.entryPrice?.toString() || "",
          exitPrice: data.exitPrice?.toString() || "",
          contractSize: data.contractSize?.toString() || "",
          pnl: Math.abs(data.pnl).toString() || "",
          setup: data.setup || "",
          emotions: data.emotions || "",
          notes: data.notes || "",
          rating: data.rating || 0,
        });

        try {
          if (data.imageUrls) setExistingUrls(JSON.parse(data.imageUrls));
        } catch {}
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An error occurred loading the trade";
        showToast(msg, "error");
      } finally {
        setIsLoading(false);
        setInitialLoad(false);
      }
    }

    async function fetchPreferences() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.customInstruments) setCustomInstruments(JSON.parse(data.customInstruments));
          if (data.customSessions) setCustomSessions(JSON.parse(data.customSessions));
        }
      } catch {}
    }

    if (tradeId) {
      fetchTrade();
      fetchPreferences();
    }
  }, [tradeId, showToast]);

  // Auto-calculate PNL when relevant fields change (skip on initial load)
  useEffect(() => {
    if (initialLoad) return;
    if (formData.entryPrice && formData.exitPrice) {
      const auto = calcPnl(formData.entryPrice, formData.exitPrice, formData.contractSize, formData.instrument, formData.direction);
      if (auto !== "") {
        setFormData(prev => ({ ...prev, pnl: auto }));
        setPnlAutoCalc(true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.entryPrice, formData.exitPrice, formData.contractSize, formData.instrument, formData.direction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let uploadedUrls: string[] = [];
      for (const file of newFiles) {
        const fileData = new FormData();
        fileData.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fileData });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          uploadedUrls.push(url);
        } else {
          throw new Error("Failed to upload an image");
        }
      }

      const res = await fetch(`/api/trades/${tradeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instrument: formData.instrument,
          direction: formData.direction,
          date: new Date(formData.date).toISOString(),
          session: formData.session,
          entryPrice: parseFloat(formData.entryPrice) || 0,
          exitPrice: parseFloat(formData.exitPrice) || 0,
          contractSize: formData.contractSize ? parseFloat(formData.contractSize) : null,
          pnl: parseFloat(formData.pnl) || 0,
          setup: formData.setup,
          emotions: formData.emotions,
          notes: formData.notes,
          imageUrls: [...existingUrls, ...uploadedUrls],
          rating: formData.rating > 0 ? formData.rating : null,
        }),
      });

      if (!res.ok) throw new Error("Failed to update trade");

      showToast("Trade updated successfully", "success");
      router.push(`/trade/${tradeId}`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      showToast(msg, "error");
      setIsSubmitting(false);
    }
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "pnl") setPnlAutoCalc(false);
  }, []);

  if (isLoading) {
    return <div style={{ textAlign: "center", marginTop: "100px" }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", paddingBottom: "100px" }}>
      <div style={{ marginBottom: "24px" }}>
        <Link href={`/trade/${tradeId}`} style={{ color: "var(--text-secondary)", fontSize: "16px", textDecoration: "none" }}>← Back to trade details</Link>
      </div>

      <h1 style={{ fontSize: "38px", marginBottom: "32px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>Edit Trade</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

          <div>
            <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Instrument</label>
            <ComboBox name="instrument" value={formData.instrument} onChange={(val) => setFormData(prev => ({ ...prev, instrument: val }))} options={customInstruments} placeholder="e.g. ES, NQ, EURUSD" required />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Direction</label>
            <ComboBox name="direction" value={formData.direction} onChange={(val) => setFormData(prev => ({ ...prev, direction: val }))} options={["Long", "Short"]} required />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="notion-input" required />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Session</label>
            <ComboBox name="session" value={formData.session} onChange={(val) => setFormData(prev => ({ ...prev, session: val }))} options={customSessions.length > 0 ? customSessions : DEFAULT_SESSIONS} placeholder="Select Session..." />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Entry Price</label>
            <input type="number" step="any" name="entryPrice" value={formData.entryPrice} onChange={handleChange} className="notion-input" required />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Exit Price</label>
            <input type="number" step="any" name="exitPrice" value={formData.exitPrice} onChange={handleChange} className="notion-input" required />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Contract / Lot Size (Optional)</label>
            <input type="number" step="any" name="contractSize" value={formData.contractSize} onChange={handleChange} className="notion-input" placeholder="e.g. 1, 0.5, 100" />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>
              PNL ($)
              {pnlAutoCalc && <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--accent-color)" }}>auto-calculated</span>}
            </label>
            <input type="number" step="any" name="pnl" value={formData.pnl} onChange={handleChange} className="notion-input" required placeholder="Amount (sign auto-calculated)" />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Setup</label>
            <input type="text" name="setup" value={formData.setup} onChange={handleChange} className="notion-input" placeholder="e.g. Breakout, Reversion" />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Trade Rating</label>
            <div style={{ marginTop: "8px" }}>
              <StarRating rating={formData.rating} onChange={(val) => setFormData(prev => ({ ...prev, rating: val }))} />
            </div>
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "8px 0" }} />

        <div>
          <label style={{ display: "block", fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>Emotions</label>
          <textarea name="emotions" value={formData.emotions} onChange={handleChange} className="notion-input" style={{ minHeight: "80px", resize: "vertical" }} placeholder="How did you feel during this trade?" />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>Notes</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} className="notion-input" style={{ minHeight: "150px", resize: "vertical" }} placeholder="Write your trade review here..." />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>Screenshots</label>
          <MultiImageUploader existingUrls={existingUrls} onExistingUrlsChange={setExistingUrls} newFiles={newFiles} onNewFilesChange={setNewFiles} />
        </div>

        <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" disabled={isSubmitting} className="notion-button notion-button-primary" style={{ padding: "10px 24px", opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
