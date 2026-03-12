"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import StarRating from "@/components/StarRating";
import AnalyticsModal from "@/components/AnalyticsModal";

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
};

interface TradesTableProps {};

export default function TradesTable({ initialTrades }: { initialTrades: Trade[] }) {
  const [timeFilter, setTimeFilter] = useState("All");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  
  const [sortField, setSortField] = useState<"date" | "pnl" | "contractSize">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  const [pageSize, setPageSize] = useState<number | "All">(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  const filteredTrades = useMemo(() => {
    let filtered = [...initialTrades];
    const now = new Date();

    if (timeFilter === "Today") {
      filtered = filtered.filter(t => {
        const d = new Date(t.date);
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (timeFilter === "This Week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0,0,0,0);
      filtered = filtered.filter(t => new Date(t.date) >= startOfWeek);
    } else if (timeFilter === "This Month") {
      filtered = filtered.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (timeFilter === "Custom" && customStart && customEnd) {
      const start = new Date(customStart);
      start.setHours(0,0,0,0);
      const end = new Date(customEnd);
      end.setHours(23,59,59,999);
      filtered = filtered.filter(t => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      });
    }

    // Apply Sorting
    filtered.sort((a, b) => {
      if (sortField === "date") {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortField === "pnl") {
        return sortDirection === "asc" ? a.pnl - b.pnl : b.pnl - a.pnl;
      } else if (sortField === "contractSize") {
        const sizeA = a.contractSize ?? 0;
        const sizeB = b.contractSize ?? 0;
        return sortDirection === "asc" ? sizeA - sizeB : sizeB - sizeA;
      }
      return 0;
    });

    return filtered;
  }, [initialTrades, timeFilter, customStart, customEnd, sortField, sortDirection]);

  const handleSort = (field: "date" | "pnl" | "contractSize") => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc"); // Default to desc when switching fields
    }
  };

  const totalFilteredPnl = filteredTrades.reduce((acc, t) => acc + t.pnl, 0);

  const totalPages = pageSize === "All" ? 1 : Math.ceil(filteredTrades.length / pageSize);
  const paginatedTrades = useMemo(() => {
    if (pageSize === "All") return filteredTrades;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTrades.slice(startIndex, startIndex + pageSize);
  }, [filteredTrades, currentPage, pageSize]);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
        
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", color: "var(--text-secondary)", marginBottom: "4px" }}>Time Period</label>
            <select 
              value={timeFilter} 
              onChange={(e) => { setTimeFilter(e.target.value); setCurrentPage(1); }}
              className="notion-input"
              style={{ width: "auto", padding: "6px 12px" }}
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Custom">Custom Range</option>
            </select>
          </div>

          {timeFilter === "Custom" && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", color: "var(--text-secondary)", marginBottom: "4px" }}>Start Date</label>
                <input type="date" value={customStart} onChange={e => {setCustomStart(e.target.value); setCurrentPage(1);}} className="notion-input" style={{ width: "auto", padding: "6px 12px" }} />
              </div>
              <span style={{ color: "var(--text-secondary)", marginTop: "16px" }}>to</span>
              <div>
                <label style={{ display: "block", fontSize: "14px", color: "var(--text-secondary)", marginBottom: "4px" }}>End Date</label>
                <input type="date" value={customEnd} onChange={e => {setCustomEnd(e.target.value); setCurrentPage(1);}} className="notion-input" style={{ width: "auto", padding: "6px 12px" }} />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <button 
            type="button" 
            onClick={() => setIsAnalyticsOpen(true)}
            className="notion-button" 
            style={{ padding: "6px 16px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px", verticalAlign: "middle" }}>
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            View Analytics
          </button>
          <div style={{ height: "30px", width: "1px", backgroundColor: "var(--border-color)" }}></div>
          <div style={{ textAlign: "right", fontSize: "16px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Period PNL:</span>{" "}
            <span style={{ color: totalFilteredPnl >= 0 ? '#0f7b6c' : '#eb5757', fontWeight: 600 }}>
              ${totalFilteredPnl.toFixed(2)}
            </span>
            <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{filteredTrades.length} trades found</div>
          </div>
          <div style={{ height: "30px", width: "1px", backgroundColor: "var(--border-color)" }}></div>
          <div>
            <label style={{ display: "block", fontSize: "14px", color: "var(--text-secondary)", marginBottom: "4px" }}>Per Page</label>
            <select 
              value={pageSize.toString()} 
              onChange={(e) => {
                const val = e.target.value;
                setPageSize(val === "All" ? "All" : parseInt(val));
                setCurrentPage(1);
              }}
              className="notion-input"
              style={{ width: "auto", padding: "6px 12px" }}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="All">All</option>
            </select>
          </div>
        </div>
      </div>

      {filteredTrades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px", border: "1px dashed var(--border-color)", borderRadius: "8px", color: "var(--text-secondary)" }}>
          <p>No trades found for this filter.</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "6px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "16px", backgroundColor: "var(--bg-color)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-primary)", textAlign: "left", backgroundColor: "var(--bg-secondary)" }}>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>Instrument</th>
                  <th 
                    style={{ padding: "12px 16px", fontWeight: 500, cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSort("date")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      Date
                      {sortField === "date" && (
                        <span style={{ fontSize: "12px" }}>{sortDirection === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>Session</th>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>Direction</th>
                  <th 
                    style={{ padding: "12px 16px", fontWeight: 500, cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSort("contractSize")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      Size
                      {sortField === "contractSize" && (
                        <span style={{ fontSize: "12px" }}>{sortDirection === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>Setup</th>
                  <th 
                    style={{ padding: "12px 16px", fontWeight: 500, cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSort("pnl")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      PNL
                      {sortField === "pnl" && (
                        <span style={{ fontSize: "12px" }}>{sortDirection === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrades.map((trade: Trade) => {
                  const isWin = trade.pnl >= 0;
                  return (
                    <tr key={trade.id} className="notion-table-row" style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: 0 }}>
                        <Link href={`/trade/${trade.id}`} style={{ padding: "12px 16px", fontWeight: 600, display: "block", textDecoration: "none" }}>{trade.instrument}</Link>
                      </td>
                      <td style={{ padding: 0, color: "var(--text-primary)" }}>
                        <Link href={`/trade/${trade.id}`} style={{ padding: "12px 16px", display: "block", textDecoration: "none", color: "inherit" }}>{format(new Date(trade.date), 'MM/dd/yyyy')}</Link>
                      </td>
                      <td style={{ padding: 0, color: "var(--text-primary)" }}>
                        <Link href={`/trade/${trade.id}`} style={{ padding: "12px 16px", display: "block", textDecoration: "none", color: "inherit" }}>{trade.session || "-"}</Link>
                      </td>
                      <td style={{ padding: 0 }}>
                        <Link href={`/trade/${trade.id}`} style={{ padding: "12px 16px", display: "block", textDecoration: "none" }}>
                          <span style={{ padding: "2px 6px", borderRadius: "4px", border: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", fontSize: "14px", color: "var(--text-secondary)" }}>{trade.direction}</span>
                        </Link>
                      </td>
                      <td style={{ padding: 0, color: "var(--text-primary)" }}>
                        <Link href={`/trade/${trade.id}`} style={{ padding: "12px 16px", display: "block", textDecoration: "none", color: "inherit" }}>{trade.contractSize || "-"}</Link>
                      </td>
                      <td style={{ padding: 0, color: "var(--text-primary)" }}>
                        <Link href={`/trade/${trade.id}`} style={{ padding: "12px 16px", display: "block", textDecoration: "none", color: "inherit" }}>{trade.setup || "-"}</Link>
                      </td>
                      <td style={{ padding: 0 }}>
                        <Link href={`/trade/${trade.id}`} style={{ padding: "12px 16px", display: "block", textDecoration: "none" }}>
                           <span style={{ display: "inline-block", color: isWin ? '#0f7b6c' : '#eb5757', backgroundColor: isWin ? 'rgba(15, 123, 108, 0.1)' : 'rgba(235, 87, 87, 0.1)', padding: "4px 8px", borderRadius: "4px", fontWeight: 500 }}>
                             {isWin ? '+' : ''}${trade.pnl.toFixed(2)}
                           </span>
                        </Link>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {trade.rating ? <StarRating rating={trade.rating} readonly /> : <span style={{ color: "var(--text-tertiary)", fontSize: "16px" }}>-</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {pageSize !== "All" && totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
              <span style={{ fontSize: "16px", color: "var(--text-secondary)" }}>
                Page {currentPage} of {totalPages}
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="notion-button"
                  style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                >
                  Previous
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="notion-button"
                  style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <AnalyticsModal 
        isOpen={isAnalyticsOpen} 
        onClose={() => setIsAnalyticsOpen(false)} 
        trades={filteredTrades} 
      />
    </div>
  );
}
