"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

  // Touch state refs — avoid re-renders during gesture
  const touchState = useRef({
    startDist: 0,
    startScale: 1,
    startX: 0,
    startY: 0,
    startOffX: 0,
    startOffY: 0,
    swipeStartX: 0,
    swipeStartY: 0,
    isSwipe: false,
    isPinch: false,
  });

  const img = images[index];
  const isWin = img.pnl >= 0;

  const resetZoom = useCallback(() => { setScale(1); setOffset({ x: 0, y: 0 }); }, []);

  useEffect(() => { resetZoom(); }, [index, resetZoom]);

  // Keyboard nav
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex(i => Math.min(i + 1, images.length - 1));
      else if (e.key === "ArrowLeft") setIndex(i => Math.max(i - 1, 0));
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [images.length, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

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

  // ── Touch handlers on the image container ──────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    const ts = touchState.current;
    if (e.touches.length === 2) {
      ts.isPinch = true;
      ts.isSwipe = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      ts.startDist = Math.sqrt(dx * dx + dy * dy);
      ts.startScale = scale;
      ts.startOffX = offset.x;
      ts.startOffY = offset.y;
      ts.startX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      ts.startY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    } else if (e.touches.length === 1) {
      ts.isPinch = false;
      ts.swipeStartX = e.touches[0].clientX;
      ts.swipeStartY = e.touches[0].clientY;
      ts.startOffX = offset.x;
      ts.startOffY = offset.y;
      ts.isSwipe = scale <= 1; // only swipe when not zoomed
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // prevent page scroll inside lightbox
    const ts = touchState.current;
    if (e.touches.length === 2 && ts.isPinch) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newScale = Math.min(Math.max(ts.startScale * (dist / ts.startDist), 1), 6);
      setScale(newScale);
    } else if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - ts.swipeStartX;
      const dy = e.touches[0].clientY - ts.swipeStartY;
      if (ts.isSwipe) {
        // horizontal swipe — handled on end
      } else if (scale > 1) {
        // pan when zoomed
        setOffset({ x: ts.startOffX + dx, y: ts.startOffY + dy });
      }
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const ts = touchState.current;
    if (ts.isSwipe && e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - ts.swipeStartX;
      const dy = e.changedTouches[0].clientY - ts.swipeStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) setIndex(i => Math.min(i + 1, images.length - 1));
        else setIndex(i => Math.max(i - 1, 0));
      }
    }
    ts.isPinch = false;
    ts.isSwipe = false;
    if (scale <= 1) setOffset({ x: 0, y: 0 });
  };

  // Mouse wheel zoom (desktop)
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.min(Math.max(s - e.deltaY * 0.001, 1), 6));
  };

  // Mouse drag (desktop, when zoomed)
  const dragRef = useRef({ active: false, sx: 0, sy: 0, ox: 0, oy: 0 });
  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    dragRef.current = { active: true, sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.active) return;
    setOffset({ x: dragRef.current.ox + e.clientX - dragRef.current.sx, y: dragRef.current.oy + e.clientY - dragRef.current.sy });
  };
  const onMouseUp = () => { dragRef.current.active = false; };

  const NavBtn = ({ dir }: { dir: "prev" | "next" }) => {
    const disabled = dir === "prev" ? index === 0 : index === images.length - 1;
    return (
      <button
        onClick={e => { e.stopPropagation(); setIndex(i => dir === "prev" ? Math.max(i - 1, 0) : Math.min(i + 1, images.length - 1)); }}
        disabled={disabled}
        style={{
          position: "absolute",
          top: "50%", transform: "translateY(-50%)",
          [dir === "prev" ? "left" : "right"]: "12px",
          zIndex: 10,
          width: "40px", height: "40px", borderRadius: "50%",
          backgroundColor: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#fff", cursor: disabled ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: disabled ? 0.2 : 0.85,
          transition: "opacity 0.15s",
        }}
      >
        {dir === "prev"
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        }
      </button>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: "#000", display: "flex", flexDirection: "column" }}>

      {/* ── Top bar ── */}
      <div style={{
        flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 12px",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
        gap: "8px",
      }}>
        {/* Left: trade info */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, overflow: "hidden" }}>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#fff", flexShrink: 0 }}>{img.instrument}</span>
          <span style={{ fontSize: "12px", padding: "1px 7px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", flexShrink: 0 }}>{img.direction}</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: isWin ? "#10b981" : "#ef4444", flexShrink: 0 }}>
            {isWin ? "+" : ""}${Math.abs(img.pnl).toFixed(0)}
          </span>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {format(new Date(img.date), "MMM d, yyyy")}
          </span>
        </div>

        {/* Right: counter + close */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{index + 1}/{images.length}</span>
          <button onClick={onClose} style={{ width: "32px", height: "32px", borderRadius: "6px", backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>✕</button>
        </div>
      </div>

      {/* ── Image area ── */}
      <div
        style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={img.url}
          alt={`${img.instrument} screenshot`}
          draggable={false}
          onClick={() => { if (scale === 1) setScale(2); else resetZoom(); }}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: "auto",
            height: "auto",
            objectFit: "contain",
            display: "block",
            transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
            transition: scale === 1 ? "transform 0.2s ease" : "none",
            cursor: scale > 1 ? "grab" : "zoom-in",
            userSelect: "none",
            touchAction: "none",
          }}
        />

        {/* Nav arrows — overlaid */}
        <NavBtn dir="prev" />
        <NavBtn dir="next" />

        {/* Zoom hint */}
        {scale > 1 && (
          <div style={{ position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", fontSize: "11px", color: "rgba(255,255,255,0.4)", backgroundColor: "rgba(0,0,0,0.4)", padding: "3px 10px", borderRadius: "10px", pointerEvents: "none" }}>
            {Math.round(scale * 100)}% — tap to reset
          </div>
        )}
      </div>

      {/* ── Bottom bar ── */}
      <div style={{
        flexShrink: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
        padding: "8px 12px 12px",
      }}>
        {/* Action buttons */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "10px" }}>
          <Link
            href={`/trade/${img.tradeId}`}
            onClick={e => e.stopPropagation()}
            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "8px 16px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            View Trade
          </Link>
          <button
            onClick={handleDownload}
            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "8px 16px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download
          </button>
        </div>

        {/* Thumbnail strip */}
        <div style={{ display: "flex", gap: "5px", justifyContent: "center", overflowX: "auto", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          {images.map((im, i) => (
            <div
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: "44px", height: "33px", flexShrink: 0, borderRadius: "4px", overflow: "hidden",
                border: i === index ? "2px solid #fff" : "2px solid transparent",
                opacity: i === index ? 1 : 0.45,
                cursor: "pointer", transition: "opacity 0.15s",
              }}
            >
              <img src={im.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
            </div>
          ))}
        </div>

        {scale <= 1 && (
          <div style={{ textAlign: "center", fontSize: "10px", color: "rgba(255,255,255,0.25)", marginTop: "6px" }}>
            Swipe to navigate · pinch to zoom
          </div>
        )}
      </div>
    </div>
  );
}
