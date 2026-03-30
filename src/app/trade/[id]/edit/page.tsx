"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import MultiImageUploader from "@/components/MultiImageUploader";
import ComboBox from "@/components/ComboBox";
import StarRating from "@/components/StarRating";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/components/Toast";
import { POINT_MULTIPLIERS, DEFAULT_SESSIONS } from "@/lib/constants";

function calcPnl(entry: string, exit: string, contracts: string, instrument: string, direction: string): string {
  const e = parseFloat(entry), x = parseFloat(exit), c = parseFloat(contracts) || 1;
  if (isNaN(e) || isNaN(x)) return "";
  const multiplier = POINT_MULTIPLIERS[instrument.toUpperCase()];
  if (multiplier) { const pts = direction === "Long" ? x - e : e - x; return (pts * multiplier * c).toFixed(2); }
  return ((direction === "Long" ? x - e : e - x) * c).toFixed(2);
}

function calcRMultiple(entry: string, exit: string, stopLoss: string, direction: string): string {
  const e = parseFloat(entry), x = parseFloat(exit), sl = parseFloat(stopLoss);
  if (isNaN(e) || isNaN(x) || isNaN(sl) || sl === e) return "";
  const risk = Math.abs(e - sl);
  const reward = direction === "Long" ? x - e : e - x;
  return (reward / risk).toFixed(2);
}

