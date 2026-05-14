"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";

const API_URL = "http://localhost:8000";

const POLICY_TEMPLATES = {
  "Procurement Standard": {
    name: "Procurement Standard",
    maxAmount: 50000,
    approvedVendors: ["Coastal Freight Ltd", "City Couriers", "FastShip SA"],
    blockWeekends: true,
    businessHoursOnly: true,
    firstPaymentHold: true,
    mfaThreshold: 25000,
    softBlockPercent: 80,
  },
  "Treasury High-Value": {
    name: "Treasury High-Value",
    maxAmount: 250000,
    approvedVendors: ["Global Logistics Inc", "Premium Freight Ltd"],
    blockWeekends: false,
    businessHoursOnly: false,
    firstPaymentHold: false,
    mfaThreshold: 100000,
    softBlockPercent: 90,
  },
  "Strict Compliance": {
    name: "Strict Compliance",
    maxAmount: 10000,
    approvedVendors: ["Office Supplies Co", "Stationery Depot"],
    blockWeekends: true,
    businessHoursOnly: true,
    firstPaymentHold: true,
    mfaThreshold: 5000,
    softBlockPercent: 70,
  },
  "Emergency Purchasing": {
    name: "Emergency Purchasing",
    maxAmount: 150000,
    approvedVendors: [],
    blockWeekends: false,
    businessHoursOnly: false,
    firstPaymentHold: false,
    mfaThreshold: 75000,
    softBlockPercent: 85,
  },
};

