"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import GalleryLightbox from "@/components/GalleryLightbox";
import JSZip from "jszip";

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

  // Filters
  const [filterInstrument, setFilterInstrument] = useState("");
  const [filterDirection, setFilterDirection] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Multi-select
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectMode, setSelectMode] = useState(false);

  const buildParams = useCallback((p: number, pp: number) => {
    const params = new URLSearchParams({ page: String(p), perPage: String(pp) });
    if (filterInstrument) params.set("instrument", filterInstrument);
    if (filterDirection) params.set("direction", filterDirection);
    if (filterDateFrom) params.set("dateFrom", filterDateFrom);
    if (filterDateTo) params.set("dateTo", filterDateTo);
    return params.toString();
  }, [filterInstrument, filterDirection, filterDateFrom, filterDateTo]);

  const fetchImages = useCallback(async (p: number, pp: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/gallery?${buildParams(p, pp)}`);
      const data = await res.json();
      setImages(data.images ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {}
    finally { setIsLoading(false); }
  }, [buildParams]);

  useEffect(() => { fetchImages(page, perPage); }, [page, perPage, fetchImages]);

  const applyFilters = () => { setPage(1); fetchImages(1, perPage); };
  const clearFilters = () => {
    setFilterInstrument(""); setFilterDirection(""); setFilterDateFrom(""); setFilterDateTo("");
    setPage(1);
  };

  const handlePerPageChange = (pp: number) => {
    localStorage.setItem(STORAGE_KEY, pp.toString());
    setPerPage(pp); setPage(1);
  };

  const toggleSelect = (url: string) => {
    setSelectedUrls(prev => {
      const next = new Set(prev);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });
  };

  const selectAll = () => setSelectedUrls(new Set(images.map(i => i.url)));
  const clearSelection = () => { setSelectedUrls(new Set()); setSelectMode(false); };

  const downloadSelected = async () => {
    if (selectedUrls.size === 0) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("tradesync-screenshots")!;
      let idx = 1;
      for (const url of selectedUrls) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const buf = await res.arrayBuffer();
          const ext = url.split(".").pop()?.split("?")[0] ?? "png";
          folder.file(`screenshot-${idx++}.${ext}`, buf);
        } catch {}
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `tradesync-screenshots-${format(new Date(), "yyyy-MM-dd")}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally { setIsDownloading(false); }
  };

  const hasFilters = filterInstrument || filterDirection || filterDateFrom || filterDateTo;

  if (isLoading && images.length === 0 && !hasFilters) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--text-secondary)", fontSize: "14px" }}>
        Loading screenshots...
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "16px", paddingBottom: "80px" }}>

      {/* Filter bar */}
      <div style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "14px 16px", marginBottom: "16px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 90px", minWidth: "80px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>Instrument</label>
            <input type="text" value={filterInstrument} onChange={e => setFilterInstrument(e.target.value)}
              className="notion-input" placeholder="e.g. NQ" style={{ padding: "6px 10px", fontSize: "13px" }} />
          </div>
          <div style={{ flex: "1 1 90px", minWidth: "80px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>Direction</label>
            <select value={filterDirection} onChange={e => setFilterDirection(e.target.value)}
              className="notion-input" style={{ padding: "6px 10px", fontSize: "13px" }}>
              <option value="">All</option>
              <option value="Long">Long</option>
              <option value="Short">Short</option>
            </select>
          </div>
          <div style={{ flex: "1 1 120px", minWidth: "110px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>From</label>
            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
              className="notion-input" style={{ padding: "6px 10px", fontSize: "13px" }} />
          </div>
          <div style={{ flex: "1 1 120px", minWidth: "110px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>To</label>
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
              className="notion-input" style={{ padding: "6px 10px", fontSize: "13px" }} />
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <button onClick={applyFilters} className="notion-button notion-button-primary" style={{ padding: "7px 16px", fontSize: "13px" }}>
              Filter
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="notion-button" style={{ padding: "7px 12px", fontSize: "13px" }}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            {total} screenshot{total !== 1 ? "s" : ""}
            {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
          </span>
          {/* Select mode toggle */}
          <button onClick={() => { setSelectMode(s => !s); if (selectMode) clearSelection(); }}
            className="notion-button" style={{ padding: "4px 12px", fontSize: "12px", backgroundColor: selectMode ? "var(--bg-hover)" : undefined }}>
            {selectMode ? "Cancel" : "Select"}
          </button>
          {selectMode && images.length > 0 && (
            <button onClick={selectAll} className="notion-button" style={{ padding: "4px 12px", fontSize: "12px" }}>
              Select All
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {selectMode && selectedUrls.size > 0 && (
            <button onClick={downloadSelected} disabled={isDownloading} className="notion-button notion-button-primary"
              style={{ padding: "6px 14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", opacity: isDownloading ? 0.7 : 1 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {isDownloading ? "Zipping..." : `Download ${selectedUrls.size}`}
            </button>
          )}
          <label style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Per page</label>
          <select value={perPage} onChange={e => handlePerPageChange(parseInt(e.target.value))}
            className="notion-input" style={{ width: "auto", padding: "5px 10px", fontSize: "13px" }}>
            {PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Empty state */}
      {!isLoading && total === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "40vh", gap: "12px" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)", opacity: 0.4 }}>
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px", margin: 0 }}>{hasFilters ? "No screenshots match your filters." : "No screenshots yet."}</p>
        </div>
      )}

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px", opacity: isLoading ? 0.6 : 1, transition: "opacity 0.2s" }}>
        {images.map((img, i) => {
          const isWin = img.pnl >= 0;
          const isHovered = hoveredIndex === i;
          const isSelected = selectedUrls.has(img.url);
          return (
            <div
              key={`${img.url}-${i}`}
              onClick={() => selectMode ? toggleSelect(img.url) : setLightboxIndex(i)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                position: "relative", aspectRatio: "16/10", borderRadius: "10px",
                overflow: "hidden", cursor: "pointer",
                border: isSelected ? "2px solid var(--accent-color)" : "1px solid var(--border-color)",
                backgroundColor: "#111",
                transform: isHovered ? "scale(1.02)" : "scale(1)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                boxShadow: isHovered ? "0 8px 24px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <img src={img.url} alt={`${img.instrument} screenshot`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 50%)", opacity: isHovered || isSelected ? 1 : 0.6, transition: "opacity 0.2s ease" }} />

              {/* Select checkbox */}
              {(selectMode || isSelected) && (
                <div style={{ position: "absolute", top: "8px", right: "8px", width: "20px", height: "20px", borderRadius: "50%", backgroundColor: isSelected ? "var(--accent-color)" : "rgba(0,0,0,0.5)", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isSelected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
              )}

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

      {lightboxIndex !== null && (
        <GalleryLightbox images={images} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  );
}