export default function EditTradePage() {
  const router = useRouter();
  const params = useParams();
  const tradeId = params?.id as string;
  const { showToast } = useToast();
  const tagInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [formData, setFormData] = useState({
    instrument: "", direction: "Long",
    date: new Date().toISOString().slice(0, 10),
    session: "", entryPrice: "", exitPrice: "", stopLoss: "",
    contractSize: "", pnl: "", setup: "", emotions: "", notes: "", rating: 0,
  });

  const [customInstruments, setCustomInstruments] = useState<string[]>([]);
  const [customSessions, setCustomSessions] = useState<string[]>([]);
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [pnlAutoCalc, setPnlAutoCalc] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!initialLoad) setHasUnsavedChanges(true);
  }, [formData, existingUrls, newFiles, tags]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (hasUnsavedChanges && !isSubmitting) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [hasUnsavedChanges, isSubmitting]);

  useEffect(() => {
    async function fetchTrade() {
      try {
        const res = await fetch(`/api/trades/${tradeId}`);
        if (!res.ok) throw new Error("Failed to load trade");
        const data = await res.json();
        setFormData({
          instrument: data.instrument || "", direction: data.direction || "Long",
          date: new Date(data.date).toISOString().slice(0, 10),
          session: data.session || "",
          entryPrice: data.entryPrice?.toString() || "",
          exitPrice: data.exitPrice?.toString() || "",
          stopLoss: data.stopLoss?.toString() || "",
          contractSize: data.contractSize?.toString() || "",
          pnl: Math.abs(data.pnl).toString() || "",
          setup: data.setup || "", emotions: data.emotions || "",
          notes: data.notes || "", rating: data.rating || 0,
        });
        if (data.tags) { try { setTags(JSON.parse(data.tags)); } catch {} }
        if (data.imageUrls) { try { setExistingUrls(JSON.parse(data.imageUrls)); } catch {} }
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Error loading trade", "error");
      } finally { setIsLoading(false); setInitialLoad(false); }
    }
    async function fetchPrefs() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const d = await res.json();
          if (d.customInstruments) setCustomInstruments(JSON.parse(d.customInstruments));
          if (d.customSessions) setCustomSessions(JSON.parse(d.customSessions));
        }
      } catch {}
    }
    if (tradeId) { fetchTrade(); fetchPrefs(); }
  }, [tradeId, showToast]);

  useEffect(() => {
    if (initialLoad) return;
    if (formData.entryPrice && formData.exitPrice) {
      const auto = calcPnl(formData.entryPrice, formData.exitPrice, formData.contractSize, formData.instrument, formData.direction);
      if (auto !== "") { setFormData(prev => ({ ...prev, pnl: auto })); setPnlAutoCalc(true); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.entryPrice, formData.exitPrice, formData.contractSize, formData.instrument, formData.direction]);

  const rMultiple = calcRMultiple(formData.entryPrice, formData.exitPrice, formData.stopLoss, formData.direction);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput(""); tagInputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      let uploadedUrls: string[] = [];
      for (const file of newFiles) {
        const fd = new FormData(); fd.append("file", file);
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        if (r.ok) { const { url } = await r.json(); uploadedUrls.push(url); }
        else throw new Error("Failed to upload an image");
      }
      const res = await fetch(`/api/trades/${tradeId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instrument: formData.instrument, direction: formData.direction,
          date: new Date(formData.date).toISOString(), session: formData.session,
          entryPrice: parseFloat(formData.entryPrice) || 0,
          exitPrice: parseFloat(formData.exitPrice) || 0,
          stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : null,
          contractSize: formData.contractSize ? parseFloat(formData.contractSize) : null,
          pnl: parseFloat(formData.pnl) || 0,
          setup: formData.setup, emotions: formData.emotions, notes: formData.notes,
          imageUrls: [...existingUrls, ...uploadedUrls],
          rating: formData.rating > 0 ? formData.rating : null,
          tags,
        }),
      });
      if (!res.ok) throw new Error("Failed to update trade");
      showToast("Trade updated successfully", "success");
      router.push(`/trade/${tradeId}`); router.refresh();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "An error occurred", "error");
      setIsSubmitting(false);
    }
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "pnl") setPnlAutoCalc(false);
  }, []);

  if (isLoading) return <div style={{ textAlign: "center", marginTop: "100px" }}>Loading...</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", paddingBottom: "100px" }}>
      <div style={{ marginBottom: "24px" }}>
        <button type="button" onClick={() => hasUnsavedChanges ? setShowExitConfirm(true) : router.push(`/trade/${tradeId}`)}
          style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "16px", cursor: "pointer", padding: 0 }}>
          ← Back to trade details
        </button>
      </div>
      <h1 style={{ fontSize: "32px", marginBottom: "28px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>Edit Trade</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="trade-form-grid">
          <div><label style={{ display: "block", fontSize: "15px", color: "var(--text-secondary)", marginBottom: "4px" }}>Instrument</label><ComboBox name="instrument" value={formData.instrument} onChange={v => setFormData(p => ({ ...p, instrument: v }))} options={customInstruments} placeholder="e.g. ES, NQ" required /></div>
          <div><label style={{ display: "block", fontSize: "15px", color: "var(--text-secondary)", marginBottom: "4px" }}>Direction</label><ComboBox name="direction" value={formData.direction} onChange={v => setFormData(p => ({ ...p, direction: v }))} options={["Long", "Short"]} required /></div>
          <div><label style={{ display: "block", fontSize: "15px", color: "var(--text-secondary)", marginBottom: "4px" }}>Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} className="notion-input" required /></div>
          <div><label style={{ display: "block", fontSize: "15px", color: "var(--text-secondary)", marginBottom: "4px" }}>Session</label><ComboBox name="session" value={formData.session} onChange={v => setFormData(p => ({ ...p, session: v }))} options={customSessions.length > 0 ? customSessions : DEFAULT_SESSIONS} placeholder="Select Session..." /></div>
          <div><label style={{ display: "block", fontSize: "15px", color: "var(--text-secondary)", marginBottom: "4px" }}>Entry Price</label><input type="number" step="any" name="entryPrice" value={formData.entryPrice} onChange={handleChange} className="notion-input" required /></div>
          <div><label style={{ display: "block", fontSize: "15px", color: "var(--text-secondary)", marginBottom: "4px" }}>Exit Price</label><input type="number" step="any" name="exitPrice" value={formData.exitPrice} onChange={handleChange} className="notion-input" required /></div>
          <div>
            <label style={{ display: "block", fontSize: "15px", color: "var(--text-secondary)", marginBottom: "4px" }}>Stop Loss <span style={{ fontSize: "12px" }}>(optional)</span></label>
            <input type="number" step="any" name="stopLoss" value={formData.stopLoss} onChange={handleChange} className="notion-input" placeholder="Stop loss price" />
            {rMultiple !== "" && <div style={{ marginTop: "4px", fontSize: "12px", color: parseFloat(rMultiple) >= 0 ? "#0f7b6c" : "#eb5757", fontWeight: 600 }}>R-Multiple: {parseFloat(rMultiple) >= 0 ? "+" : ""}{rMultiple}R</div>}
          </div>
          <div><label style={{ display: "block", fontSize: "15px", color: "var(--text-secondary)", marginBottom: "4px" }}>Contract / Lot Size <span style={{ fontSize: "12px" }}>(optional)</span></label><input type="number" step="any" name="contractSize" value={formData.contractSize} onChange={handleChange} className="notion-input" /></div>
          <div>
            <label style={{ display: "block", fontSize: "15px", color: "var(--text-secondary)", marginBottom: "4px" }}>PNL ($){pnlAutoCalc && <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--accent-color)" }}>auto-calculated</span>}</label>
            <input type="number" step="any" name="pnl" value={formData.pnl} onChange={handleChange} className="notion-input" required />
          </div>
          <div><label style={{ display: "block", fontSize: "15px", color: "var(--text-secondary)", marginBottom: "4px" }}>Setup</label><input type="text" name="setup" value={formData.setup} onChange={handleChange} className="notion-input" placeholder="e.g. Breakout, IFVG" /></div>
          <div><label style={{ display: "block", fontSize: "15px", color: "var(--text-secondary)", marginBottom: "4px" }}>Trade Rating</label><div style={{ marginTop: "8px" }}><StarRating rating={formData.rating} onChange={v => setFormData(p => ({ ...p, rating: v }))} /></div></div>
        </div>

        {/* Tags */}
        <div>
          <label style={{ display: "block", fontSize: "15px", color: "var(--text-secondary)", marginBottom: "8px" }}>Tags</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
            {tags.map(tag => (
              <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "20px", backgroundColor: "var(--bg-hover)", border: "1px solid var(--border-color)", fontSize: "13px" }}>
                {tag}
                <button type="button" onClick={() => setTags(t => t.filter(x => x !== tag))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "0 2px", fontSize: "14px", lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input ref={tagInputRef} type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              className="notion-input" placeholder="e.g. FOMO, A+ setup" style={{ flex: 1 }} />
            <button type="button" onClick={addTag} className="notion-button" style={{ padding: "6px 14px", flexShrink: 0 }}>Add</button>
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-color)" }} />
        <div><label style={{ display: "block", fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Emotions</label><textarea name="emotions" value={formData.emotions} onChange={handleChange} className="notion-input" style={{ minHeight: "80px", resize: "vertical" }} placeholder="How did you feel?" /></div>
        <div><label style={{ display: "block", fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Notes</label><textarea name="notes" value={formData.notes} onChange={handleChange} className="notion-input" style={{ minHeight: "120px", resize: "vertical" }} placeholder="Trade review..." /></div>
        <div><label style={{ display: "block", fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Screenshots</label><MultiImageUploader existingUrls={existingUrls} onExistingUrlsChange={setExistingUrls} newFiles={newFiles} onNewFilesChange={setNewFiles} /></div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" disabled={isSubmitting} className="notion-button notion-button-primary" style={{ padding: "10px 24px", opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
      <ConfirmModal isOpen={showExitConfirm} title="Unsaved Changes" message="Leave without saving?" confirmLabel="Leave" cancelLabel="Stay"
        onConfirm={() => { setShowExitConfirm(false); router.push(`/trade/${tradeId}`); }}
        onCancel={() => setShowExitConfirm(false)} isDestructive />
    </div>
  );
}
