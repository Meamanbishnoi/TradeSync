"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";
import { useTheme } from "@/components/ThemeProvider";
import ConfirmModal from "@/components/ConfirmModal";
import SecurityQuestionSetup from "@/components/SecurityQuestionSetup";
import AvatarPicker from "@/components/AvatarPicker";
import Avatar from "@/components/Avatar";

type Tab = "profile" | "trading" | "security" | "appearance" | "data";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "profile", label: "Profile",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
  {
    id: "trading", label: "Trading",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
  {
    id: "security", label: "Security",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  },
  {
    id: "appearance", label: "Appearance",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  },
  {
    id: "data", label: "Data",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  },
];

const EyeIcon = ({ open }: { open: boolean }) => open
  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { update: updateSession } = useSession();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [memberSince, setMemberSince] = useState<string>("");

  const [formData, setFormData] = useState({ name: "", email: "", customInstruments: "", customSessions: "" });
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState({ old: false, new: false, confirm: false });
  const [isChangingPw, setIsChangingPw] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) { if (res.status === 401) { router.push("/login"); return; } throw new Error(); }
        const data = await res.json();
        setFormData({
          name: data.name || "",
          email: data.email || "",
          customInstruments: data.customInstruments ? JSON.parse(data.customInstruments).join(", ") : "",
          customSessions: data.customSessions ? JSON.parse(data.customSessions).join(", ") : "",
        });
        setHasPassword(!!data.hasPassword);
        setAvatarId(data.avatarId ?? null);
        if (data.createdAt) setMemberSince(new Date(data.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" }));
        fetch("/api/profile/security-question").then(r => r.json()).then(d => setSecurityQuestion(d.question ?? null)).catch(() => {});
      } catch { showToast("Failed to load profile", "error"); }
      finally { setIsLoading(false); }
    }
    fetchProfile();
  }, [router, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          customInstruments: formData.customInstruments.split(",").map(i => i.trim()).filter(Boolean),
          customSessions: formData.customSessions.split(",").map(s => s.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error();
      showToast("Saved", "success");
      await updateSession({ name: formData.name });
      router.refresh();
    } catch { showToast("Failed to save", "error"); }
    finally { setIsSubmitting(false); }
  };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) { showToast("Passwords do not match", "error"); return; }
    if (pwForm.newPassword.length < 6) { showToast("Password must be at least 6 characters", "error"); return; }
    setIsChangingPw(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast("Password updated", "success");
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setHasPassword(true);
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : "Error", "error"); }
    finally { setIsChangingPw(false); }
  };

  const handleRestoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingRestoreFile(file);
    setIsRestoreModalOpen(true);
    e.target.value = "";
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestoreFile) return;
    setIsRestoreModalOpen(false);
    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("file", pendingRestoreFile);
    try {
      const res = await fetch("/api/restore", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast("Backup restored!", "success");
      setTimeout(() => router.push("/"), 1500);
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : "Restore failed", "error"); }
    finally { setIsSubmitting(false); setPendingRestoreFile(null); }
  };

  if (isLoading) return <div style={{ textAlign: "center", marginTop: "100px", color: "var(--text-secondary)" }}>Loading...</div>;

  const Section = ({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) => (
    <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", marginBottom: "16px" }}>
      <div style={{ marginBottom: desc ? "4px" : "16px" }}>
        <div style={{ fontSize: "15px", fontWeight: 600 }}>{title}</div>
        {desc && <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px", marginBottom: "14px" }}>{desc}</div>}
      </div>
      {children}
    </div>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: "14px" }}>
      <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "5px", fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );

  const PwInput = ({ field, placeholder }: { field: "old" | "new" | "confirm"; placeholder: string }) => (
    <div style={{ position: "relative" }}>
      <input
        type={showPw[field] ? "text" : "password"}
        value={field === "old" ? pwForm.oldPassword : field === "new" ? pwForm.newPassword : pwForm.confirmPassword}
        onChange={e => setPwForm(p => ({ ...p, [field === "old" ? "oldPassword" : field === "new" ? "newPassword" : "confirmPassword"]: e.target.value }))}
        className="notion-input" placeholder={placeholder} style={{ paddingRight: "40px" }}
      />
      <button type="button" onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
        style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", display: "flex" }}>
        <EyeIcon open={showPw[field]} />
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", paddingTop: "16px", paddingBottom: "80px" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
        <Avatar avatarId={avatarId} name={formData.name || formData.email} size={52} />
        <div>
          <div style={{ fontSize: "20px", fontWeight: 700 }}>{formData.name || formData.email}</div>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{formData.email}{memberSince && ` · Member since ${memberSince}`}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }} className="settings-layout">
        {/* Sidebar tabs */}
        <div className="settings-sidebar" style={{ width: "180px", flexShrink: 0 }}>
          <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "9px 12px", borderRadius: "7px", border: "none",
                  backgroundColor: activeTab === tab.id ? "var(--bg-hover)" : "transparent",
                  color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-secondary)",
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  fontSize: "14px", cursor: "pointer", textAlign: "left", width: "100%",
                  fontFamily: "var(--font-family)",
                  transition: "background 0.1s, color 0.1s",
                }}>
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ── Profile tab ── */}
          {activeTab === "profile" && (
            <form onSubmit={handleSubmit}>
              <Section title="Avatar" desc="Choose an avatar that represents you.">
                <AvatarPicker currentAvatarId={avatarId} name={formData.name || formData.email} onSaved={id => setAvatarId(id ?? null)} />
              </Section>

              <Section title="Account Info">
                <Field label="Email Address">
                  <input type="email" value={formData.email} disabled readOnly className="notion-input"
                    style={{ backgroundColor: "var(--bg-color)", opacity: 0.6, cursor: "not-allowed" }} />
                </Field>
                <Field label="Display Name">
                  <input type="text" name="name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="notion-input" placeholder="Your name" />
                </Field>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" disabled={isSubmitting} className="notion-button notion-button-primary"
                    style={{ padding: "8px 20px", opacity: isSubmitting ? 0.7 : 1 }}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </Section>
            </form>
          )}

          {/* ── Trading tab ── */}
          {activeTab === "trading" && (
            <form onSubmit={handleSubmit}>
              <Section title="Custom Instruments" desc="These appear as suggestions when logging trades. Separate with commas.">
                <textarea name="customInstruments" value={formData.customInstruments}
                  onChange={e => setFormData(p => ({ ...p, customInstruments: e.target.value }))}
                  className="notion-input" style={{ minHeight: "80px", resize: "vertical" }}
                  placeholder="e.g. NQ, ES, GC, MGC, CL" />
              </Section>

              <Section title="Custom Sessions" desc="Session labels for your trades. Separate with commas.">
                <textarea name="customSessions" value={formData.customSessions}
                  onChange={e => setFormData(p => ({ ...p, customSessions: e.target.value }))}
                  className="notion-input" style={{ minHeight: "80px", resize: "vertical" }}
                  placeholder="e.g. NY-AM, NY-PM, London, Asia, Overnight" />
              </Section>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="submit" disabled={isSubmitting} className="notion-button notion-button-primary"
                  style={{ padding: "8px 20px", opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* ── Security tab ── */}
          {activeTab === "security" && (
            <div>
              <Section title={hasPassword ? "Change Password" : "Set Password"}
                desc={hasPassword ? "Update your login password." : "Set a password to log in with email in addition to Google."}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {hasPassword && (
                    <Field label="Current Password"><PwInput field="old" placeholder="Current password" /></Field>
                  )}
                  <Field label="New Password"><PwInput field="new" placeholder="At least 6 characters" /></Field>
                  <Field label="Confirm Password"><PwInput field="confirm" placeholder="Repeat new password" /></Field>
                  <div>
                    <button type="button" onClick={handlePasswordChange}
                      disabled={isChangingPw || !pwForm.newPassword}
                      className="notion-button notion-button-primary"
                      style={{ padding: "8px 20px", opacity: isChangingPw || !pwForm.newPassword ? 0.6 : 1 }}>
                      {isChangingPw ? "Updating..." : hasPassword ? "Change Password" : "Set Password"}
                    </button>
                  </div>
                </div>
              </Section>

              <Section title="Security Question"
                desc={securityQuestion ? `Current: "${securityQuestion}"` : "Set a security question to recover your account if you forget your password."}>
                <SecurityQuestionSetup
                  currentQuestion={securityQuestion}
                  onSaved={() => fetch("/api/profile/security-question").then(r => r.json()).then(d => setSecurityQuestion(d.question ?? null)).catch(() => {})}
                />
              </Section>
            </div>
          )}

          {/* ── Appearance tab ── */}
          {activeTab === "appearance" && (
            <div>
              <Section title="Theme" desc="Choose between light and dark mode.">
                <div style={{ display: "flex", gap: "10px" }}>
                  {(["light", "dark"] as const).map(t => (
                    <button key={t} type="button" onClick={() => { if (theme !== t) toggleTheme(); }}
                      style={{
                        flex: 1, padding: "14px", borderRadius: "8px", cursor: "pointer",
                        border: theme === t ? "2px solid var(--text-primary)" : "1px solid var(--border-color)",
                        backgroundColor: theme === t ? "var(--bg-hover)" : "var(--bg-color)",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                        fontFamily: "var(--font-family)", transition: "all 0.15s",
                      }}>
                      <span style={{ fontSize: "22px" }}>{t === "light" ? "☀️" : "🌙"}</span>
                      <span style={{ fontSize: "13px", fontWeight: theme === t ? 600 : 400, color: "var(--text-primary)", textTransform: "capitalize" }}>{t}</span>
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Avatar" desc="Your avatar appears in the navigation bar and profile.">
                <AvatarPicker currentAvatarId={avatarId} name={formData.name || formData.email} onSaved={id => setAvatarId(id ?? null)} />
              </Section>
            </div>
          )}

          {/* ── Data tab ── */}
          {activeTab === "data" && (
            <div>
              <Section title="Export Backup" desc="Download all your trades and journal entries as a .zip file.">
                <button type="button" onClick={() => { window.location.href = "/api/backup"; }}
                  className="notion-button"
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download Backup (.zip)
                </button>
              </Section>

              <Section title="Restore Backup" desc="Restore from a previously downloaded backup. This will overwrite all current data.">
                <div style={{ position: "relative", display: "inline-block" }}>
                  <input type="file" accept=".zip" onChange={handleRestoreChange} disabled={isSubmitting}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%" }} />
                  <button type="button" className="notion-button" disabled={isSubmitting}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", pointerEvents: "none" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Restore from Backup
                  </button>
                </div>
              </Section>

              <Section title="Account Stats">
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { label: "Email", value: formData.email },
                    { label: "Member since", value: memberSince || "—" },
                    { label: "Password", value: hasPassword ? "Set" : "Not set (Google login)" },
                    { label: "Security question", value: securityQuestion ? "Set" : "Not set" },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
                      <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{row.label}</span>
                      <span style={{ fontSize: "14px", fontWeight: 500 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>

      {/* Mobile tab bar — shown below content on small screens */}
      <style>{`
        @media (max-width: 600px) {
          .settings-sidebar { display: none !important; }
          .settings-layout { flex-direction: column !important; }
        }
        .settings-mobile-tabs {
          display: none;
        }
        @media (max-width: 600px) {
          .settings-mobile-tabs {
            display: flex;
            gap: 4px;
            overflow-x: auto;
            padding-bottom: 12px;
            margin-bottom: 16px;
            scrollbar-width: none;
          }
          .settings-mobile-tabs::-webkit-scrollbar { display: none; }
        }
      `}</style>

      {/* Mobile horizontal tab bar */}
      <div className="settings-mobile-tabs" style={{ position: "sticky", top: 0, zIndex: 5, backgroundColor: "var(--bg-color)", paddingTop: "8px" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px",
              borderRadius: "20px", border: "none", flexShrink: 0,
              backgroundColor: activeTab === tab.id ? "var(--text-primary)" : "var(--bg-secondary)",
              color: activeTab === tab.id ? "var(--bg-color)" : "var(--text-secondary)",
              fontSize: "13px", fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: "pointer", fontFamily: "var(--font-family)",
            }}>
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <ConfirmModal
        isOpen={isRestoreModalOpen}
        title="Restore Backup"
        message="WARNING: This will permanently overwrite all your current trades and journal entries. Are you sure?"
        confirmLabel="Restore"
        onConfirm={handleConfirmRestore}
        onCancel={() => { setIsRestoreModalOpen(false); setPendingRestoreFile(null); }}
        isDestructive
      />
    </div>
  );
}
