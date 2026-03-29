"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  let counter = 0;

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + counter++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const colors: Record<ToastType, { bg: string; border: string; color: string }> = {
    success: { bg: "rgba(15, 123, 108, 0.12)", border: "#0f7b6c", color: "#0f7b6c" },
    error:   { bg: "rgba(235, 87, 87, 0.12)",  border: "#eb5757", color: "#eb5757" },
    info:    { bg: "var(--bg-secondary)",        border: "var(--border-color)", color: "var(--text-primary)" },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        zIndex: 9999,
        pointerEvents: "none",
      }}>
        {toasts.map(t => {
          const c = colors[t.type];
          return (
            <div key={t.id} style={{
              padding: "12px 16px",
              borderRadius: "8px",
              border: `1px solid ${c.border}`,
              backgroundColor: c.bg,
              color: c.color,
              fontSize: "15px",
              fontWeight: 500,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              maxWidth: "320px",
              animation: "slideIn 0.2s ease",
            }}>
              {t.message}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
