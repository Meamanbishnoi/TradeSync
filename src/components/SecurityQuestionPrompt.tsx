"use client";

import { useState, useEffect } from "react";
import SecurityQuestionSetup from "@/components/SecurityQuestionSetup";

export default function SecurityQuestionPrompt() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only check once per session
    const alreadyDismissed = sessionStorage.getItem("sq_prompt_dismissed");
    if (alreadyDismissed) return;

    fetch("/api/profile/security-question")
      .then(r => r.json())
      .then(data => {
        if (!data.hasSecurityQuestion) setShow(true);
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("sq_prompt_dismissed", "1");
    setDismissed(true);
    setShow(false);
  };

  if (!show || dismissed) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2000, padding: "16px",
    }}>
      <div style={{
        backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)",
        borderRadius: "12px", padding: "28px 24px", width: "100%", maxWidth: "460px",
        boxShadow: "0 10px 32px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px" }}>Set a Security Question</h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
              This lets you reset your password if you ever forget it.
            </p>
          </div>
          <button onClick={dismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "20px", lineHeight: 1, padding: "0 0 0 12px" }}>✕</button>
        </div>

        <SecurityQuestionSetup onSaved={() => { setShow(false); sessionStorage.setItem("sq_prompt_dismissed", "1"); }} />

        <button onClick={dismiss} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "var(--text-secondary)", marginTop: "12px", padding: 0 }}>
          Remind me later
        </button>
      </div>
    </div>
  );
}
