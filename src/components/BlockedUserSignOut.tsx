"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function BlockedUserSignOut() {
  useEffect(() => {
    signOut({ callbackUrl: "/login?error=blocked" });
  }, []);
  return null;
}
