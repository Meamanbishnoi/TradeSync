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
          padding: "6px 12px",
          borderRadius: "6px",
          border: "none",
          background: isOpen ? "var(--bg-hover)" : "transparent",
          cursor: "pointer",
          fontSize: "16px",
          color: "var(--text-primary)",
          fontWeight: 500,
          transition: "background-color 0.2s ease"
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.background = "var(--bg-hover)";
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.background = "transparent";
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)" }}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        {displayName || "User"}
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
