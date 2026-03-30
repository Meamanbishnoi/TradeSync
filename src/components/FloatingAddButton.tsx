"use client";

import Link from "next/link";

export default function FloatingAddButton() {
  return (
    <Link
      href="/trade/new"
      title="New Trade"
      style={{
        position: "fixed",
        bottom: "28px",
        right: "28px",
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        backgroundColor: "var(--text-primary)",
        color: "var(--bg-color)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "26px",
        fontWeight: 300,
        lineHeight: 1,
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        zIndex: 50,
        textDecoration: "none",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.1)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.28)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)";
      }}
    >
      +
    </Link>
  );
}
