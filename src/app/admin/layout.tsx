import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminLogout from "@/components/AdminLogout";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin;

  if (!session) redirect("/login");
  if (!isAdmin) redirect("/");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", color: "#e5e5e5",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex", flexDirection: "column" }}>
      {/* Admin header */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 28px", height: "54px",
        backgroundColor: "#0f0f0f", borderBottom: "1px solid #1e1e1e",
        position: "sticky", top: 0, zIndex: 100, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "26px", height: "26px", borderRadius: "6px", backgroundColor: "#ef4444",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: "14px", letterSpacing: "-0.02em", color: "#fff" }}>
            TradeSync
          </span>
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px",
            backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444", letterSpacing: "0.05em" }}>
            ADMIN
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "12px", color: "#444" }}>{session.user?.email}</span>
          <Link href="/" style={{ fontSize: "12px", color: "#555", textDecoration: "none",
            padding: "5px 12px", borderRadius: "6px", border: "1px solid #1e1e1e",
            transition: "border-color 0.15s", display: "flex", alignItems: "center", gap: "5px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            App
          </Link>
          <AdminLogout />
        </div>
      </header>

      {/* Full-width content */}
      <main style={{ flex: 1, padding: "28px 32px", maxWidth: "1600px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {children}
      </main>
    </div>
  );
}
