"use client";

import { useState } from "react";
import { AVATARS } from "@/components/Avatar";
import Avatar from "@/components/Avatar";
import { useToast } from "@/components/Toast";
import { useSession } from "next-auth/react";

interface Props {
  currentAvatarId?: string | null;
  name?: string | null;
  onSaved?: (avatarId: string) => void;
}

export default function AvatarPicker({ currentAvatarId, name, onSaved }: Props) {
  const { showToast } = useToast();
  const { update: updateSession } = useSession();
  const [selected, setSelected] = useState(currentAvatarId ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const handleSave = async () => {
    if (!selected) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarId: selected }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      await updateSession({ avatarId: selected });
      showToast("Avatar updated", "success");
      onSaved?.(selected);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error saving avatar", "error");
    } finally { setIsSaving(false); }
  };

  return (
    <div>
      {/* Current avatar preview */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
        <Avatar avatarId={selected} name={name} size={64} />
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600 }}>{selected ? AVATARS.find(a => a.id === selected)?.label : "No avatar selected"}</div>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>Click an avatar below to select it</div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: "10px", marginBottom: "16px" }}>
        {AVATARS.map(av => {
          const isSelected = selected === av.id;
          const isHovered = hovered === av.id;
          return (
            <div
              key={av.id}
              onClick={() => setSelected(av.id)}
              onMouseEnter={() => setHovered(av.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                padding: "10px 6px", borderRadius: "10px", cursor: "pointer",
                border: isSelected ? "2px solid var(--text-primary)" : "2px solid transparent",
                backgroundColor: isSelected ? "var(--bg-hover)" : isHovered ? "var(--bg-secondary)" : "transparent",
                transition: "all 0.15s ease",
                transform: isHovered && !isSelected ? "scale(1.05)" : "scale(1)",
              }}
            >
              <Avatar avatarId={av.id} size={48} />
              <span style={{ fontSize: "11px", color: isSelected ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: isSelected ? 600 : 400, textAlign: "center" }}>
                {av.label}
              </span>
            </div>
          );
        })}

        {/* Remove avatar option */}
        <div
          onClick={() => setSelected(null)}
          onMouseEnter={() => setHovered("none")}
          onMouseLeave={() => setHovered(null)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
            padding: "10px 6px", borderRadius: "10px", cursor: "pointer",
            border: selected === null ? "2px solid var(--text-primary)" : "2px solid transparent",
            backgroundColor: selected === null ? "var(--bg-hover)" : hovered === "none" ? "var(--bg-secondary)" : "transparent",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: "2px dashed var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: "20px" }}>
            ✕
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", textAlign: "center" }}>None</span>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving || selected === currentAvatarId}
        className="notion-button notion-button-primary"
        style={{ padding: "8px 20px", opacity: isSaving || selected === currentAvatarId ? 0.5 : 1 }}
      >
        {isSaving ? "Saving..." : "Save Avatar"}
      </button>
    </div>
  );
}
