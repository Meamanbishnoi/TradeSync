"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (res.ok) {
      // Auto login after registration
      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!loginRes?.error) {
        router.push("/");
        router.refresh();
      }
    } else {
      const data = await res.json();
      setError(data.message || "Registration failed");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto" }}>
      <h1 style={{ fontSize: "30px", textAlign: "center", marginBottom: "32px" }}>Sign up</h1>
      
      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {error && (
          <div style={{ color: "#eb5757", fontSize: "16px", backgroundColor: "rgba(235, 87, 87, 0.1)", padding: "8px", borderRadius: "4px" }}>
            {error}
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Name (optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="notion-input"
            placeholder="How should we call you?"
          />
        </div>
        
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
            placeholder="Create a password"
          />
        </div>
        
        <button type="submit" className="notion-button notion-button-primary" style={{ marginTop: "8px", padding: "8px 16px" }}>
          Create Account
        </button>
      </form>
      
      <div style={{ marginTop: "24px", textAlign: "center", fontSize: "16px", color: "var(--text-secondary)" }}>
        Already have an account? <Link href="/login" style={{ color: "var(--text-primary)", textDecoration: "underline" }}>Log in</Link>
      </div>
    </div>
  );
}
