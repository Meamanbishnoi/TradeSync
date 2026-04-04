"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Avatar from "@/components/Avatar";

interface ProfileDropdownProps {
  displayName: string | null;
  avatarId?: string | null;
  isAdmin?: boolean;
}

export default function ProfileDropdown({ displayName, avatarId: initialAvatarId, isAdmin }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [avatarId, setAvatarId] = useState(initialAvatarId ?? null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync when prop changes (e.g. after updateSession)
  useEffect(() => {
    if (initialAvatarId !== undefined) {
      setAvatarId(initialAvatarId ?? null);
    }
  }, [initialAvatarId]);

  // Fallback: if prop is null (old JWT), fetch once from API
  useEffect(() => {
    if (initialAvatarId === null || initialAvatarId === undefined) {
      fetch("/api/profile/avatar-id")
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.avatarId) setAvatarId(d.avatarId); })
        .catch(() => {});
    }
  }, [initialAvatarId]);

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
        {/* Avatar */}
        <Avatar avatarId={avatarId} name={displayName} size={26} />
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
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              style={{ padding: "8px 12px", borderRadius: "4px", color: "#eb5757", textDecoration: "none", fontSize: "14px", transition: "background-color 0.2s", display: "flex", alignItems: "center", gap: "6px" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Admin Panel
            </Link>
          )}
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
