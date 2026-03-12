"use client";

import { useState } from "react";

interface ExpandableImageProps {
  src: string;
  alt: string;
}

export default function ExpandableImage({ src, alt }: ExpandableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        style={{ 
          position: "relative", 
          width: "100%", 
          aspectRatio: "16/9",
          overflow: "hidden", 
          cursor: "zoom-in",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1e1e1e" // slight dark tone for empty spaces
        }}
        onClick={() => setIsOpen(true)}
        title="Click to enlarge"
      >
        <img 
          src={src} 
          alt={alt}
          style={{ 
            objectFit: "contain", 
            width: "100%", 
            height: "100%",
            transition: "transform 0.2s ease"
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.02)"}
          onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
        />
      </div>

      {isOpen && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "zoom-out"
          }}
          onClick={() => setIsOpen(false)}
          title="Click to close"
        >
          <img 
            src={src} 
            alt={alt}
            style={{ 
              maxWidth: "95vw", 
              maxHeight: "95vh", 
              objectFit: "contain",
              borderRadius: "4px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
            }}
          />
        </div>
      )}
    </>
  );
}
