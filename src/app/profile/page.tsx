"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "", // Readonly for now
    customInstruments: "",
    customSessions: "",
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          if (res.status === 401) {
             router.push("/login");
             return;
          }
          throw new Error("Failed to load profile");
        }
        
        const data = await res.json();
        
        setFormData({
          name: data.name || "",
          email: data.email || "",
          customInstruments: data.customInstruments ? JSON.parse(data.customInstruments).join(", ") : "",
          customSessions: data.customSessions ? JSON.parse(data.customSessions).join(", ") : "",
        });
      } catch (err: any) {
        setError(err.message || "An error occurred loading the profile");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const parsedInstruments = formData.customInstruments.split(",").map(i => i.trim()).filter(i => i);
      const parsedSessions = formData.customSessions.split(",").map(s => s.trim()).filter(s => s);

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: formData.name,
          customInstruments: parsedInstruments.length > 0 ? parsedInstruments : [],
          customSessions: parsedSessions.length > 0 ? parsedSessions : []
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");
      
      setSuccess(true);
      router.refresh(); // Tells Next.js to re-run server requests (like the header session)
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (isLoading) {
    return <div style={{ textAlign: "center", marginTop: "100px" }}>Loading profile...</div>;
  }

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", paddingBottom: "100px" }}>
      <div style={{ marginBottom: "24px" }}>
        <Link href="/" style={{ color: "var(--text-secondary)", fontSize: "16px", textDecoration: "none" }}>← Back to Dashboard</Link>
      </div>

      <h1 style={{ fontSize: "38px", marginBottom: "32px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>Your Profile</h1>

      {error && (
        <div style={{ color: "#eb5757", backgroundColor: "rgba(235, 87, 87, 0.1)", padding: "12px", borderRadius: "4px", marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ color: "#0f7b6c", backgroundColor: "rgba(15, 123, 108, 0.1)", padding: "12px", borderRadius: "4px", marginBottom: "24px" }}>
          Profile updated successfully! 
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        <div>
          <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Email Address</label>
          <input 
            type="email" 
            name="email" 
            value={formData.email} 
            disabled 
            readOnly
            className="notion-input" 
            style={{ backgroundColor: "var(--bg-secondary)", opacity: 0.7, cursor: "not-allowed" }}
          />
          <span style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px", display: "block" }}>Email address cannot be changed currently.</span>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Display Name</label>
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            className="notion-input" 
            placeholder="e.g. John Doe"
          />
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "16px 0" }} />
        <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Trading Preferences</h2>
        <p style={{ fontSize: "16px", color: "var(--text-secondary)", marginBottom: "16px" }}>
          Define custom dropdown options for your trade entries. Separate multiple values with commas.
        </p>

        <div>
          <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Custom Instruments</label>
          <textarea 
            name="customInstruments" 
            value={formData.customInstruments} 
            onChange={handleChange as any} 
            className="notion-input" 
            style={{ minHeight: "80px", resize: "vertical" }}
            placeholder="e.g. NQ, ES, GC, MGC"
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Custom Sessions</label>
          <textarea 
            name="customSessions" 
            value={formData.customSessions} 
            onChange={handleChange as any} 
            className="notion-input" 
            style={{ minHeight: "80px", resize: "vertical" }}
            placeholder="e.g. NY-AM, NY-PM, London, Asia"
          />
        </div>

        <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" disabled={isSubmitting} className="notion-button notion-button-primary" style={{ padding: "10px 24px", opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? "Saving..." : "Save Profile"}
          </button>
        </div>

      </form>
    </div>
  );
}
