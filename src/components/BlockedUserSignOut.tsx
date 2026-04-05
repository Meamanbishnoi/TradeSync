"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

// Checks DB once per browser session to detect if user was blocked after login.
// Uses sessionStorage to avoid hitting the API on every page navigation.
export default function BlockedUserSignOut() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    const cacheKey = `perm_checked_${session.user.id}`;
    // Only check once per browser session
    if (sessionStorage.getItem(cacheKey)) return;

    const check = async () => {
      try {
        const res = await fetch("/api/auth/check");
        if (!res.ok) return;
        const data = await res.json();
        if (data.isBlocked) {
          signOut({ callbackUrl: "/login?error=blocked" });
          return;
        }
        // Mark as checked so we don't re-check on every page
        sessionStorage.setItem(cacheKey, "1");
      } catch {}
    };

    check();
  }, [status, session?.user?.id]);

  return null;
}
