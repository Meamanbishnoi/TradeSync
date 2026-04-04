import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import AdminLogout from "@/components/AdminLogout";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin;

  if (!session) redirect("/login");
  if (!isAdmin) redirect("/");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f0f0f", color: "#e5e5e5", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Admin top bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 24px", height: "56px",
        backgroundColor: "#161616", borderBottom: "1px solid #2a2a2a",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "6px", backgroundColor: "#eb5757", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.02em" }}>
            TradeSync <span style={{ color: "#eb5757", fontSize: "11px", fontWeight: 600, padding: "1px 6px", borderRadius: "4px", backgroundColor: "rgba(235,87,87,0.15)", marginLeft: "4px" }}>ADMIN</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "13px", color: "#888" }}>{session.user?.email}</span>
          <Link href="/" style={{ fontSize: "13px", color: "#888", textDecoration: "none", padding: "5px 12px", borderRadius: "6px", border: "1px solid #2a2a2a" }}>
            ← App
          </Link>
          <AdminLogout />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "28px 24px", maxWidth: "1400px", margin: "0 auto" }}>
        {children}
      </div>
    </div>
  );
}
