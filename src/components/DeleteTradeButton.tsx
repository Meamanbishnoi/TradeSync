"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";

export default function DeleteTradeButton({ tradeId }: { tradeId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async () => {
    setIsModalOpen(false);
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/trades/${tradeId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete trade");
      showToast("Trade deleted", "success");
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      showToast(msg, "error");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={isDeleting}
        className="notion-button"
        style={{ fontSize: "14px", padding: "4px 8px", color: "var(--bg-color)", backgroundColor: "#eb5757", border: "none", opacity: isDeleting ? 0.7 : 1 }}
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>

      <ConfirmModal 
        isOpen={isModalOpen}
        title="Delete Trade"
        message="Are you sure you want to delete this trade? This action will permanently remove it from your journal."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
        isDestructive={true}
      />
    </>
  );
}
