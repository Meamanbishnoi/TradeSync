"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="notion-button"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      style={{ padding: "6px 10px", fontSize: "16px", lineHeight: 1 }}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
