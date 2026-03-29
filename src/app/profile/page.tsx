"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    customInstruments: "",
    customSessions: "",
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          if (res.status === 401) { router.push("/login"); return; }
          throw new Error("Failed to load profile");
        }
        const data = await res.json();
        setFormData({
          name: data.name || "",
          email: data.email || "",
          customInstruments: data.customInstruments ? JSON.parse(data.customInstruments).join(", ") : "",
          customSessions: data.customSessions ? JSON.parse(data.customSessions).join(", ") : "",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An error occurred loading the profile";
        showToast(msg, "error");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [router, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const parsedInstruments = formData.customInstruments.split(",").map(i => i.trim()).filter(Boolean);
      const parsedSessions = formData.customSessions.split(",").map(s => s.trim()).filter(Boolean);

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          customInstruments: parsedInstruments,
          customSessions: parsedSessions,
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      showToast("Profile updated successfully", "success");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBackup = () => {
    window.location.href = "/api/backup";
  };

  const handleRestoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingRestoreFile(file);
    setIsRestoreModalOpen(true);
    e.target.value = ""; // clear input
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestoreFile) return;
    setIsRestoreModalOpen(false);
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("file", pendingRestoreFile);

    try {
      const res = await fetch("/api/restore", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to restore backup");

      showToast("Backup restored successfully!", "success");
      setTimeout(() => router.push("/"), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred during restore";
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
      setPendingRestoreFile(null);
    }
  };

  const handleCancelRestore = () => {
    setIsRestoreModalOpen(false);
    setPendingRestoreFile(null);
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

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

        <div>
          <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Email Address</label>
          <input type="email" name="email" value={formData.email} disabled readOnly className="notion-input" style={{ backgroundColor: "var(--bg-secondary)", opacity: 0.7, cursor: "not-allowed" }} />
          <span style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px", display: "block" }}>Email address cannot be changed currently.</span>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Display Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} className="notion-input" placeholder="e.g. John Doe" />
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "16px 0" }} />
        <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Trading Preferences</h2>
        <p style={{ fontSize: "16px", color: "var(--text-secondary)", marginBottom: "16px" }}>
          Define custom dropdown options for your trade entries. Separate multiple values with commas.
        </p>

        <div>
          <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Custom Instruments</label>
          <textarea name="customInstruments" value={formData.customInstruments} onChange={handleChange} className="notion-input" style={{ minHeight: "80px", resize: "vertical" }} placeholder="e.g. NQ, ES, GC, MGC" />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "16px", color: "var(--text-secondary)", marginBottom: "4px" }}>Custom Sessions</label>
          <textarea name="customSessions" value={formData.customSessions} onChange={handleChange} className="notion-input" style={{ minHeight: "80px", resize: "vertical" }} placeholder="e.g. NY-AM, NY-PM, London, Asia" />
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "16px 0" }} />
        
        <h2 style={{ fontSize: "22px", marginBottom: "8px" }}>Data Management</h2>
        <p style={{ fontSize: "16px", color: "var(--text-secondary)", marginBottom: "16px" }}>
          Securely export your trades to a .zip file containing your raw JSON data and all uploaded screenshots, or restore a previous state.
        </p>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
          <button type="button" onClick={handleBackup} className="notion-button" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download Backup (.zip)
          </button>

          <div style={{ position: "relative" }}>
            <input 
              type="file" 
              accept=".zip" 
              onChange={handleRestoreChange}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }} 
              disabled={isSubmitting}
            />
            <button type="button" className="notion-button" disabled={isSubmitting} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", pointerEvents: "none" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Restore from Backup
            </button>
          </div>
        </div>

        <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" disabled={isSubmitting} className="notion-button notion-button-primary" style={{ padding: "10px 24px", opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>

      <ConfirmModal 
        isOpen={isRestoreModalOpen}
        title="Restore Backup"
        message="WARNING: Restoring a backup will securely overwrite and permanently delete ALL your current trades to match the backup state. Are you absolutely sure you want to proceed?"
        confirmLabel="Restore"
        onConfirm={handleConfirmRestore}
        onCancel={handleCancelRestore}
        isDestructive={true}
      />
    </div>
  );
}
