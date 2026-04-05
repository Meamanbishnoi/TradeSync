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
  maxTrades: number | null; maxImages: number | null;
}

type Tab = "overview" | "users";
const PAGE_SIZE = 8;

// Shorthand for CSS var references
const v = (name: string) => `var(${name})` as string;

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onChange} disabled={disabled}
      style={{ width: "36px", height: "20px", borderRadius: "10px", border: "none",
        cursor: disabled ? "default" : "pointer",
        backgroundColor: checked ? "#10b981" : v("--a-toggle-off"),
        position: "relative", transition: "background 0.2s",
        flexShrink: 0, opacity: disabled ? 0.4 : 1, outline: "none" }}>
      <span style={{ position: "absolute", top: "2px", left: checked ? "18px" : "2px", width: "16px", height: "16px",
        borderRadius: "50%", backgroundColor: "#fff", transition: "left 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </button>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number | string; color?: string; icon: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: v("--a-bg"), border: `1px solid ${v("--a-border")}`, borderRadius: "12px",
      padding: "20px 22px", display: "flex", alignItems: "center", gap: "16px",
      boxShadow: v("--a-card-shadow") }}>
      <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: v("--a-bg3"),
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: color ?? v("--a-text3") }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "11px", color: v("--a-text3"), fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px" }}>{label}</div>
        <div style={{ fontSize: "26px", fontWeight: 800, lineHeight: 1, color: color ?? v("--a-text") }}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [editingLimit, setEditingLimit] = useState<{ id: string; field: "maxTrades" | "maxImages"; value: string } | null>(null);

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

  const patch = async (userId: string, data: Record<string, boolean | number | null>) => {
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

  const saveLimit = async (userId: string, field: "maxTrades" | "maxImages", raw: string) => {
    const val = raw.trim() === "" ? null : parseInt(raw);
    if (raw.trim() !== "" && (isNaN(val as number) || (val as number) < 0)) {
      showToast("Enter a valid number or leave empty for unlimited", "error");
      return;
    }
    await patch(userId, { [field]: val });
    setEditingLimit(null);
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Delete ${email} and ALL their data? This cannot be undone.`)) return;
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

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [search]);

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", gap: "10px", color: v("--a-text3") }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      Loading...
    </div>
  );

  const statIcons = {
    users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    new: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
    blocked: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
    trades: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    images: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    journal: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  };

  const th: React.CSSProperties = {
    padding: "11px 14px", fontWeight: 600, textAlign: "left", color: v("--a-text3"),
    fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
    backgroundColor: v("--a-th-bg"), borderBottom: `1px solid ${v("--a-border")}`,
  };
  const td: React.CSSProperties = {
    padding: "13px 14px", borderBottom: `1px solid ${v("--a-border")}`, fontSize: "13px", verticalAlign: "middle",
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Page header */}
      <div style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0, color: v("--a-text"), letterSpacing: "-0.02em" }}>Admin Dashboard</h1>
          <p style={{ color: v("--a-text3"), fontSize: "13px", margin: "4px 0 0" }}>
            {format(new Date(), "EEEE, MMMM d, yyyy")} · {session?.user?.email}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["overview", "users"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 18px", fontSize: "13px", fontWeight: 500, borderRadius: "8px",
              border: `1px solid ${tab === t ? v("--a-border2") : "transparent"}`,
              backgroundColor: tab === t ? v("--a-bg3") : "transparent",
              color: tab === t ? v("--a-text") : v("--a-text3"),
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}>
              {t === "overview" ? "Overview" : `Users (${users.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "28px" }}>
          <StatCard label="Total Users" value={stats.totalUsers} icon={statIcons.users} />
          <StatCard label="New This Week" value={stats.recentUsers} color="#10b981" icon={statIcons.new} />
          <StatCard label="Blocked" value={stats.blockedUsers} color={stats.blockedUsers > 0 ? "#ef4444" : undefined} icon={statIcons.blocked} />
          <StatCard label="Total Trades" value={stats.totalTrades} icon={statIcons.trades} />
          <StatCard label="Screenshots" value={stats.totalImages} icon={statIcons.images} />
          <StatCard label="Journal Entries" value={stats.totalJournals} icon={statIcons.journal} />
        </div>
      )}

      {/* Overview tab */}
      {tab === "overview" && stats && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {[
            {
              title: "Platform Summary",
              rows: [
                { label: "Avg trades / user", value: stats.totalUsers > 0 ? (stats.totalTrades / stats.totalUsers).toFixed(1) : "0" },
                { label: "Avg images / user", value: stats.totalUsers > 0 ? (stats.totalImages / stats.totalUsers).toFixed(1) : "0" },
                { label: "Avg journal entries / user", value: stats.totalUsers > 0 ? (stats.totalJournals / stats.totalUsers).toFixed(1) : "0" },
                { label: "Active users", value: (stats.totalUsers - stats.blockedUsers).toString() },
              ],
            },
          ].map(card => (
            <div key={card.title} style={{ backgroundColor: v("--a-bg"), border: `1px solid ${v("--a-border")}`, borderRadius: "12px", padding: "22px", boxShadow: v("--a-card-shadow") }}>
              <div style={{ fontSize: "12px", color: v("--a-text3"), fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "18px" }}>{card.title}</div>
              {card.rows.map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${v("--a-border")}` }}>
                  <span style={{ fontSize: "13px", color: v("--a-text2") }}>{r.label}</span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: v("--a-text") }}>{r.value}</span>
                </div>
              ))}
            </div>
          ))}
          <div style={{ backgroundColor: v("--a-bg"), border: `1px solid ${v("--a-border")}`, borderRadius: "12px", padding: "22px", boxShadow: v("--a-card-shadow") }}>
            <div style={{ fontSize: "12px", color: v("--a-text3"), fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "18px" }}>Recent Users</div>
            {users.slice(0, 7).map(u => (
              <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${v("--a-border")}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: v("--a-bg3"), border: `1px solid ${v("--a-border")}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: v("--a-text3"), flexShrink: 0 }}>
                    {(u.name || u.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: v("--a-text") }}>{u.name || u.email.split("@")[0]}</div>
                    <div style={{ fontSize: "11px", color: v("--a-text3") }}>{u.email}</div>
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: v("--a-text3") }}>{format(new Date(u.createdAt), "MMM d")}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users tab */}
      {tab === "users" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: v("--a-text3"), pointerEvents: "none" }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
                style={{ paddingLeft: "34px", paddingRight: "14px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px",
                  backgroundColor: v("--a-input-bg"), border: `1px solid ${v("--a-border")}`, borderRadius: "8px",
                  color: v("--a-text"), outline: "none", width: "240px", fontFamily: "inherit" }} />
            </div>
            <span style={{ fontSize: "12px", color: v("--a-text3") }}>{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}</span>
          </div>

          <div style={{ border: `1px solid ${v("--a-border")}`, borderRadius: "12px", overflow: "hidden", boxShadow: v("--a-card-shadow") }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr>
                    {["User", "Joined", "Trades", "Images", "Add Trades", "Analytics", "Export", "Blocked", "Limits", ""].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map(u => (
                    <tr key={u.id} style={{ backgroundColor: u.isBlocked ? v("--a-blocked-row") : "transparent", transition: "background 0.1s" }}
                      onMouseEnter={e => { if (!u.isBlocked) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = v("--a-row-hover"); }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = u.isBlocked ? v("--a-blocked-row") : "transparent"; }}>
                      <td style={td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: v("--a-bg3"),
                            border: `1px solid ${v("--a-border")}`, display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "12px", fontWeight: 700, color: v("--a-text3"), flexShrink: 0 }}>
                            {(u.name || u.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: v("--a-text"), display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                              {u.name || u.email.split("@")[0]}
                              {u.isAdmin && <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "3px", backgroundColor: "rgba(235,87,87,0.15)", color: "#ef4444", fontWeight: 700 }}>ADMIN</span>}
                              {u.isBlocked && <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "3px", backgroundColor: "rgba(249,115,22,0.15)", color: "#f97316", fontWeight: 700 }}>BLOCKED</span>}
                            </div>
                            <div style={{ fontSize: "11px", color: v("--a-text3"), marginTop: "1px" }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...td, color: v("--a-text3"), whiteSpace: "nowrap" }}>{format(new Date(u.createdAt), "MMM d, yyyy")}</td>
                      <td style={{ ...td, color: v("--a-text2"), fontWeight: 600 }}>{u.tradeCount}</td>
                      <td style={{ ...td, color: v("--a-text2"), fontWeight: 600 }}>{u.imageCount}</td>
                      <td style={td}><Toggle checked={u.canAddTrades} disabled={u.isAdmin || updating === u.id} onChange={() => patch(u.id, { canAddTrades: !u.canAddTrades })} /></td>
                      <td style={td}><Toggle checked={u.canViewAnalytics} disabled={u.isAdmin || updating === u.id} onChange={() => patch(u.id, { canViewAnalytics: !u.canViewAnalytics })} /></td>
                      <td style={td}><Toggle checked={u.canExport} disabled={u.isAdmin || updating === u.id} onChange={() => patch(u.id, { canExport: !u.canExport })} /></td>
                      <td style={td}><Toggle checked={u.isBlocked} disabled={u.isAdmin || updating === u.id} onChange={() => patch(u.id, { isBlocked: !u.isBlocked })} /></td>
                      <td style={td}>
                        {!u.isAdmin && (
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            {editingLimit?.id === u.id && editingLimit.field === "maxTrades" ? (
                              <input autoFocus type="number" min="0" value={editingLimit.value}
                                onChange={e => setEditingLimit({ ...editingLimit, value: e.target.value })}
                                onBlur={() => saveLimit(u.id, "maxTrades", editingLimit.value)}
                                onKeyDown={e => { if (e.key === "Enter") saveLimit(u.id, "maxTrades", editingLimit.value); if (e.key === "Escape") setEditingLimit(null); }}
                                style={{ width: "60px", padding: "3px 6px", fontSize: "12px", backgroundColor: v("--a-input-bg"), border: "1px solid #10b981", borderRadius: "5px", color: v("--a-text"), outline: "none" }} />
                            ) : (
                              <button onClick={() => !u.isAdmin && setEditingLimit({ id: u.id, field: "maxTrades", value: u.maxTrades?.toString() ?? "" })}
                                title="Set trade limit" style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "5px",
                                  border: `1px solid ${v("--a-border")}`, backgroundColor: v("--a-bg3"),
                                  color: u.maxTrades != null ? "#10b981" : v("--a-text3"), cursor: "pointer", whiteSpace: "nowrap" }}>
                                {u.maxTrades != null ? `≤${u.maxTrades}T` : "∞T"}
                              </button>
                            )}
                            {editingLimit?.id === u.id && editingLimit.field === "maxImages" ? (
                              <input autoFocus type="number" min="0" value={editingLimit.value}
                                onChange={e => setEditingLimit({ ...editingLimit, value: e.target.value })}
                                onBlur={() => saveLimit(u.id, "maxImages", editingLimit.value)}
                                onKeyDown={e => { if (e.key === "Enter") saveLimit(u.id, "maxImages", editingLimit.value); if (e.key === "Escape") setEditingLimit(null); }}
                                style={{ width: "60px", padding: "3px 6px", fontSize: "12px", backgroundColor: v("--a-input-bg"), border: "1px solid #10b981", borderRadius: "5px", color: v("--a-text"), outline: "none" }} />
                            ) : (
                              <button onClick={() => !u.isAdmin && setEditingLimit({ id: u.id, field: "maxImages", value: u.maxImages?.toString() ?? "" })}
                                title="Set image limit" style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "5px",
                                  border: `1px solid ${v("--a-border")}`, backgroundColor: v("--a-bg3"),
                                  color: u.maxImages != null ? "#10b981" : v("--a-text3"), cursor: "pointer", whiteSpace: "nowrap" }}>
                                {u.maxImages != null ? `≤${u.maxImages}I` : "∞I"}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={td}>
                        {!u.isAdmin && (
                          <button onClick={() => deleteUser(u.id, u.email)} disabled={updating === u.id}
                            style={{ fontSize: "12px", padding: "5px 12px", backgroundColor: "transparent", color: "#ef4444",
                              border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", cursor: "pointer",
                              opacity: updating === u.id ? 0.5 : 1, fontFamily: "inherit", transition: "background 0.15s" }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)")}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {pagedUsers.length === 0 && (
                    <tr><td colSpan={10} style={{ ...td, textAlign: "center", color: v("--a-text3"), padding: "40px" }}>No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px",
                borderTop: `1px solid ${v("--a-border")}`, backgroundColor: v("--a-th-bg") }}>
                <span style={{ fontSize: "12px", color: v("--a-text3") }}>
                  Page {page} of {totalPages} · {filteredUsers.length} users
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ padding: "5px 12px", fontSize: "12px", borderRadius: "6px", border: `1px solid ${v("--a-border")}`,
                      backgroundColor: v("--a-bg"), color: page === 1 ? v("--a-text3") : v("--a-text2"),
                      cursor: page === 1 ? "default" : "pointer", fontFamily: "inherit" }}>
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ padding: "5px 10px", fontSize: "12px", borderRadius: "6px", border: `1px solid ${v("--a-border")}`,
                        backgroundColor: p === page ? "#10b981" : v("--a-bg"),
                        color: p === page ? "#fff" : v("--a-text2"),
                        cursor: "pointer", fontFamily: "inherit", fontWeight: p === page ? 700 : 400 }}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ padding: "5px 12px", fontSize: "12px", borderRadius: "6px", border: `1px solid ${v("--a-border")}`,
                      backgroundColor: v("--a-bg"), color: page === totalPages ? v("--a-text3") : v("--a-text2"),
                      cursor: page === totalPages ? "default" : "pointer", fontFamily: "inherit" }}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