export default function Home() {
  const [publicKeyFp, setPublicKeyFp] = useState("");
  const [activeTab, setActiveTab] = useState("verify");
  const [policies, setPolicies] = useState([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState(null);
  const [policy, setPolicy] = useState({
    name: "Default Policy",
    maxAmount: 50000,
    approvedVendors: ["Coastal Freight Ltd", "City Couriers", "FastShip SA"],
    blockWeekends: true,
    businessHoursOnly: true,
    firstPaymentHold: true,
    mfaThreshold: 25000,
    softBlockPercent: 80,
  });
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState(0);
  const [agentId, setAgentId] = useState("");
  const [lastVIC, setLastVIC] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulationResults, setSimulationResults] = useState([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/public-key`).then(res => setPublicKeyFp(res.data.fingerprint)).catch(() => {});
    
    const savedPolicies = localStorage.getItem("payreality_policies");
    if (savedPolicies) {
      setPolicies(JSON.parse(savedPolicies));
    } else {
      const defaultPolicies = [{ id: "policy-1", ...POLICY_TEMPLATES["Procurement Standard"] }];
      setPolicies(defaultPolicies);
      localStorage.setItem("payreality_policies", JSON.stringify(defaultPolicies));
    }
    
    const savedPolicyId = localStorage.getItem("payreality_selected_policy");
    if (savedPolicyId) {
      setSelectedPolicyId(savedPolicyId);
      const savedPoliciesList = JSON.parse(localStorage.getItem("payreality_policies")) || [];
      const found = savedPoliciesList.find(p => p.id === savedPolicyId);
      if (found) setPolicy(found);
    }
    
    const savedHistory = localStorage.getItem("payreality_history");
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const saveCurrentPolicy = () => {
    if (!policy.name || policy.name.trim() === "") {
      alert("Please enter a policy name");
      return;
    }
    
    let updatedPolicies;
    if (selectedPolicyId) {
      updatedPolicies = policies.map(p => p.id === selectedPolicyId ? { ...policy, id: selectedPolicyId } : p);
    } else {
      const newId = `policy-${Date.now()}`;
      updatedPolicies = [...policies, { ...policy, id: newId }];
      setSelectedPolicyId(newId);
    }
    
    setPolicies(updatedPolicies);
    localStorage.setItem("payreality_policies", JSON.stringify(updatedPolicies));
    localStorage.setItem("payreality_selected_policy", selectedPolicyId || updatedPolicies[updatedPolicies.length-1].id);
    alert(`Policy "${policy.name}" saved!`);
    setShowTemplateSelector(false);
    setIsCreatingNew(false);
  };

  const loadTemplate = (templateName) => {
    const template = POLICY_TEMPLATES[templateName];
    if (template) {
      setPolicy({ ...template });
      setSelectedPolicyId(null);
      setShowTemplateSelector(false);
    }
  };

  const loadExistingPolicy = (policyToLoad) => {
    setPolicy(policyToLoad);
    setSelectedPolicyId(policyToLoad.id);
    setShowTemplateSelector(false);
    setIsCreatingNew(false);
  };

  const createNewPolicy = () => {
    setPolicy({
      name: "",
      maxAmount: 50000,
      approvedVendors: [],
      blockWeekends: false,
      businessHoursOnly: false,
      firstPaymentHold: false,
      mfaThreshold: 25000,
      softBlockPercent: 80,
    });
    setSelectedPolicyId(null);
    setIsCreatingNew(true);
    setShowTemplateSelector(false);
  };

  const deletePolicy = (policyId) => {
    if (policies.length <= 1) {
      alert("You must keep at least one policy");
      return;
    }
    const updatedPolicies = policies.filter(p => p.id !== policyId);
    setPolicies(updatedPolicies);
    localStorage.setItem("payreality_policies", JSON.stringify(updatedPolicies));
    if (selectedPolicyId === policyId) {
      const firstPolicy = updatedPolicies[0];
      setPolicy(firstPolicy);
      setSelectedPolicyId(firstPolicy.id);
      localStorage.setItem("payreality_selected_policy", firstPolicy.id);
    }
    alert("Policy deleted");
  };

  const verifyPayment = async () => {
    if (!vendor || amount <= 0) {
      alert("Please enter vendor name and amount");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        vendor: vendor,
        amount: amount,
        agent_id: agentId || null,
        policy: {
          name: policy.name,
          maxAmount: policy.maxAmount,
          approvedVendors: policy.approvedVendors,
          blockWeekends: policy.blockWeekends,
          businessHoursOnly: policy.businessHoursOnly,
          firstPaymentHold: policy.firstPaymentHold,
          mfaThreshold: policy.mfaThreshold,
          softBlockPercent: policy.softBlockPercent,
        }
      };
      console.log("Sending payload:", payload);
      const res = await axios.post(`${API_URL}/api/verify`, payload);
      console.log("Response:", res.data);
      setLastVIC(res.data);
      const newHistory = [res.data, ...history].slice(0, 50);
      setHistory(newHistory);
      localStorage.setItem("payreality_history", JSON.stringify(newHistory));
      alert(`Payment ${res.data.approved ? "APPROVED" : "BLOCKED"}! VIC ID: ${res.data.vic_id}`);
    } catch (err) { 
      console.error("Verification error:", err);
      alert("Error verifying payment. Check console for details.");
    }
    setLoading(false);
  };

  const runSimulation = async () => {
    setLoading(true);
    setSimulationResults([]);
    const vendors = ["Coastal Freight Ltd", "City Couriers", "FastShip SA", "Unknown Trading", "Shadow Logistics", "Global Logistics Inc"];
    const amounts = [5000, 12500, 25000, 42500, 50000, 75000, 100000, 150000];
    const results = [];
    
    for (let i = 0; i < vendors.length; i++) {
      const randVendor = vendors[i];
      const randAmount = amounts[i];
      await new Promise(r => setTimeout(r, 300));
      try {
        const payload = {
          vendor: randVendor,
          amount: randAmount,
          agent_id: "AI-Simulator",
          policy: {
            name: policy.name,
            maxAmount: policy.maxAmount,
            approvedVendors: policy.approvedVendors,
            blockWeekends: policy.blockWeekends,
            businessHoursOnly: policy.businessHoursOnly,
            firstPaymentHold: policy.firstPaymentHold,
            mfaThreshold: policy.mfaThreshold,
            softBlockPercent: policy.softBlockPercent,
          }
        };
        const res = await axios.post(`${API_URL}/api/verify`, payload);
        results.push(res.data);
        setSimulationResults([...results]);
        
        const newHistory = [res.data, ...history].slice(0, 50);
        setHistory(newHistory);
        localStorage.setItem("payreality_history", JSON.stringify(newHistory));
      } catch(e) { 
        console.error("Simulation error:", e);
        results.push({ vendor: randVendor, amount: randAmount, approved: false, reasons: ["API Error"], vic_id: "ERROR" });
        setSimulationResults([...results]);
      }
    }
    setLoading(false);
    alert(`Simulation complete! ${results.filter(r => r.approved).length} approved, ${results.filter(r => !r.approved).length} blocked.`);
  };

  const TabButton = ({ id, label }) => (
    <button onClick={() => setActiveTab(id)} className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === id ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">PayReality</h1>
            <p className="text-gray-500 mt-1">Verifiable Intent Certificates for AI Payments</p>
            <div className="flex gap-2 mt-2 text-xs text-gray-400 font-mono">
              <span>Provisional Patent PPN00002476</span>
              <span>•</span>
              <span>Ed25519 Signatures</span>
              <span>•</span>
              <span>Public Key FP: {publicKeyFp}</span>
            </div>
          </div>
          <Link href="/history" className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900">
            Payment Queue →
          </Link>
        </div>

        <div className="flex gap-3 mb-8 border-b border-gray-200 pb-4">
          <TabButton id="policy" label="Policy Manager" />
          <TabButton id="verify" label="Verify Payment" />
          <TabButton id="simulate" label="AI Simulator" />
          <TabButton id="audit" label="Audit Log" />
        </div>

        {/* Policy Manager Tab */}
        {activeTab === "policy" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">My Policies</h2>
                <div className="flex gap-2">
                  <button onClick={() => setShowTemplateSelector(!showTemplateSelector)} className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200">Use Template</button>
                  <button onClick={createNewPolicy} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ New Policy</button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {policies.map(p => (
                  <button key={p.id} onClick={() => loadExistingPolicy(p)} className={`px-3 py-1.5 text-sm rounded-lg transition ${selectedPolicyId === p.id ? "bg-blue-100 text-blue-700 border border-blue-300" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {p.name}
                    {p.id !== policies[0]?.id && (
                      <span onClick={(e) => { e.stopPropagation(); deletePolicy(p.id); }} className="ml-2 text-red-500 hover:text-red-700">×</span>
                    )}
                  </button>
                ))}
              </div>
              
              {showTemplateSelector && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium mb-2">Choose a template:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(POLICY_TEMPLATES).map(templateName => (
                      <button key={templateName} onClick={() => loadTemplate(templateName)} className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        {templateName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{isCreatingNew ? "Create New Policy" : "Edit Policy"}</h2>
              <p className="text-gray-500 text-sm mb-6">Define the rules that govern AI agent payments</p>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Policy Name</label>
                  <input type="text" value={policy.name} onChange={e => setPolicy({...policy, name: e.target.value})} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" placeholder="e.g. Procurement Policy #001" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount per Transaction ($)</label>
                    <input type="number" value={policy.maxAmount} onChange={e => setPolicy({...policy, maxAmount: parseInt(e.target.value) || 0})} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">MFA Threshold ($)</label>
                    <input type="number" value={policy.mfaThreshold} onChange={e => setPolicy({...policy, mfaThreshold: parseInt(e.target.value) || 0})} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Approved Vendors (one per line)</label>
                  <textarea value={policy.approvedVendors.join('\n')} onChange={e => setPolicy({...policy, approvedVendors: e.target.value.split('\n').filter(v => v.trim())})} rows={4} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 font-mono text-sm" />
                  <p className="text-xs text-gray-400 mt-1">Leave empty to allow all vendors</p>
                </div>
                
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={policy.blockWeekends} onChange={e => setPolicy({...policy, blockWeekends: e.target.checked})} className="w-4 h-4" /> Block Weekends</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={policy.businessHoursOnly} onChange={e => setPolicy({...policy, businessHoursOnly: e.target.checked})} className="w-4 h-4" /> Business Hours Only (9-5)</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={policy.firstPaymentHold} onChange={e => setPolicy({...policy, firstPaymentHold: e.target.checked})} className="w-4 h-4" /> First-Payment Hold</label>
                </div>
              </div>
              
              <button onClick={saveCurrentPolicy} className="mt-8 w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700">
                Save Policy
              </button>
            </div>
          </div>
        )}

        {/* Verify Tab */}
        {activeTab === "verify" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verify Payment</h2>
              <p className="text-gray-500 text-sm mb-6">Current Policy: <span className="font-medium text-gray-800">{policy.name}</span></p>
              <div className="space-y-5">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label><input type="text" value={vendor} onChange={e => setVendor(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" placeholder="e.g. Coastal Freight Ltd" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label><input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Agent ID (optional)</label><input type="text" value={agentId} onChange={e => setAgentId(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" /></div>
                <button onClick={verifyPayment} disabled={loading} className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Verifying..." : "Verify Payment"}
                </button>
              </div>
            </div>
            {lastVIC && (
              <div className={`rounded-2xl border-2 p-8 ${lastVIC.approved ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}>
                <div className="text-center border-b pb-4 mb-4"><div className="inline-block bg-white px-4 py-1 rounded-full text-xs font-mono">VERIFIABLE INTENT CERTIFICATE</div><div className={`text-2xl font-bold mt-3 ${lastVIC.approved ? "text-green-600" : "text-red-600"}`}>{lastVIC.approved ? "APPROVED" : "BLOCKED"}</div></div>
                <div className="space-y-3"><div className="flex justify-between py-2 border-b"><span className="text-gray-500">ID:</span><span className="font-mono text-sm">{lastVIC.vic_id}</span></div><div className="flex justify-between py-2 border-b"><span className="text-gray-500">Time:</span><span>{new Date(lastVIC.timestamp).toLocaleString()}</span></div><div className="flex justify-between py-2 border-b"><span className="text-gray-500">Vendor:</span><span>{lastVIC.vendor}</span></div><div className="flex justify-between py-2 border-b"><span className="text-gray-500">Amount:</span><span>${lastVIC.amount.toLocaleString()}</span></div></div>
                {lastVIC.reasons?.length > 0 && <div className="bg-red-100 rounded-xl p-4 mt-4"><div className="font-semibold text-red-700 text-sm mb-1">Reasons:</div><ul className="list-disc list-inside text-red-600 text-sm">{lastVIC.reasons.map((r,i) => <li key={i}>{r}</li>)}</ul></div>}
                <div className="mt-4 pt-3 border-t"><div className="text-xs text-gray-400 font-mono break-all"><span className="font-semibold">Ed25519:</span> {lastVIC.signature?.slice(0, 64)}...</div></div>
              </div>
            )}
          </div>
        )}

        {/* Simulate Tab */}
        {activeTab === "simulate" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🤖</div>
              <h2 className="text-xl font-semibold mb-2">AI Agent Simulator</h2>
              <p className="text-gray-500 text-sm mb-6">Using policy: <span className="font-medium">{policy.name}</span></p>
              <button onClick={runSimulation} disabled={loading} className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50">
                {loading ? "Simulating..." : "Run Simulation (6 payments)"}
              </button>
            </div>

            {simulationResults.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">Simulation Results</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {simulationResults.map((result, idx) => (
                    <div key={idx} className={`p-4 flex justify-between items-center ${result.approved ? "hover:bg-green-50" : "hover:bg-red-50"}`}>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{result.vendor}</div>
                        <div className="text-sm text-gray-500">${result.amount?.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${result.approved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {result.approved ? "APPROVED" : "BLOCKED"}
                        </span>
                        {result.reasons?.length > 0 && (
                          <div className="text-xs text-red-500 mt-1 max-w-md">{result.reasons.slice(0, 1).join("; ")}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-xl font-semibold mb-2">Audit Log</h2>
            <p className="text-gray-500 text-sm mb-6">Complete history of all verification decisions</p>
            {history.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No verifications yet. Run the AI Simulator or verify a payment.</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.slice(0, 20).map((v,i) => (
                  <div key={i} className={`p-4 rounded-xl border cursor-pointer hover:shadow-md ${v.approved ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`} onClick={() => { setActiveTab("verify"); setLastVIC(v); setVendor(v.vendor); setAmount(v.amount); }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-mono ${v.approved ? "text-green-600" : "text-red-600"}`}>{v.vic_id}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${v.approved ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>{v.approved ? "APPROVED" : "BLOCKED"}</span>
                        </div>
                        <p className="font-medium">{v.vendor}</p>
                        <p className="text-sm text-gray-500">${v.amount?.toLocaleString()}</p>
                      </div>
                    </div>
                    {v.reasons?.length > 0 && <div className="text-xs text-red-500 mt-2">{v.reasons.slice(0, 2).join("; ")}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
