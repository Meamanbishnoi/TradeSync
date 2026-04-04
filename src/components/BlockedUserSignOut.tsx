"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

// Checks DB directly on every mount — catches blocked status even with stale JWT
export default function BlockedUserSignOut() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    const check = async () => {
      try {
        const res = await fetch("/api/auth/check");
        if (!res.ok) return;
        const data = await res.json();
        if (data.isBlocked) {
          signOut({ callbackUrl: "/login?error=blocked" });
        }
      } catch {}
    };

    check();
  }, [status, session]);

  return null;
}
