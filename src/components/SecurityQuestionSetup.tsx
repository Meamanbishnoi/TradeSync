"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";

const PRESET_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What was the make of your first car?",
  "What is your oldest sibling's middle name?",
  "What street did you grow up on?",
];

interface Props {
  currentQuestion?: string | null;
  onSaved?: () => void;
}

export default function SecurityQuestionSetup({ currentQuestion, onSaved }: Props) {
  const { showToast } = useToast();
  const [question, setQuestion] = useState(currentQuestion ?? "");
  const [customQuestion, setCustomQuestion] = useState(!PRESET_QUESTIONS.includes(currentQuestion ?? "") && !!currentQuestion);
  const [answer, setAnswer] = useState("");
  const [confirmAnswer, setConfirmAnswer] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) { showToast("Please select or enter a question", "error"); return; }
    if (!answer.trim()) { showToast("Please enter an answer", "error"); return; }
    if (answer.trim().toLowerCase() !== confirmAnswer.trim().toLowerCase()) {
      showToast("Answers do not match", "error"); return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile/security-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), answer: answer.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      showToast("Security question saved", "success");
      setAnswer(""); setConfirmAnswer("");
      onSaved?.();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error saving", "error");
    } finally { setIsSaving(false); }
  };

  return (
    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Question selector */}
      <div>
        <label style={{ display: "block", fontSize: "14px", color: "var(--text-secondary)", marginBottom: "6px" }}>Security Question</label>
        {!customQuestion ? (
          <>
            <select
              value={question}
              onChange={e => setQuestion(e.target.value)}
              className="notion-input"
              style={{ marginBottom: "6px" }}
            >
              <option value="">— Select a question —</option>
              {PRESET_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
            <button type="button" onClick={() => { setQuestion(""); setCustomQuestion(true); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "var(--accent-color)", padding: 0 }}>
              Write my own question
            </button>
          </>
        ) : (
          <>
            <input type="text" value={question} onChange={e => setQuestion(e.target.value)}
              className="notion-input" placeholder="Type your own security question" style={{ marginBottom: "6px" }} />
            <button type="button" onClick={() => { setQuestion(""); setCustomQuestion(false); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "var(--accent-color)", padding: 0 }}>
              Choose from presets
            </button>
          </>
        )}
      </div>

      {/* Answer */}
      <div>
        <label style={{ display: "block", fontSize: "14px", color: "var(--text-secondary)", marginBottom: "4px" }}>Answer</label>
        <input type="text" value={answer} onChange={e => setAnswer(e.target.value)}
          className="notion-input" placeholder="Your answer (case-insensitive)" autoComplete="off" />
      </div>
      <div>
        <label style={{ display: "block", fontSize: "14px", color: "var(--text-secondary)", marginBottom: "4px" }}>Confirm Answer</label>
        <input type="text" value={confirmAnswer} onChange={e => setConfirmAnswer(e.target.value)}
          className="notion-input" placeholder="Repeat your answer" autoComplete="off" />
      </div>

      <button type="submit" disabled={isSaving || !question || !answer} className="notion-button notion-button-primary"
        style={{ padding: "8px 20px", opacity: isSaving || !question || !answer ? 0.6 : 1, alignSelf: "flex-start" }}>
        {isSaving ? "Saving..." : currentQuestion ? "Update Security Question" : "Set Security Question"}
      </button>
    </form>
  );
}
