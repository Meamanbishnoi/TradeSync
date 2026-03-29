"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface ProfileDropdownProps {
  displayName: string | null;
}

export default function ProfileDropdown({ displayName }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "4px 8px 4px 4px",
          borderRadius: "20px",
          border: "1px solid var(--border-color)",
          background: isOpen ? "var(--bg-hover)" : "transparent",
          cursor: "pointer",
          fontSize: "14px",
          color: "var(--text-primary)",
          fontWeight: 500,
          transition: "background-color 0.15s ease",
        }}
        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = "var(--bg-hover)"; }}
        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = "transparent"; }}
      >
        {/* Avatar circle with initials */}
        <div style={{
          width: "26px", height: "26px", borderRadius: "50%",
          backgroundColor: "var(--text-primary)", color: "var(--bg-color)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "11px", fontWeight: 700, flexShrink: 0, letterSpacing: "0.02em",
        }}>
          {(displayName ?? "U").slice(0, 2).toUpperCase()}
        </div>
        <span style={{ fontSize: "13px", maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayName || "User"}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          marginTop: "8px",
          width: "200px",
          backgroundColor: "var(--bg-color)",
          borderRadius: "8px",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-sm)",
          padding: "8px",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          gap: "4px"
        }}>
          <Link 
            href="/profile" 
            onClick={() => setIsOpen(false)}
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              color: "var(--text-primary)",
              textDecoration: "none",
              fontSize: "16px",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            Profile Settings
          </Link>
          <div style={{ height: "1px", backgroundColor: "var(--border-color)", margin: "4px 0" }}></div>
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
              textAlign: "left",
              padding: "8px 12px",
              borderRadius: "4px",
              color: "#eb5757", // Red for logout
              background: "none",
              border: "none",
              fontSize: "16px",
              cursor: "pointer",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
