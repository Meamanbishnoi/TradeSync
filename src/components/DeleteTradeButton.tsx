"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteTradeButton({ tradeId }: { tradeId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this trade? This action cannot be undone.")) return;
    
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/trades/${tradeId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete trade");
      
      router.push("/");
      router.refresh();
    } catch (err: any) {
      alert(err.message || "An error occurred deleting the trade");
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting} 
      className="notion-button" 
      style={{ fontSize: "14px", padding: "4px 8px", color: "var(--bg-color)", backgroundColor: "#eb5757", border: "none", opacity: isDeleting ? 0.7 : 1 }}
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
