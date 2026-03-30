"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { format, addDays, subDays } from "date-fns";
import { useToast } from "@/components/Toast";

type FormatCmd = "bold" | "italic" | "underline" | "strikeThrough" | "insertUnorderedList" | "insertOrderedList" | "formatBlock";

export default function JournalPage() {
  const { showToast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadEntry = useCallback(async (d: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/journal?date=${d}`);
      const data = await res.json();
      if (editorRef.current) {
        editorRef.current.innerHTML = data.prePlan ?? "";
        updateWordCount();
      }
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadEntry(date); }, [date, loadEntry]);

  const updateWordCount = () => {
    const text = editorRef.current?.innerText ?? "";
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
  };

  const autoSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const content = editorRef.current?.innerHTML ?? "";
      try {
        await fetch("/api/journal", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, prePlan: content, review: "" }),
        });
      } catch {}
    }, 1500);
  }, [date]);

  const save = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setIsSaving(true);
    try {
      const content = editorRef.current?.innerHTML ?? "";
      const res = await fetch("/api/journal", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, prePlan: content, review: "" }),
      });
      if (!res.ok) throw new Error();
      showToast("Journal saved", "success");
    } catch { showToast("Error saving", "error"); }
    finally { setIsSaving(false); }
  };

  const fmt = (cmd: FormatCmd, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const ToolBtn = ({ onClick, title, children, active }: { onClick: () => void; title: string; children: React.ReactNode; active?: boolean }) => (
    <button type="button" onClick={onClick} title={title}
      style={{
        width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center",
        background: active ? "var(--bg-hover)" : "none", border: "none", borderRadius: "5px",
        cursor: "pointer", color: "var(--text-primary)", fontSize: "14px", fontWeight: 600,
        transition: "background 0.1s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
      onMouseLeave={e => e.currentTarget.style.background = active ? "var(--bg-hover)" : "none"}
    >{children}</button>
  );

  const Divider = () => <div style={{ width: "1px", height: "20px", backgroundColor: "var(--border-color)", margin: "0 4px" }} />;

  const displayDate = format(new Date(date + "T12:00:00"), "EEEE, MMMM d, yyyy");
  const isToday = date === format(new Date(), "yyyy-MM-dd");

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", paddingTop: "16px", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "28px", margin: 0, fontWeight: 800, letterSpacing: "-0.02em" }}>Daily Journal</h1>
        <p style={{ color: "var(--text-secondary)", margin: "4px 0 0", fontSize: "14px" }}>Write freely. Format as you go.</p>
      </div>

      {/* Date nav */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
        <button onClick={() => setDate(format(subDays(new Date(date + "T12:00:00"), 1), "yyyy-MM-dd"))}
          className="notion-button" style={{ padding: "6px 10px", fontSize: "16px" }}>‹</button>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px", padding: "8px 14px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="notion-input" style={{ border: "none", background: "none", padding: 0, width: "auto", fontSize: "14px", color: "var(--text-secondary)" }} />
          <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>{displayDate}</span>
          {isToday && <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", backgroundColor: "#10b981", color: "#fff", fontWeight: 600 }}>Today</span>}
        </div>
        <button onClick={() => setDate(format(addDays(new Date(date + "T12:00:00"), 1), "yyyy-MM-dd"))}
          className="notion-button" style={{ padding: "6px 10px", fontSize: "16px" }}>›</button>
        <button onClick={() => setDate(format(new Date(), "yyyy-MM-dd"))}
          className="notion-button" style={{ padding: "6px 12px", fontSize: "13px" }}>Today</button>
      </div>

      {/* Editor card */}
      <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: "2px", padding: "8px 12px", borderBottom: "1px solid var(--border-color)", flexWrap: "wrap" }}>
          <ToolBtn onClick={() => fmt("bold")} title="Bold (Ctrl+B)"><b>B</b></ToolBtn>
          <ToolBtn onClick={() => fmt("italic")} title="Italic (Ctrl+I)"><i>I</i></ToolBtn>
          <ToolBtn onClick={() => fmt("underline")} title="Underline (Ctrl+U)"><u>U</u></ToolBtn>
          <ToolBtn onClick={() => fmt("strikeThrough")} title="Strikethrough"><s>S</s></ToolBtn>
          <Divider />
          <ToolBtn onClick={() => fmt("formatBlock", "h2")} title="Heading">H</ToolBtn>
          <ToolBtn onClick={() => fmt("formatBlock", "p")} title="Paragraph">¶</ToolBtn>
          <Divider />
          <ToolBtn onClick={() => fmt("insertUnorderedList")} title="Bullet list">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>
          </ToolBtn>
          <ToolBtn onClick={() => fmt("insertOrderedList")} title="Numbered list">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4" strokeLinecap="round"/><path d="M4 10h2" strokeLinecap="round"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" strokeLinecap="round"/></svg>
          </ToolBtn>
          <Divider />
          <ToolBtn onClick={() => fmt("formatBlock", "blockquote")} title="Quote">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
          </ToolBtn>
          <ToolBtn onClick={() => { document.execCommand("removeFormat"); editorRef.current?.focus(); }} title="Clear formatting">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4h16v3"/><path d="M5 20h6"/><path d="M13 4l-4 16"/><line x1="17" y1="10" x2="22" y2="15"/><line x1="22" y1="10" x2="17" y2="15"/></svg>
          </ToolBtn>
          <div style={{ marginLeft: "auto", fontSize: "12px", color: "var(--text-secondary)" }}>{wordCount} words</div>
        </div>

        {/* Content area */}
        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)", fontSize: "14px" }}>Loading...</div>
        ) : (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={() => { updateWordCount(); autoSave(); }}
            style={{
              minHeight: "420px", padding: "20px 24px",
              outline: "none", fontSize: "16px", lineHeight: "1.8",
              color: "var(--text-primary)", backgroundColor: "var(--bg-secondary)",
            }}
            data-placeholder="Start writing your journal entry... Use the toolbar above to format your text."
          />
        )}

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderTop: "1px solid var(--border-color)" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Auto-saves as you type</span>
          <button onClick={save} disabled={isSaving} className="notion-button notion-button-primary" style={{ padding: "7px 20px", fontSize: "13px", opacity: isSaving ? 0.7 : 1 }}>
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: var(--text-secondary);
          pointer-events: none;
          opacity: 0.5;
        }
        [contenteditable] h2 { font-size: 20px; font-weight: 700; margin: 12px 0 4px; }
        [contenteditable] blockquote { border-left: 3px solid var(--border-color); padding-left: 12px; color: var(--text-secondary); margin: 8px 0; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 20px; margin: 4px 0; }
        [contenteditable] li { margin: 2px 0; }
      `}</style>
    </div>
  );
}
