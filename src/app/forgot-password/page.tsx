"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type Step = "choose" | "email" | "question" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose");
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
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 6px" }}>Forgot Password</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
          {step === "choose" && "Choose how you'd like to recover your account."}
          {step === "email" && "Enter your email to find your account."}
          {step === "question" && "Answer your security question to continue."}
          {step === "done" && "Your password has been reset."}
        </p>
      </div>

      {/* Step 1: Choose method */}
      {step === "choose" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Google option */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="notion-button"
            style={{ width: "100%", padding: "12px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: 500 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google instead
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-secondary)", fontSize: "12px" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }} />
            or
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }} />
          </div>

          {/* Security question option */}
          <button
            type="button"
            onClick={() => setStep("email")}
            className="notion-button notion-button-primary"
            style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: 500 }}
          >
            Reset via Security Question
          </button>
        </div>
      )}

      {/* Step 2: Enter email */}
      {step === "email" && (
        <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {error && <div style={{ color: "#eb5757", fontSize: "13px", backgroundColor: "rgba(235,87,87,0.1)", padding: "8px 10px", borderRadius: "6px" }}>{error}</div>}
          <div>
            <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="notion-input" required placeholder="you@example.com" autoFocus />
          </div>
          <button type="submit" disabled={isLoading} className="notion-button notion-button-primary" style={{ padding: "10px" }}>
            {isLoading ? "Looking up..." : "Continue"}
          </button>
          <button type="button" onClick={() => { setStep("choose"); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)", padding: 0, textAlign: "center" }}>
            ← Back
          </button>
        </form>
      )}

      {/* Step 3: Answer security question + new password */}
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
          <button type="button" onClick={() => { setStep("email"); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "var(--text-secondary)", padding: 0, textAlign: "center" }}>
            ← Back
          </button>
        </form>
      )}

      {/* Done */}
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
