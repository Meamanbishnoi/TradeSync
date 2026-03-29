"use client";

import { useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = true
}: ConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999,
      backdropFilter: "blur(4px)"
    }} onClick={onCancel}>
      <div style={{
        backgroundColor: "var(--bg-color)",
        borderRadius: "12px",
        padding: "24px",
        maxWidth: "420px",
        width: "90%",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        border: "1px solid var(--border-color)",
        transform: "scale(1)",
        transition: "all 0.2s ease-out"
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "var(--text-primary)" }}>
          {title}
        </h3>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginBottom: "32px", lineHeight: "1.5" }}>
          {message}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button 
            type="button" 
            onClick={onCancel}
            className="notion-button"
            style={{ padding: "8px 16px", backgroundColor: "transparent" }}
          >
            {cancelLabel}
          </button>
          <button 
            type="button" 
            onClick={onConfirm}
            className="notion-button"
            style={{ 
              padding: "8px 16px", 
              backgroundColor: isDestructive ? "#e03e3e" : "var(--text-primary)", 
              color: isDestructive ? "#fff" : "var(--bg-color)",
              border: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
