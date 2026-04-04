"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";

interface GalleryImage {
  url: string;
  tradeId: string;
  instrument: string;
  direction: string;
  date: string;
  pnl: number;
}

interface Props {
  images: GalleryImage[];
  initialIndex: number;
  onClose: () => void;
}

export default function GalleryLightbox({ images, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const lastTouchDist = useRef<number | null>(null);
  const lastTouchPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const img = images[index];
  const isWin = img.pnl >= 0;

  // Reset zoom on image change
  useEffect(() => { setScale(1); setOffset({ x: 0, y: 0 }); }, [index]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index]);

  const goNext = () => { if (index < images.length - 1) setIndex(i => i + 1); };
  const goPrev = () => { if (index > 0) setIndex(i => i - 1); };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(img.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = img.url.split(".").pop()?.split("?")[0] || "png";
      a.download = `${img.instrument}-${format(new Date(img.date), "yyyy-MM-dd")}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { window.open(img.url, "_blank"); }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.min(Math.max(s - e.deltaY * 0.001, 1), 6));
  };

  // Mouse drag (when zoomed)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setOffset({ x: dragStart.current.ox + e.clientX - dragStart.current.x, y: dragStart.current.oy + e.clientY - dragStart.current.y });
  };
  const handleMouseUp = () => { isDragging.current = false; };

  // Touch pinch zoom + pan
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
      setScale(s => Math.min(Math.max(s * (dist / lastTouchDist.current!), 1), 6));
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
    else onClose();
  };

  const NavBtn = ({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) => (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      disabled={disabled}
      style={{
        width: "44px", height: "44px", borderRadius: "50%",
        backgroundColor: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)",
        color: "#fff", cursor: disabled ? "default" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: disabled ? 0.25 : 1, transition: "opacity 0.15s, background 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(0,0,0,0.75)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(0,0,0,0.5)"; }}
    >
      {children}
    </button>
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.92)", zIndex: 9999, display: "flex", flexDirection: "column", touchAction: "none" }}
      onClick={handleOverlayClick}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)", flexShrink: 0 }}
      >
        {/* Trade info */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#fff" }}>{img.instrument}</span>
          <span style={{ fontSize: "13px", padding: "2px 8px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>{img.direction}</span>
          <span style={{ fontSize: "14px", fontWeight: 700, color: isWin ? "#10b981" : "#ef4444" }}>
            {isWin ? "+" : ""}${Math.abs(img.pnl).toFixed(2)}
          </span>
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{format(new Date(img.date), "MMM d, yyyy")}</span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{index + 1} / {images.length}</span>
          <Link
            href={`/trade/${img.tradeId}`}
            onClick={e => e.stopPropagation()}
            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "6px", backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "13px", textDecoration: "none", transition: "background 0.15s" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            View Trade
          </Link>
          <button
            onClick={handleDownload}
            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "6px", backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "13px", cursor: "pointer", transition: "background 0.15s" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download
          </button>
          <button
            onClick={e => { e.stopPropagation(); onClose(); }}
            style={{ width: "32px", height: "32px", borderRadius: "6px", backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Image area with nav arrows */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", padding: "0 16px", minHeight: 0 }} onClick={e => e.stopPropagation()}>
        <NavBtn onClick={goPrev} disabled={index === 0}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </NavBtn>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", maxHeight: "100%" }}>
          <img
            src={img.url}
            alt={`${img.instrument} trade screenshot`}
            onMouseDown={handleMouseDown}
            style={{
              maxWidth: "100%", maxHeight: "calc(100vh - 160px)",
              objectFit: "contain", borderRadius: "6px",
              transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
              transition: scale === 1 ? "transform 0.2s ease" : "none",
              cursor: scale > 1 ? "grab" : "zoom-in",
              userSelect: "none", pointerEvents: "auto",
            }}
            onClick={e => { e.stopPropagation(); if (scale === 1) setScale(2); else { setScale(1); setOffset({ x: 0, y: 0 }); } }}
            draggable={false}
          />
        </div>

        <NavBtn onClick={goNext} disabled={index === images.length - 1}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </NavBtn>
      </div>

      {/* Bottom: zoom hint + thumbnail strip */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ padding: "10px 16px 16px", background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)", flexShrink: 0 }}
      >
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", textAlign: "center", marginBottom: "10px" }}>
          {scale > 1 ? `${Math.round(scale * 100)}% — click to reset · scroll to zoom` : "Click image to zoom · scroll to zoom · ← → to navigate"}
        </div>
        {/* Thumbnail strip */}
        <div style={{ display: "flex", gap: "6px", justifyContent: "center", overflowX: "auto", paddingBottom: "2px" }}>
          {images.map((im, i) => (
            <div
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: "48px", height: "36px", flexShrink: 0, borderRadius: "4px", overflow: "hidden",
                border: i === index ? "2px solid #fff" : "2px solid transparent",
                opacity: i === index ? 1 : 0.5,
                cursor: "pointer", transition: "opacity 0.15s, border-color 0.15s",
              }}
            >
              <img src={im.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
