"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const mainNav = [
  {
    name: "Home", href: "/",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
  },
  {
    name: "Trades", href: "/trades",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  },
  {
    name: "Analytics", href: "/analytics",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
  {
    name: "Heatmap", href: "/heatmap",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
];

const moreItems = [
  {
    name: "Journal", href: "/journal",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  },
  {
    name: "Reports", href: "/reports",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  },
  {
    name: "Gallery", href: "/gallery",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  },
  {
    name: "New Trade", href: "/trade/new",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  },
];

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 98, backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More menu popup */}
      {showMore && (
        <div style={{
          position: "fixed", bottom: "68px", right: "16px",
          backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)",
          borderRadius: "12px", padding: "8px", zIndex: 99,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          display: "flex", flexDirection: "column", gap: "4px", minWidth: "160px",
        }}>
          {moreItems.map(item => (
            <button key={item.href} onClick={() => { setShowMore(false); router.push(item.href); }}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "10px 14px", borderRadius: "8px", border: "none",
                background: pathname === item.href ? "var(--bg-hover)" : "none",
                cursor: "pointer", color: "var(--text-primary)", fontSize: "14px", fontWeight: 500,
                textAlign: "left", width: "100%",
              }}>
              <span style={{ color: "var(--text-secondary)" }}>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </div>
      )}

      {/* Bottom nav bar */}
      <div
        className="mobile-bottom-nav"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, height: "60px",
          backgroundColor: "var(--bg-color)", borderTop: "1px solid var(--border-color)",
          zIndex: 100, alignItems: "center", justifyContent: "space-around",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {mainNav.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
                padding: "6px 12px", color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                textDecoration: "none",
              }}>
              {item.icon}
              <span style={{ fontSize: "10px", fontWeight: isActive ? 600 : 400 }}>{item.name}</span>
            </Link>
          );
        })}

        {/* More button */}
        <button onClick={() => setShowMore(p => !p)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
            padding: "6px 12px", background: "none", border: "none", cursor: "pointer",
            color: showMore ? "var(--text-primary)" : "var(--text-secondary)",
          }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
          </svg>
          <span style={{ fontSize: "10px", fontWeight: 400 }}>More</span>
        </button>
      </div>
    </>
  );
}
