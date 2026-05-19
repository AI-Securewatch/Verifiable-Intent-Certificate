"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PaymentHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [selectedVIC, setSelectedVIC] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("payreality_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const exportVIC = (vic: any) => {
    const blob = new Blob([JSON.stringify(vic, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${vic.vic_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredHistory = history.filter((v: any) => {
    if (filter === "all") return true;
    if (filter === "approved") return v.approved === true;
    if (filter === "blocked") return v.approved === false;
    return true;
  });

  const formatTime = (timestamp: any) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const totalApproved = history.filter(v => v.approved).length;
  const totalBlocked = history.filter(v => !v.approved).length;

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="text-sm text-primary hover:text-[#A8321C]">← Back to Dashboard</Link>
          <div className="flex justify-between items-center mt-4">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Live Payment Queue</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const isLight = document.documentElement.classList.toggle('light');
                  localStorage.theme = isLight ? 'light' : 'dark';
                }}
                className="p-2.5 glass-panel text-[var(--text-muted)] rounded-lg hover:border-[#D94028] transition shadow-md hover:text-[var(--accent-red)] flex items-center justify-center"
                title="Toggle Light/Dark Mode"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 4V2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 4 12 4zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6v12z"/></svg>
              </button>
              <div className="px-4 py-2 bg-[var(--bg-panel)] border border-[rgba(255,255,255,0.1)] text-[var(--text-primary)] rounded-lg text-sm font-mono hover:bg-[rgba(255,255,255,0.05)] transition flex items-center gap-2">
                <span className="text-sm text-[#9CA3AF]">Auto-refresh</span>
                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">ON</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-5 py-2 text-sm font-medium rounded-md transition ${
              filter === "all" ? "bg-gray-800 text-[var(--text-primary)]" : "bg-transparent text-[var(--text-muted)] border border-white/10 hover:bg-transparent"
            }`}
          >
            All ({history.length})
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-5 py-2 text-sm font-medium rounded-md transition ${
              filter === "approved" ? "bg-green-600 text-[var(--text-primary)]" : "bg-transparent text-[var(--text-muted)] border border-white/10 hover:bg-transparent"
            }`}
          >
            Approved ({totalApproved})
          </button>
          <button
            onClick={() => setFilter("blocked")}
            className={`px-5 py-2 text-sm font-medium rounded-md transition ${
              filter === "blocked" ? "bg-red-600 text-[var(--text-primary)]" : "bg-transparent text-[var(--text-muted)] border border-white/10 hover:bg-transparent"
            }`}
          >
            Blocked ({totalBlocked})
          </button>
        </div>

        {/* Table */}
        <div className="glass-panel overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-transparent border-b border-white/10">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Time</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Agent</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Vendor</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Policy</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Verdict</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-[var(--text-muted)]">
                      No payments yet
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((v, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-transparent transition">
                      <td className="px-6 py-3 text-sm text-[var(--text-muted)] font-mono">
                        {formatTime(v.timestamp)}
                      </td>
                      <td className="px-6 py-3 text-sm text-[#9CA3AF]">
                        {v.agent_id || "AI Agent"}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-[var(--text-primary)]">
                        {v.vendor}
                      </td>
                      <td className="px-6 py-3 text-sm text-right font-medium text-[var(--text-primary)]">
                        ${v.amount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-sm text-[#9CA3AF]">
                        {v.policy_name || "Policy #001"}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          v.approved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {v.approved ? "APPROVED" : "BLOCKED"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => setSelectedVIC(v)}
                          className="text-primary hover:text-[#A8321C] text-sm font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* VIC Certificate Modal */}
        {selectedVIC && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedVIC(null)}>
            <div className="bg-transparent rounded-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-transparent border-b border-white/10 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                <div>
                  <h3 className="text-lg font-semibold font-display text-[var(--text-primary)]">Verifiable Intent Certificate</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Cryptographically signed • Ed25519</p>
                </div>
                <button onClick={() => setSelectedVIC(null)} className="text-[var(--text-muted)] hover:text-[var(--text-muted)] text-2xl leading-none">×</button>
              </div>
              
              {/* Certificate Content */}
              <div className="p-6">
                <div className={`system-toast w-full max-w-full ${selectedVIC.approved ? 'status-success' : 'status-error'}`}>
                  <svg className="toast-icon" viewBox="0 0 24 24">
                    {selectedVIC.approved ? <use href="#icon-database"/> : <use href="#icon-shield-lock"/>}
                  </svg>
                  <div className="toast-content w-full">
                    <div className="toast-title text-sm">{selectedVIC.approved ? "VERIFIABLE_INTENT_CERTIFICATE // APPROVED" : "EXCEPTION_THROWN // BLOCKED"}</div>
                    <div className="toast-message mt-6">
                      <div className="grid grid-cols-2 gap-6 font-mono text-xs">
                        <div><span className="text-[var(--text-muted)]">Certificate ID:</span><br/>{selectedVIC.vic_id}</div>
                        <div><span className="text-[var(--text-muted)]">Timestamp:</span><br/>{new Date(selectedVIC.timestamp).toLocaleString()}</div>
                        <div><span className="text-[var(--text-muted)]">Vendor:</span><br/>{selectedVIC.vendor}</div>
                        <div><span className="text-[var(--text-muted)]">Amount:</span><br/>${selectedVIC.amount?.toLocaleString()}</div>
                        <div><span className="text-[var(--text-muted)]">Agent:</span><br/>{selectedVIC.agent_id || "AI Agent"}</div>
                        <div><span className="text-[var(--text-muted)]">Policy:</span><br/>{selectedVIC.policy_name || "Default Policy"}</div>
                      </div>
                      
                      {selectedVIC.reasons?.length > 0 && (
                        <div className="mt-6 p-4 border border-[var(--accent-red)] bg-[#D94028]/10 text-[var(--accent-red)] font-mono text-xs">
                          &gt; BLOCK_REASONS:<br/>
                          <div className="mt-2 space-y-1">
                            {selectedVIC.reasons.map((r: any, idx: number) => <div key={idx}>- {r}</div>)}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.1)] font-mono text-[10px] break-all">
                        <div className="text-[var(--text-muted)] mb-1">ED25519_SIGNATURE:</div>
                        <div className="text-[var(--text-body)]">{selectedVIC.signature}</div>
                        <div className="mt-3 text-[var(--accent-green)] flex items-center gap-2">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><use href="#icon-database"/></svg>
                          VERIFIED // PUBLIC_KEY_FP: {selectedVIC.public_key_fingerprint}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="border-t border-white/10 p-6 glass-panel rounded-b-2xl mt-4">
                <div className="flex gap-3">
                  <button onClick={() => exportVIC(selectedVIC)} className="flex-1 bg-primary text-[var(--text-primary)] py-2.5 rounded font-mono text-xs font-bold tracking-[0.1em] hover:bg-[#A8321C] transition shadow-[0_4px_15px_rgba(217,64,40,0.3)]">
                    &gt; EXPORT_FULL_CERTIFICATE
                  </button>
                  <button onClick={() => setSelectedVIC(null)} className="px-6 bg-white/5 border border-white/10 text-[var(--text-primary)] py-2.5 rounded font-mono text-xs font-bold tracking-[0.1em] hover:bg-white/10 transition">
                    // CLOSE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
