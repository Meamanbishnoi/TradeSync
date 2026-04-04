"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = "email" | "question" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch(`/api/auth/reset-password?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setQuestion(data.question);
      setStep("question");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setIsLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, answer, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setIsLoading(false); }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "60px auto", padding: "0 16px" }}>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 6px" }}>Reset Password</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
          {step === "email" && "Enter your email to find your account."}
          {step === "question" && "Answer your security question to continue."}
          {step === "done" && "Your password has been reset."}
        </p>
      </div>

      {step === "email" && (
        <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {error && <div style={{ color: "#eb5757", fontSize: "13px", backgroundColor: "rgba(235,87,87,0.1)", padding: "8px 10px", borderRadius: "6px" }}>{error}</div>}
          <div>
            <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="notion-input" required placeholder="you@example.com" />
          </div>
          <button type="submit" disabled={isLoading} className="notion-button notion-button-primary" style={{ padding: "10px" }}>
            {isLoading ? "Looking up..." : "Continue"}
          </button>
        </form>
      )}

      {step === "question" && (
        <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {error && <div style={{ color: "#eb5757", fontSize: "13px", backgroundColor: "rgba(235,87,87,0.1)", padding: "8px 10px", borderRadius: "6px" }}>{error}</div>}
          <div style={{ padding: "12px 14px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>Security Question</div>
            <div style={{ fontSize: "15px", fontWeight: 500 }}>{question}</div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>Your Answer</label>
            <input type="text" value={answer} onChange={e => setAnswer(e.target.value)} className="notion-input" required placeholder="Enter your answer" autoComplete="off" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="notion-input" required placeholder="At least 6 characters" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="notion-input" required placeholder="Repeat new password" />
          </div>
          <button type="submit" disabled={isLoading} className="notion-button notion-button-primary" style={{ padding: "10px" }}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}

      {step === "done" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>✓</div>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>Password reset successfully. You can now log in with your new password.</p>
          <button onClick={() => router.push("/login")} className="notion-button notion-button-primary" style={{ padding: "10px 24px" }}>
            Go to Login
          </button>
        </div>
      )}

      <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--text-secondary)" }}>
        <Link href="/login" style={{ color: "var(--text-primary)", textDecoration: "underline" }}>Back to login</Link>
      </p>
    </div>
  );
}
