"use client";

import { useState } from "react";

interface StarRatingProps {
  rating: number; // 1-5, or 0 for unrated
  onChange?: (rating: number) => void;
  readonly?: boolean;
}

export default function StarRating({ rating, onChange, readonly = false }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div style={{ display: "flex", gap: "2px" }} onMouseLeave={() => setHoverRating(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (hoverRating || rating) >= star;
        return (
          <span
            key={star}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            style={{
              cursor: readonly ? "default" : "pointer",
              color: isFilled ? "#D4AF37" : "var(--border-color)", // Muted gold for filled
              fontSize: "22px",
              lineHeight: 1,
              transition: "color 0.2s ease, transform 0.1s ease",
              transform: (hoverRating === star && !readonly) ? "scale(1.15)" : "scale(1)",
            }}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}
