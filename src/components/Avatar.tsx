"use client";

// 12 professional SVG avatars — geometric/abstract style, each unique
// Each avatar is a 40x40 SVG by default, scalable via size prop

export interface AvatarDef {
  id: string;
  label: string;
  bg: string;
  render: (size: number) => React.ReactNode;
}

export const AVATARS: AvatarDef[] = [
  {
    id: "bull",
    label: "Bull",
    bg: "#0f7b6c",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#0f7b6c"/>
        {/* Bull horns */}
        <path d="M10 16 Q8 10 13 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M30 16 Q32 10 27 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        {/* Bull head */}
        <ellipse cx="20" cy="22" rx="8" ry="7" fill="#fff" opacity="0.9"/>
        {/* Nose */}
        <ellipse cx="20" cy="26" rx="4" ry="2.5" fill="#0f7b6c" opacity="0.4"/>
        <circle cx="18.5" cy="26" r="0.8" fill="#0f7b6c"/>
        <circle cx="21.5" cy="26" r="0.8" fill="#0f7b6c"/>
        {/* Eyes */}
        <circle cx="17" cy="20" r="1.5" fill="#0f7b6c"/>
        <circle cx="23" cy="20" r="1.5" fill="#0f7b6c"/>
        <circle cx="17.5" cy="19.5" r="0.5" fill="#fff"/>
        <circle cx="23.5" cy="19.5" r="0.5" fill="#fff"/>
      </svg>
    ),
  },
  {
    id: "bear",
    label: "Bear",
    bg: "#eb5757",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#eb5757"/>
        {/* Ears */}
        <circle cx="13" cy="13" r="4" fill="#fff" opacity="0.85"/>
        <circle cx="27" cy="13" r="4" fill="#fff" opacity="0.85"/>
        <circle cx="13" cy="13" r="2" fill="#eb5757" opacity="0.5"/>
        <circle cx="27" cy="13" r="2" fill="#eb5757" opacity="0.5"/>
        {/* Head */}
        <circle cx="20" cy="22" r="9" fill="#fff" opacity="0.9"/>
        {/* Snout */}
        <ellipse cx="20" cy="26" rx="4" ry="2.5" fill="#eb5757" opacity="0.3"/>
        {/* Eyes */}
        <circle cx="17" cy="20" r="1.5" fill="#eb5757"/>
        <circle cx="23" cy="20" r="1.5" fill="#eb5757"/>
        <circle cx="17.5" cy="19.5" r="0.5" fill="#fff"/>
        <circle cx="23.5" cy="19.5" r="0.5" fill="#fff"/>
        {/* Nose */}
        <ellipse cx="20" cy="24.5" rx="1.5" ry="1" fill="#eb5757" opacity="0.7"/>
      </svg>
    ),
  },
  {
    id: "chart",
    label: "Trader",
    bg: "#2563eb",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#2563eb"/>
        {/* Chart bars */}
        <rect x="9" y="26" width="4" height="6" rx="1" fill="#fff" opacity="0.5"/>
        <rect x="15" y="20" width="4" height="12" rx="1" fill="#fff" opacity="0.7"/>
        <rect x="21" y="14" width="4" height="18" rx="1" fill="#fff" opacity="0.9"/>
        <rect x="27" y="18" width="4" height="14" rx="1" fill="#fff" opacity="0.7"/>
        {/* Trend line */}
        <polyline points="11,25 17,19 23,13 29,17" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="29" cy="17" r="2" fill="#60a5fa"/>
      </svg>
    ),
  },
  {
    id: "wolf",
    label: "Wolf",
    bg: "#7c3aed",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#7c3aed"/>
        {/* Ears */}
        <polygon points="12,8 9,18 16,16" fill="#fff" opacity="0.85"/>
        <polygon points="28,8 31,18 24,16" fill="#fff" opacity="0.85"/>
        <polygon points="12,10 10,17 15,15" fill="#7c3aed" opacity="0.5"/>
        <polygon points="28,10 30,17 25,15" fill="#7c3aed" opacity="0.5"/>
        {/* Head */}
        <ellipse cx="20" cy="23" rx="9" ry="8" fill="#fff" opacity="0.9"/>
        {/* Snout */}
        <ellipse cx="20" cy="27" rx="5" ry="3" fill="#e9d5ff" opacity="0.8"/>
        {/* Eyes */}
        <ellipse cx="16.5" cy="21" rx="1.8" ry="1.5" fill="#7c3aed"/>
        <ellipse cx="23.5" cy="21" rx="1.8" ry="1.5" fill="#7c3aed"/>
        <circle cx="17" cy="20.5" r="0.5" fill="#fff"/>
        <circle cx="24" cy="20.5" r="0.5" fill="#fff"/>
        {/* Nose */}
        <ellipse cx="20" cy="25.5" rx="1.5" ry="1" fill="#7c3aed" opacity="0.6"/>
      </svg>
    ),
  },
  {
    id: "eagle",
    label: "Eagle",
    bg: "#d97706",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#d97706"/>
        {/* Wings hint */}
        <path d="M8 22 Q14 16 20 20 Q26 16 32 22" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5"/>
        {/* Head */}
        <circle cx="20" cy="18" r="8" fill="#fff" opacity="0.9"/>
        {/* Beak */}
        <polygon points="20,22 17,25 23,25" fill="#d97706" opacity="0.8"/>
        {/* Eyes */}
        <circle cx="17" cy="17" r="2" fill="#d97706"/>
        <circle cx="23" cy="17" r="2" fill="#d97706"/>
        <circle cx="17.5" cy="16.5" r="0.7" fill="#fff"/>
        <circle cx="23.5" cy="16.5" r="0.7" fill="#fff"/>
        {/* Crown feathers */}
        <path d="M16 11 Q18 8 20 10 Q22 8 24 11" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "fox",
    label: "Fox",
    bg: "#ea580c",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#ea580c"/>
        {/* Ears */}
        <polygon points="13,7 9,17 17,15" fill="#fff" opacity="0.9"/>
        <polygon points="27,7 31,17 23,15" fill="#fff" opacity="0.9"/>
        <polygon points="13,9 10,16 16,14" fill="#ea580c" opacity="0.6"/>
        <polygon points="27,9 30,16 24,14" fill="#ea580c" opacity="0.6"/>
        {/* Head */}
        <ellipse cx="20" cy="23" rx="9" ry="8" fill="#fff" opacity="0.9"/>
        {/* Snout */}
        <ellipse cx="20" cy="27" rx="5" ry="3" fill="#fed7aa" opacity="0.9"/>
        {/* Eyes */}
        <ellipse cx="16.5" cy="21" rx="1.8" ry="2" fill="#ea580c"/>
        <ellipse cx="23.5" cy="21" rx="1.8" ry="2" fill="#ea580c"/>
        <circle cx="17" cy="20.5" r="0.6" fill="#fff"/>
        <circle cx="24" cy="20.5" r="0.6" fill="#fff"/>
        {/* Nose */}
        <ellipse cx="20" cy="25.5" rx="1.5" ry="1" fill="#ea580c" opacity="0.7"/>
      </svg>
    ),
  },
  {
    id: "lion",
    label: "Lion",
    bg: "#ca8a04",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#ca8a04"/>
        {/* Mane */}
        <circle cx="20" cy="21" r="12" fill="#fff" opacity="0.25"/>
        <circle cx="20" cy="21" r="10" fill="#fff" opacity="0.2"/>
        {/* Head */}
        <circle cx="20" cy="21" r="8" fill="#fef3c7" opacity="0.95"/>
        {/* Ears */}
        <circle cx="13" cy="14" r="3" fill="#fef3c7" opacity="0.9"/>
        <circle cx="27" cy="14" r="3" fill="#fef3c7" opacity="0.9"/>
        {/* Eyes */}
        <circle cx="17" cy="20" r="1.8" fill="#ca8a04"/>
        <circle cx="23" cy="20" r="1.8" fill="#ca8a04"/>
        <circle cx="17.5" cy="19.5" r="0.6" fill="#fff"/>
        <circle cx="23.5" cy="19.5" r="0.6" fill="#fff"/>
        {/* Nose */}
        <ellipse cx="20" cy="23" rx="1.5" ry="1" fill="#ca8a04" opacity="0.7"/>
        {/* Whiskers */}
        <line x1="12" y1="23" x2="17" y2="23.5" stroke="#ca8a04" strokeWidth="0.8" opacity="0.5"/>
        <line x1="12" y1="25" x2="17" y2="24.5" stroke="#ca8a04" strokeWidth="0.8" opacity="0.5"/>
        <line x1="28" y1="23" x2="23" y2="23.5" stroke="#ca8a04" strokeWidth="0.8" opacity="0.5"/>
        <line x1="28" y1="25" x2="23" y2="24.5" stroke="#ca8a04" strokeWidth="0.8" opacity="0.5"/>
      </svg>
    ),
  },
  {
    id: "hawk",
    label: "Hawk",
    bg: "#0e7490",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#0e7490"/>
        {/* Head */}
        <circle cx="20" cy="20" r="9" fill="#fff" opacity="0.9"/>
        {/* Crest */}
        <path d="M17 12 Q20 8 23 12" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <circle cx="20" cy="9" r="1.5" fill="#fff" opacity="0.7"/>
        {/* Eyes — sharp */}
        <ellipse cx="16.5" cy="19" rx="2.2" ry="1.8" fill="#0e7490"/>
        <ellipse cx="23.5" cy="19" rx="2.2" ry="1.8" fill="#0e7490"/>
        <circle cx="17" cy="18.5" r="0.7" fill="#fff"/>
        <circle cx="24" cy="18.5" r="0.7" fill="#fff"/>
        {/* Beak — hooked */}
        <path d="M18 23 Q20 22 22 23 Q21 26 20 25 Q19 26 18 23Z" fill="#0e7490" opacity="0.7"/>
      </svg>
    ),
  },
  {
    id: "panther",
    label: "Panther",
    bg: "#1e1b4b",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#1e1b4b"/>
        {/* Ears */}
        <polygon points="13,8 10,17 17,15" fill="#312e81" opacity="0.9"/>
        <polygon points="27,8 30,17 23,15" fill="#312e81" opacity="0.9"/>
        {/* Head */}
        <ellipse cx="20" cy="23" rx="9" ry="8" fill="#312e81" opacity="0.95"/>
        {/* Eyes — glowing */}
        <ellipse cx="16.5" cy="21" rx="2" ry="2.2" fill="#818cf8"/>
        <ellipse cx="23.5" cy="21" rx="2" ry="2.2" fill="#818cf8"/>
        <ellipse cx="16.5" cy="21" rx="0.8" ry="1.5" fill="#1e1b4b"/>
        <ellipse cx="23.5" cy="21" rx="0.8" ry="1.5" fill="#1e1b4b"/>
        <circle cx="16.8" cy="20.2" r="0.4" fill="#fff" opacity="0.8"/>
        <circle cx="23.8" cy="20.2" r="0.4" fill="#fff" opacity="0.8"/>
        {/* Nose */}
        <ellipse cx="20" cy="25.5" rx="1.5" ry="1" fill="#818cf8" opacity="0.5"/>
        {/* Spots */}
        <circle cx="14" cy="24" r="0.8" fill="#818cf8" opacity="0.2"/>
        <circle cx="26" cy="24" r="0.8" fill="#818cf8" opacity="0.2"/>
      </svg>
    ),
  },
  {
    id: "shark",
    label: "Shark",
    bg: "#475569",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#475569"/>
        {/* Dorsal fin */}
        <polygon points="20,8 17,16 23,16" fill="#fff" opacity="0.7"/>
        {/* Head */}
        <ellipse cx="20" cy="23" rx="10" ry="7" fill="#cbd5e1" opacity="0.9"/>
        {/* Belly */}
        <ellipse cx="20" cy="25" rx="7" ry="4" fill="#fff" opacity="0.7"/>
        {/* Eyes */}
        <circle cx="15" cy="21" r="2" fill="#475569"/>
        <circle cx="25" cy="21" r="2" fill="#475569"/>
        <circle cx="15.5" cy="20.5" r="0.7" fill="#fff"/>
        <circle cx="25.5" cy="20.5" r="0.7" fill="#fff"/>
        {/* Grin */}
        <path d="M14 26 Q20 30 26 26" stroke="#475569" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <line x1="17" y1="27" x2="17" y2="29" stroke="#475569" strokeWidth="1"/>
        <line x1="20" y1="28" x2="20" y2="30" stroke="#475569" strokeWidth="1"/>
        <line x1="23" y1="27" x2="23" y2="29" stroke="#475569" strokeWidth="1"/>
      </svg>
    ),
  },
  {
    id: "rocket",
    label: "Rocket",
    bg: "#0f172a",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#0f172a"/>
        {/* Rocket body */}
        <path d="M20 8 Q25 12 25 22 L20 26 L15 22 Q15 12 20 8Z" fill="#fff" opacity="0.9"/>
        {/* Window */}
        <circle cx="20" cy="18" r="3" fill="#0f172a"/>
        <circle cx="20" cy="18" r="2" fill="#38bdf8" opacity="0.8"/>
        {/* Fins */}
        <polygon points="15,22 11,28 15,26" fill="#fff" opacity="0.6"/>
        <polygon points="25,22 29,28 25,26" fill="#fff" opacity="0.6"/>
        {/* Flame */}
        <path d="M17 26 Q20 32 23 26" fill="#f97316" opacity="0.9"/>
        <path d="M18 26 Q20 30 22 26" fill="#fbbf24" opacity="0.9"/>
      </svg>
    ),
  },
  {
    id: "diamond",
    label: "Diamond",
    bg: "#0891b2",
    render: (s) => (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#0891b2"/>
        {/* Diamond gem */}
        <polygon points="20,8 30,18 20,32 10,18" fill="#fff" opacity="0.9"/>
        <polygon points="20,8 30,18 20,18" fill="#bae6fd" opacity="0.8"/>
        <polygon points="10,18 20,18 20,32" fill="#7dd3fc" opacity="0.7"/>
        <polygon points="20,8 10,18 20,18" fill="#e0f2fe" opacity="0.9"/>
        {/* Shine */}
        <line x1="14" y1="14" x2="17" y2="17" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
        <line x1="16" y1="11" x2="17" y2="14" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
  },
];

interface AvatarProps {
  avatarId?: string | null;
  name?: string | null;
  size?: number;
}

// Renders the selected avatar, or a fallback initials circle
export default function Avatar({ avatarId, name, size = 40 }: AvatarProps) {
  const def = AVATARS.find(a => a.id === avatarId);

  if (def) {
    return <span style={{ display: "inline-flex", flexShrink: 0, borderRadius: "50%", overflow: "hidden", width: size, height: size }}>{def.render(size)}</span>;
  }

  // Fallback: initials
  const initials = name
    ? name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      backgroundColor: "var(--bg-hover)", border: "1px solid var(--border-color)",
      fontSize: size * 0.35, fontWeight: 700, color: "var(--text-secondary)",
      userSelect: "none",
    }}>
      {initials}
    </span>
  );
}
