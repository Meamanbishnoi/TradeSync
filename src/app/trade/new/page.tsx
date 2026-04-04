"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import MultiImageUploader from "@/components/MultiImageUploader";
import ComboBox from "@/components/ComboBox";
import StarRating from "@/components/StarRating";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/components/Toast";
import { POINT_MULTIPLIERS, DEFAULT_SESSIONS } from "@/lib/constants";
import TemplateManager from "@/components/TemplateManager";
import type { TradeTemplate } from "@/app/api/templates/route";

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

export default function NewTradePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setHasUnsavedChanges(
      formData.instrument !== "" || formData.entryPrice !== "" || existingUrls.length > 0 || newFiles.length > 0 || tags.length > 0
    );
  }, [formData, existingUrls, newFiles, tags]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (hasUnsavedChanges && !isSubmitting) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [hasUnsavedChanges, isSubmitting]);

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(d => {
      if (d.customInstruments) setCustomInstruments(JSON.parse(d.customInstruments));
      if (d.customSessions) setCustomSessions(JSON.parse(d.customSessions));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (formData.entryPrice && formData.exitPrice) {
      const auto = calcPnl(formData.entryPrice, formData.exitPrice, formData.contractSize, formData.instrument, formData.direction);
      if (auto !== "") { setFormData(prev => ({ ...prev, pnl: auto })); setPnlAutoCalc(true); }
    }
  }, [formData.entryPrice, formData.exitPrice, formData.contractSize, formData.instrument, formData.direction]);

  const rMultiple = calcRMultiple(formData.entryPrice, formData.exitPrice, formData.stopLoss, formData.direction);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
    tagInputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let uploadedUrls: string[] = [];
      for (const file of newFiles) {
        const fd = new FormData(); fd.append("file", file);
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        if (r.ok) { const { url } = await r.json(); uploadedUrls.push(url); }
        else throw new Error("Failed to upload an image");
      }
      const res = await fetch("/api/trades", {
        method: "POST", headers: { "Content-Type": "application/json" },
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
      if (!res.ok) throw new Error("Failed to save trade");
      showToast("Trade saved successfully", "success");
      router.push("/trades"); router.refresh();
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

  const applyTemplate = (t: TradeTemplate) => {
    setFormData(prev => ({
      ...prev,
      instrument: t.instrument || prev.instrument,
      direction: t.direction || prev.direction,
      session: t.session || prev.session,
      contractSize: t.contractSize || prev.contractSize,
      setup: t.setup || prev.setup,
    }));
    if (t.tags.length > 0) setTags(t.tags);
  };

  const fieldLabel = (text: string, extra?: React.ReactNode) => (
    <label style={{ display: "block", fontSize: "15px", color: "var(--text-secondary)", marginBottom: "4px" }}>
      {text}{extra}
    </label>
  );

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", paddingBottom: "100px" }}>
      <div style={{ marginBottom: "24px" }}>
        <button type="button" onClick={() => hasUnsavedChanges ? setShowExitConfirm(true) : router.push("/trades")}
          style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "16px", cursor: "pointer", padding: 0 }}>
          ← Back to trades
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
        <h1 style={{ fontSize: "32px", margin: 0 }}>New Trade</h1>
        <TemplateManager
          currentForm={{
            instrument: formData.instrument,
            direction: formData.direction,
            session: formData.session,
            contractSize: formData.contractSize,
            setup: formData.setup,
            tags,
          }}
          onApply={applyTemplate}
        />
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="trade-form-grid">
          <div>{fieldLabel("Instrument")}<ComboBox name="instrument" value={formData.instrument} onChange={v => setFormData(p => ({ ...p, instrument: v }))} options={customInstruments} placeholder="e.g. ES, NQ" required /></div>
          <div>{fieldLabel("Direction")}<ComboBox name="direction" value={formData.direction} onChange={v => setFormData(p => ({ ...p, direction: v }))} options={["Long", "Short"]} required /></div>
          <div>{fieldLabel("Date")}<input type="date" name="date" value={formData.date} onChange={handleChange} className="notion-input" required /></div>
          <div>{fieldLabel("Session")}<ComboBox name="session" value={formData.session} onChange={v => setFormData(p => ({ ...p, session: v }))} options={customSessions.length > 0 ? customSessions : DEFAULT_SESSIONS} placeholder="Select Session..." /></div>
          <div>{fieldLabel("Entry Price")}<input type="number" step="any" name="entryPrice" value={formData.entryPrice} onChange={handleChange} className="notion-input" required /></div>
          <div>{fieldLabel("Exit Price")}<input type="number" step="any" name="exitPrice" value={formData.exitPrice} onChange={handleChange} className="notion-input" required /></div>
          <div>
            {fieldLabel("Stop Loss", <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>(optional)</span>)}
            <input type="number" step="any" name="stopLoss" value={formData.stopLoss} onChange={handleChange} className="notion-input" placeholder="Stop loss price" />
            {rMultiple !== "" && (
              <div style={{ marginTop: "4px", fontSize: "12px", color: parseFloat(rMultiple) >= 0 ? "#0f7b6c" : "#eb5757", fontWeight: 600 }}>
                R-Multiple: {parseFloat(rMultiple) >= 0 ? "+" : ""}{rMultiple}R
              </div>
            )}
          </div>
          <div>
            {fieldLabel("Contract / Lot Size", <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>(optional)</span>)}
            <input type="number" step="any" name="contractSize" value={formData.contractSize} onChange={handleChange} className="notion-input" placeholder="e.g. 1, 0.5" />
          </div>
          <div>
            {fieldLabel("PNL ($)", pnlAutoCalc ? <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--accent-color)" }}>auto-calculated</span> : null)}
            <input type="number" step="any" name="pnl" value={formData.pnl} onChange={handleChange} className="notion-input" required placeholder="Amount" />
          </div>
          <div>{fieldLabel("Setup")}<input type="text" name="setup" value={formData.setup} onChange={handleChange} className="notion-input" placeholder="e.g. Breakout, IFVG" /></div>
          <div>
            {fieldLabel("Trade Rating")}
            <div style={{ marginTop: "8px" }}><StarRating rating={formData.rating} onChange={v => setFormData(p => ({ ...p, rating: v }))} /></div>
          </div>
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
              className="notion-input" placeholder="e.g. FOMO, A+ setup, revenge trade" style={{ flex: 1 }} />
            <button type="button" onClick={addTag} className="notion-button" style={{ padding: "6px 14px", flexShrink: 0 }}>Add</button>
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-color)" }} />

        <div>
          <label style={{ display: "block", fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Emotions</label>
          <textarea name="emotions" value={formData.emotions} onChange={handleChange} className="notion-input" style={{ minHeight: "80px", resize: "vertical" }} placeholder="How did you feel during this trade?" />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Notes</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} className="notion-input" style={{ minHeight: "120px", resize: "vertical" }} placeholder="Trade review..." />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Screenshots</label>
          <MultiImageUploader existingUrls={existingUrls} onExistingUrlsChange={setExistingUrls} newFiles={newFiles} onNewFilesChange={setNewFiles} />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" disabled={isSubmitting} className="notion-button notion-button-primary" style={{ padding: "10px 24px", opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? "Saving..." : "Save Trade"}
          </button>
        </div>
      </form>

      <ConfirmModal isOpen={showExitConfirm} title="Unsaved Changes"
        message="You have unsaved changes. Leave anyway?" confirmLabel="Leave" cancelLabel="Stay"
        onConfirm={() => { setShowExitConfirm(false); router.push("/trades"); }}
        onCancel={() => setShowExitConfirm(false)} isDestructive />
    </div>
  );
}
