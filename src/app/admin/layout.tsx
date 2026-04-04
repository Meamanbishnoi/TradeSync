import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
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
