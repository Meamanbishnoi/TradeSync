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
  const [isEditing, setIsEditing] = useState(false);
  const [savedContent, setSavedContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadEntry = useCallback(async (d: string) => {
    setIsLoading(true);
    setIsEditing(false);
    try {
      const res = await fetch(`/api/journal?date=${d}`);
      const data = await res.json();
      const content = data.prePlan ?? "";
      setSavedContent(content);
      // Count words from loaded content
      const text = content.replace(/<[^>]*>/g, " ").trim();
      setWordCount(text ? text.split(/\s+/).filter(Boolean).length : 0);
    } catch {
      setSavedContent("");
      setWordCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadEntry(date); }, [date, loadEntry]);

  // When entering edit mode, populate editor with saved content
  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.innerHTML = savedContent;
      editorRef.current.focus();
      // Place cursor at end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing, savedContent]);

  const updateWordCount = () => {
    const text = (editorRef.current?.innerText ?? "").trim();
    setWordCount(text ? text.split(/\s+/).filter(Boolean).length : 0);
  };

  const save = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setIsSaving(true);
    try {
      const content = editorRef.current?.innerHTML ?? "";
      const res = await fetch("/api/journal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, prePlan: content, review: "" }),
      });
      if (!res.ok) throw new Error();
      setSavedContent(content);
      setIsEditing(false);
      showToast("Journal saved", "success");
    } catch {
      showToast("Error saving", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const discard = () => {
    setIsEditing(false);
  };

  const fmt = (cmd: FormatCmd, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const hasContent = savedContent && savedContent.replace(/<[^>]*>/g, "").trim().length > 0;

  const ToolBtn = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center",
        background: "none", border: "none", borderRadius: "4px",
        cursor: "pointer", color: "var(--text-primary)", fontSize: "13px", fontWeight: 600,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
      onMouseLeave={e => (e.currentTarget.style.background = "none")}
    >
      {children}
    </button>
  );

  const Sep = () => <div style={{ width: "1px", height: "18px", backgroundColor: "var(--border-color)", margin: "0 3px" }} />;

  const displayDate = format(new Date(date + "T12:00:00"), "EEEE, MMMM d, yyyy");
  const isToday = date === format(new Date(), "yyyy-MM-dd");

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", paddingTop: "16px", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "28px", margin: 0, fontWeight: 800, letterSpacing: "-0.02em" }}>Daily Journal</h1>
        <p style={{ color: "var(--text-secondary)", margin: "4px 0 0", fontSize: "14px" }}>Your private trading diary.</p>
      </div>

      {/* Date nav */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
        <button
          onClick={() => setDate(format(subDays(new Date(date + "T12:00:00"), 1), "yyyy-MM-dd"))}
          className="notion-button" style={{ padding: "8px 12px", fontSize: "18px", flexShrink: 0 }}
        >‹</button>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px", padding: "10px 14px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", minWidth: 0 }}>
          {/* Top row: date picker + Today badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="date" value={date} onChange={e => setDate(e.target.value)}
              className="notion-input"
              style={{ border: "none", background: "none", padding: 0, width: "auto", fontSize: "13px", color: "var(--text-secondary)", flexShrink: 0 }}
            />
            {isToday && (
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", backgroundColor: "#10b981", color: "#fff", fontWeight: 600, flexShrink: 0 }}>Today</span>
            )}
          </div>
          {/* Bottom row: full date label */}
          <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {displayDate}
          </span>
        </div>

        <button
          onClick={() => setDate(format(addDays(new Date(date + "T12:00:00"), 1), "yyyy-MM-dd"))}
          className="notion-button" style={{ padding: "8px 12px", fontSize: "18px", flexShrink: 0 }}
        >›</button>
        <button
          onClick={() => setDate(format(new Date(), "yyyy-MM-dd"))}
          className="notion-button" style={{ padding: "8px 10px", fontSize: "12px", flexShrink: 0 }}
        >Today</button>
      </div>

      {isLoading ? (
        <div style={{ padding: "60px", textAlign: "center", color: "var(--text-secondary)", fontSize: "14px" }}>Loading...</div>
      ) : isEditing ? (
        /* ── EDITOR MODE ── */
        <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: "2px", padding: "8px 10px", borderBottom: "1px solid var(--border-color)", flexWrap: "wrap", backgroundColor: "var(--bg-color)" }}>
            <ToolBtn onClick={() => fmt("bold")} title="Bold"><b>B</b></ToolBtn>
            <ToolBtn onClick={() => fmt("italic")} title="Italic"><i>I</i></ToolBtn>
            <ToolBtn onClick={() => fmt("underline")} title="Underline"><u>U</u></ToolBtn>
            <ToolBtn onClick={() => fmt("strikeThrough")} title="Strikethrough"><s>S</s></ToolBtn>
            <Sep />
            <ToolBtn onClick={() => fmt("formatBlock", "h2")} title="Heading 2">H2</ToolBtn>
            <ToolBtn onClick={() => fmt("formatBlock", "h3")} title="Heading 3">H3</ToolBtn>
            <ToolBtn onClick={() => fmt("formatBlock", "p")} title="Paragraph">¶</ToolBtn>
            <Sep />
            <ToolBtn onClick={() => fmt("insertUnorderedList")} title="Bullet list">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/>
                <circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/>
              </svg>
            </ToolBtn>
            <ToolBtn onClick={() => fmt("insertOrderedList")} title="Numbered list">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/>
                <path d="M4 6h1v4" strokeLinecap="round"/><path d="M4 10h2" strokeLinecap="round"/>
                <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" strokeLinecap="round"/>
              </svg>
            </ToolBtn>
            <Sep />
            <ToolBtn onClick={() => fmt("formatBlock", "blockquote")} title="Quote">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
              </svg>
            </ToolBtn>
            <ToolBtn onClick={() => { document.execCommand("removeFormat"); editorRef.current?.focus(); }} title="Clear formatting">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7V4h16v3"/><path d="M5 20h6"/><path d="M13 4l-4 16"/>
                <line x1="17" y1="10" x2="22" y2="15"/><line x1="22" y1="10" x2="17" y2="15"/>
              </svg>
            </ToolBtn>
            <div style={{ marginLeft: "auto", fontSize: "12px", color: "var(--text-secondary)" }}>{wordCount} words</div>
          </div>

          {/* Editable area */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={updateWordCount}
            style={{
              minHeight: "400px", padding: "24px",
              outline: "none", fontSize: "16px", lineHeight: "1.8",
              color: "var(--text-primary)", backgroundColor: "var(--bg-secondary)",
            }}
            data-placeholder="Start writing your journal entry..."
          />

          {/* Action bar */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px", padding: "12px 16px", borderTop: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)" }}>
            <button onClick={discard} className="notion-button" style={{ padding: "7px 18px", fontSize: "13px" }}>
              Discard
            </button>
            <button onClick={save} disabled={isSaving} className="notion-button notion-button-primary" style={{ padding: "7px 20px", fontSize: "13px", opacity: isSaving ? 0.7 : 1 }}>
              {isSaving ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </div>
      ) : hasContent ? (
        /* ── VIEW MODE — has content ── */
        <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
          {/* View header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)" }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{wordCount} words</span>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="notion-button"
              style={{ padding: "5px 14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
          </div>

          {/* Rendered content */}
          <div
            className="journal-view"
            dangerouslySetInnerHTML={{ __html: savedContent }}
            style={{ padding: "28px 32px", fontSize: "16px", lineHeight: "1.85", color: "var(--text-primary)" }}
          />
        </div>
      ) : (
        /* ── EMPTY STATE ── */
        <div
          onClick={() => setIsEditing(true)}
          style={{
            border: "2px dashed var(--border-color)", borderRadius: "12px",
            padding: "64px 32px", textAlign: "center", cursor: "pointer",
            transition: "border-color 0.2s, background 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--text-secondary)"; (e.currentTarget as HTMLDivElement).style.background = "var(--bg-hover)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-color)"; (e.currentTarget as HTMLDivElement).style.background = "none"; }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)", marginBottom: "12px" }}>
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "15px" }}>No entry for this day.</p>
          <p style={{ color: "var(--text-secondary)", margin: "6px 0 0", fontSize: "13px", opacity: 0.7 }}>Click to start writing</p>
        </div>
      )}

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: var(--text-secondary);
          pointer-events: none;
          opacity: 0.5;
        }
        [contenteditable] h2 { font-size: 20px; font-weight: 700; margin: 16px 0 6px; }
        [contenteditable] h3 { font-size: 17px; font-weight: 600; margin: 14px 0 4px; }
        [contenteditable] blockquote { border-left: 3px solid var(--border-color); padding-left: 14px; color: var(--text-secondary); margin: 10px 0; font-style: italic; }
        [contenteditable] ul, [contenteditable] ol { padding-left: 22px; margin: 6px 0; }
        [contenteditable] li { margin: 3px 0; }
        [contenteditable] p { margin: 4px 0; }

        .journal-view h2 { font-size: 20px; font-weight: 700; margin: 20px 0 8px; color: var(--text-primary); }
        .journal-view h3 { font-size: 17px; font-weight: 600; margin: 16px 0 6px; color: var(--text-primary); }
        .journal-view p { margin: 6px 0; color: var(--text-primary); }
        .journal-view blockquote { border-left: 3px solid var(--border-color); padding-left: 16px; color: var(--text-secondary); margin: 12px 0; font-style: italic; }
        .journal-view ul, .journal-view ol { padding-left: 24px; margin: 8px 0; color: var(--text-primary); }
        .journal-view li { margin: 4px 0; }
        .journal-view strong { font-weight: 700; }
        .journal-view em { font-style: italic; }
        .journal-view u { text-decoration: underline; }
        .journal-view s { text-decoration: line-through; }
      `}</style>
    </div>
  );
}
