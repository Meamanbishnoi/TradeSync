"use client";

import { useState, useRef, useEffect } from "react";

interface ExpandableImageProps {
  src: string;
  alt: string;
}

export default function ExpandableImage({ src, alt }: ExpandableImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const lastTouchDist = useRef<number | null>(null);
  const lastTouchPos = useRef<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset zoom when closing
  useEffect(() => {
    if (!isOpen) { setScale(1); setOffset({ x: 0, y: 0 }); }
  }, [isOpen]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = src.split(".").pop()?.split("?")[0] || "png";
      a.download = `trade-screenshot.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, "_blank");
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
    } else if (e.touches.length === 1) {
      lastTouchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delta = dist / lastTouchDist.current;
      setScale(s => Math.min(Math.max(s * delta, 1), 5));
      lastTouchDist.current = dist;
    } else if (e.touches.length === 1 && lastTouchPos.current && scale > 1) {
      const dx = e.touches[0].clientX - lastTouchPos.current.x;
      const dy = e.touches[0].clientY - lastTouchPos.current.y;
      setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
      lastTouchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = () => {
    lastTouchDist.current = null;
    lastTouchPos.current = null;
    if (scale <= 1) setOffset({ x: 0, y: 0 });
  };

  const handleOverlayClick = () => {
    if (scale > 1) { setScale(1); setOffset({ x: 0, y: 0 }); }
    else setIsOpen(false);
  };

  return (
    <>
      <div
        style={{
          position: "relative", width: "100%", aspectRatio: "16/9",
          overflow: "hidden", cursor: "zoom-in", display: "flex",
          alignItems: "center", justifyContent: "center", backgroundColor: "#1e1e1e",
        }}
        onClick={() => setIsOpen(true)}
        title="Click to enlarge"
      >
        <img
          src={src} alt={alt}
          style={{ objectFit: "contain", width: "100%", height: "100%", transition: "transform 0.2s ease" }}
          onMouseOver={e => e.currentTarget.style.transform = "scale(1.02)"}
          onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
        />
      </div>

      {isOpen && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
            backgroundColor: "rgba(0,0,0,0.9)", zIndex: 9999,
            display: "flex", justifyContent: "center", alignItems: "center",
            touchAction: "none",
          }}
          onClick={handleOverlayClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 16px", zIndex: 10000,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
          }}>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
              {scale > 1 ? `${Math.round(scale * 100)}% — tap to reset` : "Pinch to zoom"}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleDownload}
                style={{
                  background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "6px", color: "#fff", padding: "6px 12px", cursor: "pointer",
                  fontSize: "13px", display: "flex", alignItems: "center", gap: "6px",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download
              </button>
              <button
                onClick={e => { e.stopPropagation(); setIsOpen(false); }}
                style={{
                  background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "6px", color: "#fff", padding: "6px 12px", cursor: "pointer", fontSize: "13px",
                }}
              >
                ✕ Close
              </button>
            </div>
          </div>

          <img
            ref={imgRef}
            src={src} alt={alt}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: "95vw", maxHeight: "90vh", objectFit: "contain",
              borderRadius: "4px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
              transition: scale === 1 ? "transform 0.2s ease" : "none",
              cursor: scale > 1 ? "grab" : "default",
              userSelect: "none",
            }}
          />
        </div>
      )}
    </>
  );
}
