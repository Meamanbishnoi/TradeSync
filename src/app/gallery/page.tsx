"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import GalleryLightbox from "@/components/GalleryLightbox";

interface GalleryImage {
  url: string;
  tradeId: string;
  instrument: string;
  direction: string;
  date: string;
  pnl: number;
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/gallery")
      .then(r => r.json())
      .then(data => { setImages(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--text-secondary)", fontSize: "14px" }}>
        Loading screenshots...
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "12px" }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)", opacity: 0.4 }}>
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px", margin: 0 }}>No screenshots yet.</p>
        <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0, opacity: 0.6 }}>Add screenshots when logging trades to see them here.</p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "16px", paddingBottom: "80px" }}>
      {/* Count */}
      <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
        {images.length} screenshot{images.length !== 1 ? "s" : ""}
      </div>

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "12px",
      }}>
        {images.map((img, i) => {
          const isWin = img.pnl >= 0;
          const isHovered = hoveredIndex === i;
          return (
            <div
              key={i}
              onClick={() => setLightboxIndex(i)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                position: "relative",
                aspectRatio: "16/10",
                borderRadius: "10px",
                overflow: "hidden",
                cursor: "pointer",
                border: "1px solid var(--border-color)",
                backgroundColor: "#111",
                transform: isHovered ? "scale(1.02)" : "scale(1)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                boxShadow: isHovered ? "0 8px 24px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {/* Image */}
              <img
                src={img.url}
                alt={`${img.instrument} screenshot`}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                loading="lazy"
              />

              {/* Overlay on hover */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 50%)",
                opacity: isHovered ? 1 : 0.6,
                transition: "opacity 0.2s ease",
              }} />

              {/* Bottom info */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "10px 12px",
                display: "flex", justifyContent: "space-between", alignItems: "flex-end",
              }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{img.instrument}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
                    {format(new Date(img.date), "MMM d, yyyy")}
                  </div>
                </div>
                <div style={{
                  fontSize: "13px", fontWeight: 700,
                  color: isWin ? "#10b981" : "#ef4444",
                  backgroundColor: isWin ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                  padding: "2px 8px", borderRadius: "6px",
                }}>
                  {isWin ? "+" : ""}${Math.abs(img.pnl).toFixed(0)}
                </div>
              </div>

              {/* Direction badge */}
              <div style={{
                position: "absolute", top: "8px", left: "8px",
                fontSize: "10px", fontWeight: 600,
                color: "rgba(255,255,255,0.8)",
                backgroundColor: "rgba(0,0,0,0.45)",
                padding: "2px 7px", borderRadius: "4px",
                backdropFilter: "blur(4px)",
              }}>
                {img.direction.toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <GalleryLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
