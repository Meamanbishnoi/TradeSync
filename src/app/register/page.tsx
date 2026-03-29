"use client";

import { signIn } from "next-auth/react";

export default function RegisterPage() {
  return (
    <div style={{ maxWidth: "400px", margin: "48px auto", padding: "0 16px" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <div style={{ background: "var(--text-primary)", color: "var(--bg-color)", width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: "20px", letterSpacing: "-0.02em" }}>TradeSync</span>
        </div>
        <h1 style={{ fontSize: "26px", fontWeight: 700, margin: "0 0 8px" }}>Create your account</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
          Sign up with Google to get started instantly.
        </p>
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/setup-password" })}
        className="notion-button"
        style={{ width: "100%", padding: "12px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", fontSize: "15px", fontWeight: 500 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <p style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "var(--text-secondary)" }}>
        Already have an account?{" "}
        <a href="/login" style={{ color: "var(--text-primary)", textDecoration: "underline" }}>Log in</a>
      </p>

      <p style={{ textAlign: "center", marginTop: "32px", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
        By signing up, you agree to keep your trading data private and secure.
      </p>
    </div>
  );
}
