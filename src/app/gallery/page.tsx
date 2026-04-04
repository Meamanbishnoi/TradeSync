"use client";

import { useState, useEffect, useCallback } from "react";
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

const PER_PAGE_OPTIONS = [12, 24, 48, 96];
const STORAGE_KEY = "gallery_per_page";

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = parseInt(localStorage.getItem(STORAGE_KEY) ?? "");
      if (PER_PAGE_OPTIONS.includes(saved)) return saved;
    }
    return 24;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const fetchImages = useCallback(async (p: number, pp: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/gallery?page=${p}&perPage=${pp}`);
      const data = await res.json();
      setImages(data.images ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchImages(page, perPage); }, [page, perPage, fetchImages]);

  const handlePerPageChange = (pp: number) => {
    localStorage.setItem(STORAGE_KEY, pp.toString());
    setPerPage(pp);
    setPage(1);
  };

  if (isLoading && images.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--text-secondary)", fontSize: "14px" }}>
        Loading screenshots...
      </div>
    );
  }

  if (!isLoading && total === 0) {
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
      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          {total} screenshot{total !== 1 ? "s" : ""}
          {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Per page</label>
          <select
            value={perPage}
            onChange={e => handlePerPageChange(parseInt(e.target.value))}
            className="notion-input"
            style={{ width: "auto", padding: "5px 10px", fontSize: "13px" }}
          >
            {PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px", opacity: isLoading ? 0.6 : 1, transition: "opacity 0.2s" }}>
        {images.map((img, i) => {
          const isWin = img.pnl >= 0;
          const isHovered = hoveredIndex === i;
          return (
            <div
              key={`${img.url}-${i}`}
              onClick={() => setLightboxIndex(i)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                position: "relative", aspectRatio: "16/10", borderRadius: "10px",
                overflow: "hidden", cursor: "pointer", border: "1px solid var(--border-color)",
                backgroundColor: "#111",
                transform: isHovered ? "scale(1.02)" : "scale(1)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                boxShadow: isHovered ? "0 8px 24px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <img src={img.url} alt={`${img.instrument} screenshot`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 50%)", opacity: isHovered ? 1 : 0.6, transition: "opacity 0.2s ease" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{img.instrument}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>{format(new Date(img.date), "MMM d, yyyy")}</div>
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: isWin ? "#10b981" : "#ef4444", backgroundColor: isWin ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", padding: "2px 8px", borderRadius: "6px" }}>
                  {isWin ? "+" : ""}${Math.abs(img.pnl).toFixed(0)}
                </div>
              </div>
              <div style={{ position: "absolute", top: "8px", left: "8px", fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.8)", backgroundColor: "rgba(0,0,0,0.45)", padding: "2px 7px", borderRadius: "4px", backdropFilter: "blur(4px)" }}>
                {img.direction.toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "28px" }}>
          <button onClick={() => setPage(1)} disabled={page === 1} className="notion-button" style={{ padding: "6px 10px", opacity: page === 1 ? 0.4 : 1 }}>«</button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="notion-button" style={{ padding: "6px 12px", opacity: page === 1 ? 0.4 : 1 }}>‹ Prev</button>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)", padding: "0 8px" }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="notion-button" style={{ padding: "6px 12px", opacity: page === totalPages ? 0.4 : 1 }}>Next ›</button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="notion-button" style={{ padding: "6px 10px", opacity: page === totalPages ? 0.4 : 1 }}>»</button>
        </div>
      )}

      {/* Lightbox — passes current page's images, index relative to page */}
      {lightboxIndex !== null && (
        <GalleryLightbox images={images} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  );
}
