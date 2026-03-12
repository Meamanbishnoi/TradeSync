"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MultiImageUploader from "@/components/MultiImageUploader";
import ComboBox from "@/components/ComboBox";
import StarRating from "@/components/StarRating";

export default function NewTradePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
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

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.customInstruments) setCustomInstruments(JSON.parse(data.customInstruments));
          if (data.customSessions) setCustomSessions(JSON.parse(data.customSessions));
        }
      } catch (e) {}
    }
    fetchPreferences();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      let uploadedUrls: string[] = [];

      if (newFiles.length > 0) {
        for (const file of newFiles) {
          const fileData = new FormData();
          fileData.append("file", file);
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: fileData,
          });

          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            uploadedUrls.push(url);
          } else {
            throw new Error("Failed to upload an image");
          }
        }
      }

      const imageUrls = [...existingUrls, ...uploadedUrls];

      const tradeData = {
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
        imageUrls,
        rating: formData.rating > 0 ? formData.rating : null,
      };

      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tradeData),
      });

      if (!res.ok) throw new Error("Failed to save trade");

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", paddingBottom: "100px" }}>
      <div style={{ marginBottom: "24px" }}>
        <Link href="/" style={{ color: "var(--text-secondary)", fontSize: "16px" }}>← Back to trades</Link>
      </div>

      <h1 style={{ fontSize: "38px", marginBottom: "32px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>New Trade</h1>

      {error && (
        <div style={{ color: "#eb5757", backgroundColor: "rgba(235, 87, 87, 0.1)", padding: "12px", borderRadius: "4px", marginBottom: "24px" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          
          <div>
            <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Instrument</label>
            <ComboBox 
              name="instrument"
              value={formData.instrument} 
              onChange={(val) => setFormData({ ...formData, instrument: val })}
              options={customInstruments}
              placeholder="e.g. ES, NQ, EURUSD"
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Direction</label>
            <ComboBox 
              name="direction"
              value={formData.direction} 
              onChange={(val) => setFormData({ ...formData, direction: val as "Long" | "Short" })}
              options={["Long", "Short"]}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="notion-input" required />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Session</label>
            <ComboBox 
              name="session"
              value={formData.session} 
              onChange={(val) => setFormData({ ...formData, session: val })}
              options={customSessions.length > 0 ? customSessions : ["London", "New York", "Asia"]}
              placeholder="Select Session..."
            />
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
            <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>PNL ($)</label>
            <input type="number" step="any" name="pnl" value={formData.pnl} onChange={handleChange} className="notion-input" required placeholder="Amount (sign auto-calculated)" />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Setup</label>
            <input type="text" name="setup" value={formData.setup} onChange={handleChange} className="notion-input" placeholder="e.g. Breakout, Reversion" />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Trade Rating</label>
            <div style={{ marginTop: "8px" }}>
              <StarRating 
                rating={formData.rating} 
                onChange={(val) => setFormData({ ...formData, rating: val })} 
              />
            </div>
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "8px 0" }} />

        <div>
          <label style={{ display: "block", fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>Emotions</label>
          <textarea 
            name="emotions" 
            value={formData.emotions} 
            onChange={handleChange} 
            className="notion-input" 
            style={{ minHeight: "80px", resize: "vertical" }}
            placeholder="How did you feel during this trade?"
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>Notes</label>
          <textarea 
            name="notes" 
            value={formData.notes} 
            onChange={handleChange} 
            className="notion-input" 
            style={{ minHeight: "150px", resize: "vertical" }}
            placeholder="Write your trade review here..."
          />
        </div>

        <div>
           <label style={{ display: "block", fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>Screenshots</label>
           <MultiImageUploader 
             existingUrls={existingUrls}
             onExistingUrlsChange={setExistingUrls}
             newFiles={newFiles}
             onNewFilesChange={setNewFiles}
           />
        </div>

        <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" disabled={isSubmitting} className="notion-button notion-button-primary" style={{ padding: "10px 24px", opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? "Saving..." : "Save Trade"}
          </button>
        </div>

      </form>
    </div>
  );
}
