"use client";

import { useState, useRef, useEffect } from "react";

interface ComboBoxProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  name?: string;
  required?: boolean;
}

export default function ComboBox({ value, onChange, options, placeholder, name, required }: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        name={name}
        className="notion-input"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <ul style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: "4px",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "6px",
          boxShadow: "var(--shadow-sm)",
          maxHeight: "200px",
          overflowY: "auto",
          zIndex: 50,
          listStyle: "none",
          padding: "4px 0"
        }}>
          {filteredOptions.map((opt) => (
            <li
              key={opt}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className="combobox-option"
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: "16px",
                transition: "background-color 0.1s ease"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
