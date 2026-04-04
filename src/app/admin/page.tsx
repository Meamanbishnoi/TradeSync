"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { useToast } from "@/components/Toast";

interface Stats {
  totalUsers: number; totalTrades: number; totalJournals: number;
  totalImages: number; recentUsers: number; blockedUsers: number;
}

interface AdminUser {
  id: string; name: string | null; email: string; createdAt: string;
  emailVerified: boolean; isAdmin: boolean; isBlocked: boolean;
  canAddTrades: boolean; canViewAnalytics: boolean; canExport: boolean;
  tradeCount: number; imageCount: number;
}

type Tab = "overview" | "users";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated" && !isAdmin) { router.push("/"); }
  }, [status, isAdmin, router]);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    setIsLoading(true);
    Promise.all([loadStats(), loadUsers()]).finally(() => setIsLoading(false));
  }, [isAdmin, loadStats, loadUsers]);

  const patch = async (userId: string, data: Record<string, boolean>) => {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
      showToast("Updated", "success");
    } catch { showToast("Failed to update", "error"); }
    finally { setUpdating(null); }
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Delete user ${email} and ALL their data? This cannot be undone.`)) return;
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUsers(prev => prev.filter(u => u.id !== userId));
      showToast("User deleted", "success");
      loadStats();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed", "error"); }
    finally { setUpdating(null); }
  };

  if (status === "loading" || isLoading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--text-secondary)" }}>Loading admin panel...</div>;
  }

  if (!isAdmin) return null;

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const StatCard = ({ label, value, color }: { label: string; value: number; color?: string }) => (
    <div style={{ padding: "20px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
      <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: 800, color: color ?? "var(--text-primary)" }}>{value.toLocaleString()}</div>
    </div>
  );

  const Toggle = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      style={{
        width: "36px", height: "20px", borderRadius: "10px", border: "none", cursor: disabled ? "default" : "pointer",
        backgroundColor: checked ? "#0f7b6c" : "var(--border-color)",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: "absolute", top: "2px", left: checked ? "18px" : "2px",
        width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#fff",
        transition: "left 0.2s",
      }} />
    </button>
  );

  return (
    <div style={{ paddingTop: "16px", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#eb5757", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: "20px", fontWeight: 800 }}>Admin Panel</div>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>TradeSync administration</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--border-color)", marginBottom: "24px" }}>
        {(["overview", "users"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 24px", fontSize: "14px", fontWeight: tab === t ? 600 : 400,
            color: tab === t ? "var(--text-primary)" : "var(--text-secondary)",
            background: "none", borderTop: "none", borderLeft: "none", borderRight: "none",
            borderBottom: tab === t ? "2px solid var(--text-primary)" : "2px solid transparent",
            cursor: "pointer", marginBottom: "-2px", fontFamily: "var(--font-family)",
            textTransform: "capitalize",
          }}>{t}</button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && stats && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
            <StatCard label="Total Users" value={stats.totalUsers} />
            <StatCard label="New This Week" value={stats.recentUsers} color="#0f7b6c" />
            <StatCard label="Blocked Users" value={stats.blockedUsers} color={stats.blockedUsers > 0 ? "#eb5757" : undefined} />
            <StatCard label="Total Trades" value={stats.totalTrades} />
            <StatCard label="Total Images" value={stats.totalImages} />
            <StatCard label="Journal Entries" value={stats.totalJournals} />
          </div>

          <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Quick Stats</div>
            {[
              { label: "Avg trades per user", value: stats.totalUsers > 0 ? (stats.totalTrades / stats.totalUsers).toFixed(1) : "0" },
              { label: "Avg images per user", value: stats.totalUsers > 0 ? (stats.totalImages / stats.totalUsers).toFixed(1) : "0" },
              { label: "Avg journal entries per user", value: stats.totalUsers > 0 ? (stats.totalJournals / stats.totalUsers).toFixed(1) : "0" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{r.label}</span>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users tab */}
      {tab === "users" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              className="notion-input" placeholder="Search by name or email..."
              style={{ maxWidth: "300px", padding: "7px 12px", fontSize: "13px" }}
            />
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{filteredUsers.length} users</span>
          </div>

          <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}>
                  {["User", "Joined", "Trades", "Images", "Add Trades", "Analytics", "Export", "Blocked", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", fontWeight: 500, textAlign: "left", color: "var(--text-secondary)", whiteSpace: "nowrap", fontSize: "12px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => (
                  <tr key={u.id} className="notion-table-row" style={{ borderBottom: i < filteredUsers.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                        {u.name || u.email.split("@")[0]}
                        {u.isAdmin && <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "4px", backgroundColor: "#eb5757", color: "#fff", fontWeight: 700 }}>ADMIN</span>}
                        {u.isBlocked && <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "4px", backgroundColor: "#f97316", color: "#fff", fontWeight: 700 }}>BLOCKED</span>}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{u.email}</div>
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{format(new Date(u.createdAt), "MMM d, yyyy")}</td>
                    <td style={{ padding: "10px 12px" }}>{u.tradeCount}</td>
                    <td style={{ padding: "10px 12px" }}>{u.imageCount}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <Toggle checked={u.canAddTrades} disabled={u.isAdmin || updating === u.id} onChange={() => patch(u.id, { canAddTrades: !u.canAddTrades })} />
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <Toggle checked={u.canViewAnalytics} disabled={u.isAdmin || updating === u.id} onChange={() => patch(u.id, { canViewAnalytics: !u.canViewAnalytics })} />
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <Toggle checked={u.canExport} disabled={u.isAdmin || updating === u.id} onChange={() => patch(u.id, { canExport: !u.canExport })} />
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <Toggle checked={u.isBlocked} disabled={u.isAdmin || updating === u.id} onChange={() => patch(u.id, { isBlocked: !u.isBlocked })} />
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {!u.isAdmin && (
                        <button
                          onClick={() => deleteUser(u.id, u.email)}
                          disabled={updating === u.id}
                          className="notion-button"
                          style={{ fontSize: "12px", padding: "3px 10px", backgroundColor: "#eb5757", color: "#fff", border: "none", opacity: updating === u.id ? 0.6 : 1 }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
