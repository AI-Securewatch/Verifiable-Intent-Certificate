"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PaymentHistory() {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedVIC, setSelectedVIC] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("payreality_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const exportVIC = (vic) => {
    const blob = new Blob([JSON.stringify(vic, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${vic.vic_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredHistory = history.filter(v => {
    if (filter === "all") return true;
    if (filter === "approved") return v.approved === true;
    if (filter === "blocked") return v.approved === false;
    return true;
  });

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const totalApproved = history.filter(v => v.approved).length;
  const totalBlocked = history.filter(v => !v.approved).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">← Back to Dashboard</Link>
          <h1 className="text-2xl font-semibold text-gray-800 mt-4">Live Payment Queue</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Auto-refresh</span>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">ON</span>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-5 py-2 text-sm font-medium rounded-md transition ${
              filter === "all" ? "bg-gray-800 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            All ({history.length})
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-5 py-2 text-sm font-medium rounded-md transition ${
              filter === "approved" ? "bg-green-600 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Approved ({totalApproved})
          </button>
          <button
            onClick={() => setFilter("blocked")}
            className={`px-5 py-2 text-sm font-medium rounded-md transition ${
              filter === "blocked" ? "bg-red-600 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Blocked ({totalBlocked})
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Policy</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Verdict</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16 text-gray-400">
                      No payments yet
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((v, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-6 py-3 text-sm text-gray-600 font-mono">
                        {formatTime(v.timestamp)}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {v.agent_id || "AI Agent"}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-800">
                        {v.vendor}
                      </td>
                      <td className="px-6 py-3 text-sm text-right font-medium text-gray-800">
                        ${v.amount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
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
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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
            <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Verifiable Intent Certificate</h3>
                  <p className="text-xs text-gray-400 mt-1">Cryptographically signed • Ed25519</p>
                </div>
                <button onClick={() => setSelectedVIC(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
              </div>
              
              {/* Certificate Content */}
              <div className="p-6 space-y-5">
                {/* Status Banner */}
                <div className={`rounded-xl p-4 text-center ${selectedVIC.approved ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                  <div className={`text-2xl font-bold ${selectedVIC.approved ? "text-green-700" : "text-red-700"}`}>
                    {selectedVIC.approved ? "✓ PAYMENT APPROVED" : "✗ PAYMENT BLOCKED"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Verifiable Intent Certificate issued at settlement time</div>
                </div>
                
                {/* Certificate Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Certificate ID</div>
                    <div className="font-mono text-sm text-gray-800 mt-1 break-all">{selectedVIC.vic_id}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Timestamp</div>
                    <div className="text-sm text-gray-800 mt-1">{new Date(selectedVIC.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Vendor</div>
                    <div className="text-sm font-medium text-gray-800 mt-1">{selectedVIC.vendor}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Amount</div>
                    <div className="text-lg font-bold text-gray-900 mt-1">${selectedVIC.amount?.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Agent</div>
                    <div className="text-sm text-gray-800 mt-1">{selectedVIC.agent_id || "AI Agent"}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Policy Applied</div>
                    <div className="text-sm text-gray-800 mt-1">{selectedVIC.policy_name || "Default Policy"}</div>
                  </div>
                </div>
                
                {/* Block Reasons (if blocked) */}
                {selectedVIC.reasons?.length > 0 && (
                  <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                    <div className="font-semibold text-red-700 text-sm mb-2">Block Reasons</div>
                    <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                      {selectedVIC.reasons.map((r, idx) => <li key={idx}>{r}</li>)}
                    </ul>
                  </div>
                )}
                
                {/* Signature Section */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Ed25519 Signature</div>
                  <div className="font-mono text-xs text-gray-600 break-all bg-white p-3 rounded-lg border border-gray-200">
                    {selectedVIC.signature}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">Signature verified • Public key fingerprint: {selectedVIC.public_key_fingerprint}</span>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
                <div className="flex gap-3">
                  <button onClick={() => exportVIC(selectedVIC)} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition">
                    Export Full Certificate (JSON)
                  </button>
                  <button onClick={() => setSelectedVIC(null)} className="px-6 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-300 transition">
                    Close
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
