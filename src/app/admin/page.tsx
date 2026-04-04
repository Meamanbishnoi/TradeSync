"use client";

import { useState, useEffect, useCallback } from "react";
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

const S = {
  card: { backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "10px", padding: "20px" } as React.CSSProperties,
  label: { fontSize: "11px", color: "#666", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: "8px" },
  value: { fontSize: "30px", fontWeight: 800, lineHeight: 1 },
  th: { padding: "10px 14px", fontWeight: 500, textAlign: "left" as const, color: "#666", fontSize: "11px", textTransform: "uppercase" as const, letterSpacing: "0.05em", whiteSpace: "nowrap" as const, backgroundColor: "#161616", borderBottom: "1px solid #2a2a2a" },
  td: { padding: "12px 14px", borderBottom: "1px solid #1e1e1e", fontSize: "13px" },
};

export default function AdminPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([loadStats(), loadUsers()]).finally(() => setIsLoading(false));
  }, [loadStats, loadUsers]);

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
    if (!window.confirm(`Delete ${email} and ALL their data? Cannot be undone.`)) return;
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

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const Toggle = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
    <button type="button" onClick={onChange} disabled={disabled}
      style={{ width: "38px", height: "22px", borderRadius: "11px", border: "none", cursor: disabled ? "default" : "pointer", backgroundColor: checked ? "#10b981" : "#333", position: "relative", transition: "background 0.2s", flexShrink: 0, opacity: disabled ? 0.4 : 1 }}>
      <span style={{ position: "absolute", top: "3px", left: checked ? "19px" : "3px", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#fff", transition: "left 0.2s" }} />
    </button>
  );

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#666", fontSize: "14px" }}>
      Loading...
    </div>
  );

  return (
    <div>
      {/* Page title */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#fff" }}>Dashboard</h1>
        <p style={{ color: "#666", fontSize: "13px", margin: "4px 0 0" }}>
          {format(new Date(), "EEEE, MMMM d, yyyy")} · Logged in as {session?.user?.email}
        </p>
      </div>

      {/* Stat cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "28px" }}>
          {[
            { label: "Total Users", value: stats.totalUsers, color: "#fff" },
            { label: "New This Week", value: stats.recentUsers, color: "#10b981" },
            { label: "Blocked", value: stats.blockedUsers, color: stats.blockedUsers > 0 ? "#eb5757" : "#fff" },
            { label: "Total Trades", value: stats.totalTrades, color: "#fff" },
            { label: "Screenshots", value: stats.totalImages, color: "#fff" },
            { label: "Journal Entries", value: stats.totalJournals, color: "#fff" },
          ].map(c => (
            <div key={c.label} style={S.card}>
              <div style={S.label}>{c.label}</div>
              <div style={{ ...S.value, color: c.color }}>{c.value.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #2a2a2a", marginBottom: "20px", gap: "0" }}>
        {(["overview", "users"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 20px", fontSize: "13px", fontWeight: tab === t ? 600 : 400,
            color: tab === t ? "#fff" : "#666", background: "none",
            borderTop: "none", borderLeft: "none", borderRight: "none",
            borderBottom: tab === t ? "2px solid #fff" : "2px solid transparent",
            cursor: "pointer", marginBottom: "-1px", fontFamily: "inherit", textTransform: "capitalize",
          }}>{t === "overview" ? "Overview" : `Users (${users.length})`}</button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && stats && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={S.card}>
            <div style={{ ...S.label, marginBottom: "16px" }}>Platform Summary</div>
            {[
              { label: "Avg trades / user", value: stats.totalUsers > 0 ? (stats.totalTrades / stats.totalUsers).toFixed(1) : "0" },
              { label: "Avg images / user", value: stats.totalUsers > 0 ? (stats.totalImages / stats.totalUsers).toFixed(1) : "0" },
              { label: "Avg journal entries / user", value: stats.totalUsers > 0 ? (stats.totalJournals / stats.totalUsers).toFixed(1) : "0" },
              { label: "Active users (not blocked)", value: (stats.totalUsers - stats.blockedUsers).toString() },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #222" }}>
                <span style={{ fontSize: "13px", color: "#888" }}>{r.label}</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={{ ...S.label, marginBottom: "16px" }}>Recent Users</div>
            {users.slice(0, 6).map(u => (
              <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #222" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "#fff" }}>{u.name || u.email.split("@")[0]}</div>
                  <div style={{ fontSize: "11px", color: "#666" }}>{u.email}</div>
                </div>
                <div style={{ fontSize: "11px", color: "#555" }}>{format(new Date(u.createdAt), "MMM d")}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users */}
      {tab === "users" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              style={{ padding: "8px 14px", fontSize: "13px", backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "7px", color: "#fff", outline: "none", width: "260px" }} />
            <span style={{ fontSize: "12px", color: "#666" }}>{filteredUsers.length} users</span>
          </div>

          <div style={{ overflowX: "auto", border: "1px solid #2a2a2a", borderRadius: "10px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  {["User", "Joined", "Trades", "Images", "Add Trades", "Analytics", "Export", "Blocked", ""].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} style={{ backgroundColor: u.isBlocked ? "rgba(235,87,87,0.04)" : "transparent" }}>
                    <td style={S.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#888", flexShrink: 0 }}>
                          {(u.name || u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#fff", display: "flex", alignItems: "center", gap: "5px" }}>
                            {u.name || u.email.split("@")[0]}
                            {u.isAdmin && <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "3px", backgroundColor: "#eb5757", color: "#fff" }}>ADMIN</span>}
                            {u.isBlocked && <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "3px", backgroundColor: "#f97316", color: "#fff" }}>BLOCKED</span>}
                          </div>
                          <div style={{ fontSize: "11px", color: "#555" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...S.td, color: "#666", whiteSpace: "nowrap" }}>{format(new Date(u.createdAt), "MMM d, yyyy")}</td>
                    <td style={{ ...S.td, color: "#aaa" }}>{u.tradeCount}</td>
                    <td style={{ ...S.td, color: "#aaa" }}>{u.imageCount}</td>
                    <td style={S.td}><Toggle checked={u.canAddTrades} disabled={u.isAdmin || updating === u.id} onChange={() => patch(u.id, { canAddTrades: !u.canAddTrades })} /></td>
                    <td style={S.td}><Toggle checked={u.canViewAnalytics} disabled={u.isAdmin || updating === u.id} onChange={() => patch(u.id, { canViewAnalytics: !u.canViewAnalytics })} /></td>
                    <td style={S.td}><Toggle checked={u.canExport} disabled={u.isAdmin || updating === u.id} onChange={() => patch(u.id, { canExport: !u.canExport })} /></td>
                    <td style={S.td}><Toggle checked={u.isBlocked} disabled={u.isAdmin || updating === u.id} onChange={() => patch(u.id, { isBlocked: !u.isBlocked })} /></td>
                    <td style={S.td}>
                      {!u.isAdmin && (
                        <button onClick={() => deleteUser(u.id, u.email)} disabled={updating === u.id}
                          style={{ fontSize: "12px", padding: "4px 10px", backgroundColor: "rgba(235,87,87,0.15)", color: "#eb5757", border: "1px solid rgba(235,87,87,0.3)", borderRadius: "5px", cursor: "pointer", opacity: updating === u.id ? 0.5 : 1 }}>
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
