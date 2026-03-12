"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid credentials. Please try again.");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto" }}>
      <h1 style={{ fontSize: "30px", textAlign: "center", marginBottom: "32px" }}>Log in to your Journal</h1>
      
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {error && (
          <div style={{ color: "#eb5757", fontSize: "16px", backgroundColor: "rgba(235, 87, 87, 0.1)", padding: "8px", borderRadius: "4px" }}>
            {error}
          </div>
        )}
        
        <div>
          <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="notion-input"
            required
            placeholder="Enter your email"
          />
        </div>
        
        <div>
          <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="notion-input"
            required
            placeholder="Enter your password"
          />
        </div>
        
        <button type="submit" className="notion-button notion-button-primary" style={{ marginTop: "8px", padding: "8px 16px" }}>
          Continue with Email
        </button>
      </form>
      
      <div style={{ marginTop: "24px", textAlign: "center", fontSize: "16px", color: "var(--text-secondary)" }}>
        Don't have an account? <Link href="/register" style={{ color: "var(--text-primary)", textDecoration: "underline" }}>Sign up</Link>
      </div>
    </div>
  );
}
