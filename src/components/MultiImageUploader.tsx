"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  existingUrls: string[];
  onExistingUrlsChange: (urls: string[]) => void;
  newFiles: File[];
  onNewFilesChange: (files: File[]) => void;
}

export default function MultiImageUploader({
  existingUrls,
  onExistingUrlsChange,
  newFiles,
  onNewFilesChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        onNewFilesChange([...newFiles, ...pastedFiles]);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [newFiles, onNewFilesChange]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
      onNewFilesChange([...newFiles, ...droppedFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      onNewFilesChange([...newFiles, ...selectedFiles]);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeExisting = (indexToRemove: number) => {
    onExistingUrlsChange(existingUrls.filter((_, idx) => idx !== indexToRemove));
  };

  const removeNewFile = (indexToRemove: number) => {
    onNewFilesChange(newFiles.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div>
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? "var(--accent-color)" : "var(--border-color)"}`,
          borderRadius: "8px",
          padding: "32px",
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: isDragging ? "var(--bg-hover)" : "transparent",
          transition: "all 0.2s ease",
          marginBottom: "16px"
        }}
      >
        <p style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>
          Drag & drop images here, paste from clipboard, or click to browse.
        </p>
        <input 
          type="file" 
          multiple 
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }} 
        />
      </div>

      {/* Gallery Preview */}
      {(existingUrls.length > 0 || newFiles.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "16px" }}>
          
          {existingUrls.map((url, idx) => (
            <div key={`existing-${idx}`} style={{ position: "relative", width: "100%", aspectRatio: "1/1", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
              <img src={url} alt={`Existing ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); removeExisting(idx); }}
                style={{
                  position: "absolute", top: "4px", right: "4px", backgroundColor: "rgba(0,0,0,0.6)", color: "#fff", 
                  border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px"
                }}
              >
                ×
              </button>
            </div>
          ))}

          {newFiles.map((file, idx) => {
            const objectUrl = URL.createObjectURL(file);
            return (
              <div key={`new-${idx}`} style={{ position: "relative", width: "100%", aspectRatio: "1/1", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                <img src={objectUrl} alt={`New upload ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeNewFile(idx); }}
                  style={{
                    position: "absolute", top: "4px", right: "4px", backgroundColor: "var(--accent-color)", color: "#fff", 
                    border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px"
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}

        </div>
      )}
    </div>
  );
}
