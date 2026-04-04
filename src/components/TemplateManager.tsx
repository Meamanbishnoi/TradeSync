"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { TradeTemplate } from "@/app/api/templates/route";

interface FormSnapshot {
  instrument: string;
  direction: string;
  session: string;
  contractSize: string;
  setup: string;
  tags: string[];
}

interface Props {
  currentForm: FormSnapshot;
  onApply: (t: TradeTemplate) => void;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function TemplateManager({ currentForm, onApply }: Props) {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<TradeTemplate[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    fetch("/api/templates").then(r => r.json()).then(setTemplates).catch(() => {});
  }, []);

  const saveTemplates = async (updated: TradeTemplate[]) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error();
      setTemplates(updated);
    } catch { showToast("Failed to save templates", "error"); }
    finally { setIsSaving(false); }
  };

  const handleSaveCurrent = async () => {
    const name = newName.trim();
    if (!name) { showToast("Enter a template name", "error"); return; }
    const t: TradeTemplate = {
      id: genId(),
      name,
      instrument: currentForm.instrument,
      direction: currentForm.direction,
      session: currentForm.session,
      contractSize: currentForm.contractSize,
      setup: currentForm.setup,
      tags: currentForm.tags,
    };
    const updated = [...templates, t];
    await saveTemplates(updated);
    showToast(`Template "${name}" saved`, "success");
    setNewName("");
    setShowSaveForm(false);
  };

  const handleDelete = async (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    await saveTemplates(updated);
    showToast("Template deleted", "success");
  };

  const hasContent = currentForm.instrument || currentForm.setup || currentForm.session;

  return (
    <div style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="notion-button"
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", fontSize: "13px" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        Templates
        {templates.length > 0 && (
          <span style={{ fontSize: "11px", backgroundColor: "var(--bg-hover)", borderRadius: "10px", padding: "1px 6px" }}>{templates.length}</span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setIsOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0,
            width: "300px", backgroundColor: "var(--bg-color)",
            border: "1px solid var(--border-color)", borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 50,
            overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>Trade Templates</span>
              <button type="button" onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "18px", lineHeight: 1 }}>×</button>
            </div>

            {/* Template list */}
            <div style={{ maxHeight: "240px", overflowY: "auto" }}>
              {templates.length === 0 ? (
                <div style={{ padding: "20px 14px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                  No templates yet. Save your current form as a template below.
                </div>
              ) : (
                templates.map(t => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid var(--border-color)", gap: "10px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {[t.instrument, t.direction, t.session, t.setup].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { onApply(t); setIsOpen(false); showToast(`Applied "${t.name}"`, "success"); }}
                      className="notion-button"
                      style={{ fontSize: "12px", padding: "4px 10px", flexShrink: 0 }}
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "16px", lineHeight: 1, flexShrink: 0, padding: "2px" }}
                      title="Delete template"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Save current as template */}
            <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border-color)" }}>
              {!showSaveForm ? (
                <button
                  type="button"
                  onClick={() => setShowSaveForm(true)}
                  disabled={!hasContent}
                  className="notion-button"
                  style={{ width: "100%", fontSize: "13px", padding: "7px", opacity: hasContent ? 1 : 0.5 }}
                >
                  + Save current form as template
                </button>
              ) : (
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSaveCurrent(); } if (e.key === "Escape") setShowSaveForm(false); }}
                    className="notion-input"
                    placeholder="Template name..."
                    style={{ flex: 1, padding: "6px 10px", fontSize: "13px" }}
                    autoFocus
                  />
                  <button type="button" onClick={handleSaveCurrent} disabled={isSaving} className="notion-button notion-button-primary" style={{ padding: "6px 12px", fontSize: "13px", flexShrink: 0 }}>
                    {isSaving ? "..." : "Save"}
                  </button>
                  <button type="button" onClick={() => setShowSaveForm(false)} className="notion-button" style={{ padding: "6px 10px", fontSize: "13px", flexShrink: 0 }}>
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
