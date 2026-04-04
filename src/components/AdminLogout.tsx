"use client";
import { signOut } from "next-auth/react";

export default function AdminLogout() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{ fontSize: "13px", color: "#eb5757", background: "none", border: "1px solid rgba(235,87,87,0.3)", borderRadius: "6px", padding: "5px 12px", cursor: "pointer" }}
    >
      Logout
    </button>
  );
}
