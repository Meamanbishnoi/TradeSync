"use client";

import { useState, useEffect } from "react";
import AdminLogout from "@/components/AdminLogout";

const THEMES = {
  dark: {
    "--a-bg":        "#1c1c1e",
    "--a-bg2":       "#242426",
    "--a-bg3":       "#2c2c2e",
    "--a-border":    "#3a3a3c",
    "--a-border2":   "#48484a",
    "--a-text":      "#f2f2f7",
    "--a-text2":     "#aeaeb2",
    "--a-text3":     "#636366",
    "--a-header-bg": "#18181a",
    "--a-th-bg":     "#161618",
    "--a-row-hover": "rgba(255,255,255,0.03)",
    "--a-blocked-row": "rgba(239,68,68,0.05)",
    "--a-input-bg":  "#2c2c2e",
    "--a-toggle-off":"#48484a",
    "--a-card-shadow":"0 1px 3px rgba(0,0,0,0.4)",
    "--a-page-bg":   "#1c1c1e",
  },
  light: {
    "--a-bg":        "#ffffff",
    "--a-bg2":       "#f5f5f7",
    "--a-bg3":       "#ebebed",
    "--a-border":    "#d1d1d6",
    "--a-border2":   "#c7c7cc",
    "--a-text":      "#1c1c1e",
    "--a-text2":     "#3a3a3c",
    "--a-text3":     "#8e8e93",
    "--a-header-bg": "#ffffff",
    "--a-th-bg":     "#f5f5f7",
    "--a-row-hover": "rgba(0,0,0,0.02)",
    "--a-blocked-row": "rgba(239,68,68,0.06)",
    "--a-input-bg":  "#f5f5f7",
    "--a-toggle-off":"#c7c7cc",
    "--a-card-shadow":"0 1px 3px rgba(0,0,0,0.08)",
    "--a-page-bg":   "#f5f5f7",
  },
} as const;

type Theme = keyof typeof THEMES;

export default function AdminThemeWrapper({ children, email }: { children: React.ReactNode; email: string }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("admin-theme") as Theme | null;
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("admin-theme", next);
  };

  const vars = THEMES[theme];
  const cssVars = Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--a-page-bg)", color: "var(--a-text)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex", flexDirection: "column" } as React.CSSProperties}
      // inject CSS vars onto this root element
      ref={el => { if (el) el.setAttribute("style", `min-height:100vh;background-color:var(--a-page-bg);color:var(--a-text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;flex-direction:column;${cssVars}`); }}>

      {/* Admin header */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 28px", height: "54px",
        backgroundColor: "var(--a-header-bg)" as string,
        borderBottom: "1px solid var(--a-border)" as string,
        position: "sticky", top: 0, zIndex: 100, flexShrink: 0,
        boxShadow: "var(--a-card-shadow)" as string,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "26px", height: "26px", borderRadius: "6px", backgroundColor: "#ef4444",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: "14px", letterSpacing: "-0.02em", color: "var(--a-text)" as string }}>
            TradeSync
          </span>
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px",
            backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444", letterSpacing: "0.05em" }}>
            ADMIN
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "12px", color: "var(--a-text3)" as string }}>{email}</span>

          {/* Theme toggle */}
          <button onClick={toggle} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid var(--a-border)",
              backgroundColor: "var(--a-bg3)", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", color: "var(--a-text2)", transition: "background 0.15s" } as React.CSSProperties}>
            {theme === "dark" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          <AdminLogout />
        </div>
      </header>

      {/* Full-width content */}
      <main style={{ flex: 1, padding: "28px 32px", maxWidth: "1600px", width: "100%", margin: "0 auto", boxSizing: "border-box" } as React.CSSProperties}>
        {children}
      </main>
    </div>
  );
}
