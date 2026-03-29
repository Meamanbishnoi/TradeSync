"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";

export default function SetupPasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      fetch("/api/profile").then(r => r.json()).then(d => {
        setHasPassword(!!d.hasPassword);
        // If they already have a password, skip this page
        if (d.hasPassword) router.push("/");
      });
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { showToast("Passwords do not match", "error"); return; }
    if (newPassword.length < 6) { showToast("Password must be at least 6 characters", "error"); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast("Password set! Welcome to TradeSync.", "success");
      router.push("/");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error setting password", "error");
    } finally { setIsSubmitting(false); }
  };

  const EyeIcon = ({ show }: { show: boolean }) => show ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  if (status === "loading" || hasPassword === null) {
    return <div style={{ textAlign: "center", marginTop: "100px", color: "var(--text-secondary)" }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: "400px", margin: "48px auto", padding: "0 16px" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔐</div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px" }}>Set your password</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0, lineHeight: 1.6 }}>
          Hi <strong>{session?.user?.name ?? "there"}</strong>! Create a password so you can also log in with email next time.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "14px", color: "var(--text-secondary)", marginBottom: "4px" }}>New Password</label>
          <div style={{ position: "relative" }}>
            <input type={showNew ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="notion-input" required placeholder="At least 6 characters" style={{ paddingRight: "40px" }} />
            <button type="button" onClick={() => setShowNew(p => !p)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex" }}>
              <EyeIcon show={showNew} />
            </button>
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "14px", color: "var(--text-secondary)", marginBottom: "4px" }}>Confirm Password</label>
          <div style={{ position: "relative" }}>
            <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="notion-input" required placeholder="Repeat your password" style={{ paddingRight: "40px" }} />
            <button type="button" onClick={() => setShowConfirm(p => !p)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex" }}>
              <EyeIcon show={showConfirm} />
            </button>
          </div>
        </div>
        <button type="submit" disabled={isSubmitting || !newPassword} className="notion-button notion-button-primary" style={{ padding: "10px", marginTop: "4px", opacity: isSubmitting || !newPassword ? 0.6 : 1 }}>
          {isSubmitting ? "Setting password..." : "Set Password & Continue"}
        </button>
      </form>
    </div>
  );
}
