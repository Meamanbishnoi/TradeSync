"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function VerifyContent() {
  const params = useSearchParams();
  const email = params.get("email") ?? "your email";

  return (
    <div style={{ maxWidth: "420px", margin: "60px auto", textAlign: "center", padding: "0 16px" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>📧</div>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "12px" }}>Check your inbox</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: 1.6, marginBottom: "24px" }}>
        We sent a verification link to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>.
        Click the link in the email to activate your account.
      </p>
      <div style={{ padding: "16px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "24px" }}>
        Didn&apos;t get it? Check your spam folder, or{" "}
        <Link href="/register" style={{ color: "var(--accent-color)", textDecoration: "underline" }}>
          try registering again
        </Link>{" "}
        to resend.
      </div>
      <Link href="/login" style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
        ← Back to login
      </Link>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
