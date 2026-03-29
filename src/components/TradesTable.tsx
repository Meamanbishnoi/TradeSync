"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import AnalyticsModal from "@/components/AnalyticsModal";
import { useToast } from "@/components/Toast";
import ConfirmModal from "@/components/ConfirmModal";

interface Trade {
  id: string;
  instrument: string;
  date: string;
  session: string | null;
  direction: string;
  contractSize: number | null;
  setup: string | null;
  pnl: number;
  notes: string | null;
  rating: number | null;
}

export default function TradesTable({ initialTrades }: { initialTrades: Trade[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [timeFilter, setTimeFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [sortField, setSortField] = useState<"date" | "pnl" | "contractSize">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [pageSize, setPageSize] = useState<number | "All" | "Custom">(20);
  const [customPageSize, setCustomPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);

  const filteredTrades = useMemo(() => {
    let filtered = [...initialTrades];

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.instrument.toLowerCase().includes(q));
    }

    const now = new Date();
    if (timeFilter === "Today") {
      filtered = filtered.filter(t => {
        const d = new Date(t.date);
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (timeFilter === "This Week") {
      const sow = new Date(now);
      sow.setDate(now.getDate() - now.getDay());
      sow.setHours(0, 0, 0, 0);
      filtered = filtered.filter(t => new Date(t.date) >= sow);
    } else if (timeFilter === "This Month") {
      filtered = filtered.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (timeFilter === "Custom" && customStart && customEnd) {
      const s = new Date(customStart); s.setHours(0, 0, 0, 0);
      const e = new Date(customEnd); e.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => { const d = new Date(t.date); return d >= s && d <= e; });
    }
    filtered.sort((a, b) => {
      if (sortField === "date") return sortDirection === "asc"
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortField === "pnl") return sortDirection === "asc" ? a.pnl - b.pnl : b.pnl - a.pnl;
      const sA = a.contractSize ?? 0, sB = b.contractSize ?? 0;
      return sortDirection === "asc" ? sA - sB : sB - sA;
    });
    return filtered;
  }, [initialTrades, timeFilter, customStart, customEnd, sortField, sortDirection, searchQuery]);

  const handleSort = (field: "date" | "pnl" | "contractSize") => {
    if (sortField === field) setSortDirection(p => p === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDirection("desc"); }
  };

  const totalFilteredPnl = filteredTrades.reduce((acc, t) => acc + t.pnl, 0);
  const totalPages = pageSize === "All" ? 1 : Math.ceil(filteredTrades.length / (pageSize === "Custom" ? customPageSize : pageSize as number));

  const paginatedTrades = useMemo(() => {
    if (pageSize === "All") return filteredTrades;
    const size = pageSize === "Custom" ? customPageSize : pageSize as number;
    const start = (currentPage - 1) * size;
    return filteredTrades.slice(start, start + size);
  }, [filteredTrades, currentPage, pageSize, customPageSize]);

  const allPageSelected = paginatedTrades.length > 0 && paginatedTrades.every(t => selectedIds.has(t.id));

  const toggleSelectAll = () => {
    if (allPageSelected) setSelectedIds(prev => { const n = new Set(prev); paginatedTrades.forEach(t => n.delete(t.id)); return n; });
    else setSelectedIds(prev => { const n = new Set(prev); paginatedTrades.forEach(t => n.add(t.id)); return n; });
  };

  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const handleBulkDeleteSelect = () => {
    if (!selectedIds.size) return;
    setIsBulkDeleteModalOpen(true);
  }

  const handleBulkDelete = async () => {
    setIsBulkDeleteModalOpen(false);
    setIsBulkDeleting(true);
    try {
      const res = await fetch("/api/trades/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error("Failed to delete trades");
      showToast(`Deleted ${selectedIds.size} trade(s)`, "success");
      setSelectedIds(new Set());
      router.refresh();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error deleting trades", "error");
    } finally { setIsBulkDeleting(false); }
  };

  const handleDuplicate = async (tradeId: string) => {
    setIsDuplicating(tradeId);
    try {
      const res = await fetch(`/api/trades/${tradeId}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to duplicate trade");
      showToast("Trade duplicated", "success");
      router.refresh();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error duplicating trade", "error");
    } finally { setIsDuplicating(null); }
  };

  const SortIcon = ({ field }: { field: "date" | "pnl" | "contractSize" }) =>
    sortField === field ? <span style={{ fontSize: "11px" }}>{sortDirection === "asc" ? "▲" : "▼"}</span> : null;

  return (
    <div>
      {/* Filter bar */}
      <div style={{ marginBottom: "16px" }}>
        {/* Row 1: Time filter + PNL summary */}
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", marginBottom: "8px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 120px", minWidth: "120px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>Search Instrument</label>
            <input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="notion-input" style={{ padding: "6px 10px", fontSize: "14px", width: "100%", boxSizing: "border-box" }} placeholder="e.g. NQ" />
          </div>
          <div style={{ flex: "1 1 140px", minWidth: "120px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>Time Period</label>
            <select value={timeFilter} onChange={e => { setTimeFilter(e.target.value); setCurrentPage(1); }} className="notion-input" style={{ padding: "6px 10px", fontSize: "14px" }}>
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Custom">Custom Range</option>
            </select>
          </div>
          <div style={{ flex: "0 1 80px", minWidth: "70px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>Per Page</label>
            <select value={pageSize.toString()} onChange={e => { const val = e.target.value; setPageSize(val === "All" || val === "Custom" ? val : parseInt(val)); setCurrentPage(1); }} className="notion-input" style={{ padding: "6px 10px", fontSize: "14px" }}>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="All">All</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
          {pageSize === "Custom" && (
            <div style={{ flex: "0 1 70px", minWidth: "60px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>Count</label>
              <input type="number" min="1" value={customPageSize} onChange={e => { setCustomPageSize(Math.max(1, parseInt(e.target.value) || 1)); setCurrentPage(1); }} className="notion-input" style={{ padding: "6px 10px", fontSize: "14px" }} />
            </div>
          )}
          <div style={{ marginLeft: "auto", textAlign: "right", fontSize: "14px", paddingBottom: "2px" }}>
            <span style={{ color: totalFilteredPnl >= 0 ? "#0f7b6c" : "#eb5757", fontWeight: 700 }}>
              {totalFilteredPnl >= 0 ? "+" : ""}${totalFilteredPnl.toFixed(2)}
            </span>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{filteredTrades.length} trades</div>
          </div>
        </div>

        {timeFilter === "Custom" && (
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 130px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>Start</label>
              <input type="date" value={customStart} onChange={e => { setCustomStart(e.target.value); setCurrentPage(1); }} className="notion-input" style={{ padding: "6px 10px", fontSize: "14px" }} />
            </div>
            <div style={{ flex: "1 1 130px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>End</label>
              <input type="date" value={customEnd} onChange={e => { setCustomEnd(e.target.value); setCurrentPage(1); }} className="notion-input" style={{ padding: "6px 10px", fontSize: "14px" }} />
            </div>
          </div>
        )}

        {/* Row 2: Export button */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" onClick={() => exportCsv(filteredTrades)} className="notion-button" style={{ padding: "6px 12px", fontSize: "13px" }}>↓ Export CSV</button>
        </div>
      </div>

      <>
        {selectedIds.size > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", marginBottom: "12px" }}>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{selectedIds.size} selected</span>
            <button onClick={() => setIsBulkDeleteModalOpen(true)} disabled={isBulkDeleting} className="notion-button" style={{ fontSize: "14px", padding: "4px 12px", backgroundColor: "#eb5757", color: "#fff", border: "none" }}>
              {isBulkDeleting ? "Deleting..." : "Delete Selected"}
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="notion-button" style={{ fontSize: "14px", padding: "4px 12px" }}>Clear</button>
          </div>
        )}

        {filteredTrades.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px", border: "1px dashed var(--border-color)", borderRadius: "8px", color: "var(--text-secondary)" }}>
            <p>No trades found for this filter.</p>
          </div>
        ) : (
          <>
            <div className="trades-table-wrapper" style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "6px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "15px", backgroundColor: "var(--bg-color)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left", backgroundColor: "var(--bg-secondary)" }}>
                    <th style={{ padding: "10px 12px", width: "36px" }}>
                      <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll} style={{ cursor: "pointer" }} />
                    </th>
                    <th style={{ padding: "10px 12px", fontWeight: 500 }}>Instrument</th>
                    <th style={{ padding: "10px 12px", fontWeight: 500, cursor: "pointer", userSelect: "none" }} onClick={() => handleSort("date")}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>Date <SortIcon field="date" /></div>
                    </th>
                    <th className="hide-mobile" style={{ padding: "10px 12px", fontWeight: 500 }}>Session</th>
                    <th style={{ padding: "10px 12px", fontWeight: 500 }}>Dir</th>
                    <th className="hide-mobile" style={{ padding: "10px 12px", fontWeight: 500, cursor: "pointer", userSelect: "none" }} onClick={() => handleSort("contractSize")}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>Size <SortIcon field="contractSize" /></div>
                    </th>
                    <th className="hide-mobile" style={{ padding: "10px 12px", fontWeight: 500 }}>Setup</th>
                    <th style={{ padding: "10px 12px", fontWeight: 500, cursor: "pointer", userSelect: "none" }} onClick={() => handleSort("pnl")}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>PNL <SortIcon field="pnl" /></div>
                    </th>
                    <th style={{ padding: "10px 12px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTrades.map(trade => {
                    const isWin = trade.pnl >= 0;
                    const isSelected = selectedIds.has(trade.id);
                    return (
                      <tr key={trade.id} className="notion-table-row" style={{ borderBottom: "1px solid var(--border-color)", backgroundColor: isSelected ? "var(--bg-hover)" : undefined }}>
                        <td style={{ padding: "10px 12px" }}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(trade.id)} style={{ cursor: "pointer" }} onClick={e => e.stopPropagation()} />
                        </td>
                        <td style={{ padding: 0 }}>
                          <Link href={`/trade/${trade.id}`} style={{ padding: "10px 12px", fontWeight: 600, display: "block" }}>{trade.instrument}</Link>
                        </td>
                        <td style={{ padding: 0 }}>
                          <Link href={`/trade/${trade.id}`} style={{ padding: "10px 12px", display: "block", color: "inherit" }}>{format(new Date(trade.date), "MM/dd/yyyy")}</Link>
                        </td>
                        <td className="hide-mobile" style={{ padding: 0 }}>
                          <Link href={`/trade/${trade.id}`} style={{ padding: "10px 12px", display: "block", color: "var(--text-secondary)" }}>{trade.session || "-"}</Link>
                        </td>
                        <td style={{ padding: 0 }}>
                          <Link href={`/trade/${trade.id}`} style={{ padding: "10px 12px", display: "block" }}>
                            <span style={{ padding: "2px 6px", borderRadius: "4px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", fontSize: "13px", color: "var(--text-secondary)" }}>{trade.direction}</span>
                          </Link>
                        </td>
                        <td className="hide-mobile" style={{ padding: 0 }}>
                          <Link href={`/trade/${trade.id}`} style={{ padding: "10px 12px", display: "block", color: "inherit" }}>{trade.contractSize || "-"}</Link>
                        </td>
                        <td className="hide-mobile" style={{ padding: 0 }}>
                          <Link href={`/trade/${trade.id}`} style={{ padding: "10px 12px", display: "block", color: "inherit" }}>{trade.setup || "-"}</Link>
                        </td>
                        <td style={{ padding: 0 }}>
                          <Link href={`/trade/${trade.id}`} style={{ padding: "10px 12px", display: "block" }}>
                            <span style={{ color: isWin ? "#0f7b6c" : "#eb5757", backgroundColor: isWin ? "rgba(15,123,108,0.1)" : "rgba(235,87,87,0.1)", padding: "3px 7px", borderRadius: "4px", fontWeight: 500, fontSize: "14px" }}>
                              {isWin ? "+" : ""}${trade.pnl.toFixed(2)}
                            </span>
                          </Link>
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          <button onClick={() => handleDuplicate(trade.id)} disabled={isDuplicating === trade.id} title="Duplicate trade" className="notion-button" style={{ fontSize: "12px", padding: "3px 8px", opacity: isDuplicating === trade.id ? 0.6 : 1 }}>
                            {isDuplicating === trade.id ? "..." : "Copy"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pageSize !== "All" && totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
                <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Page {currentPage} of {totalPages}</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="notion-button" style={{ opacity: currentPage === 1 ? 0.5 : 1 }}>Previous</button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="notion-button" style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}>Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </>

      <AnalyticsModal isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} trades={filteredTrades} />

      <ConfirmModal 
        isOpen={isBulkDeleteModalOpen}
        title="Delete Multiple Trades"
        message={`Are you sure you want to permanently delete ${selectedIds.size} selected trades? This action cannot be undone.`}
        confirmLabel="Delete Trades"
        onConfirm={handleBulkDelete}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
        isDestructive={true}
      />
    </div>
  );
}

function exportCsv(trades: Trade[]) {
  const headers = ["Date", "Instrument", "Direction", "Session", "Size", "Setup", "PNL", "Rating"];
  const rows = trades.map(t => [
    format(new Date(t.date), "yyyy-MM-dd"),
    t.instrument, t.direction, t.session || "",
    t.contractSize?.toString() || "", t.setup || "",
    t.pnl.toFixed(2), t.rating?.toString() || "",
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trades-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
