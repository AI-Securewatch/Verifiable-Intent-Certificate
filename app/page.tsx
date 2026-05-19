"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";

const API_URL = "http://localhost:8000";

const DECISION_TYPES = [
  { value: "payment", label: "Payment" },
  { value: "fraud_detection", label: "Fraud Detection" },
  { value: "credit_scoring", label: "Credit Scoring" },
  { value: "claims", label: "Claims Processing" },
  { value: "procurement", label: "Procurement" },
  { value: "treasury", label: "Treasury" },
  { value: "compliance", label: "Compliance" },
];

const AVAILABLE_RULES = [
  { id: "daily_limit", name: "Daily Total Limit", category: "Amount Limits", applicableTo: ["payment", "fraud_detection", "credit_scoring", "claims", "procurement", "treasury"] },
  { id: "weekly_limit", name: "Weekly Total Limit", category: "Amount Limits", applicableTo: ["payment", "fraud_detection", "credit_scoring", "claims", "procurement", "treasury"] },
  { id: "monthly_limit", name: "Monthly Total Limit", category: "Amount Limits", applicableTo: ["payment", "fraud_detection", "credit_scoring", "claims", "procurement", "treasury"] },
  { id: "per_entity_daily_limit", name: "Per-Entity Daily Limit", category: "Amount Limits", applicableTo: ["payment", "procurement", "treasury"] },
  { id: "blocked_entities", name: "Blocked Entities Denylist", category: "Entity Controls", applicableTo: ["payment", "fraud_detection", "credit_scoring", "claims", "procurement", "treasury", "compliance"] },
  { id: "entity_velocity", name: "Entity Velocity Check", category: "Entity Controls", applicableTo: ["payment", "fraud_detection", "procurement", "treasury"] },
  { id: "holiday_restriction", name: "Holiday Restriction", category: "Time Controls", applicableTo: ["payment", "procurement"] },
  { id: "country_allowlist", name: "Country Allowlist", category: "Geographic Controls", applicableTo: ["payment", "fraud_detection", "credit_scoring", "procurement", "treasury", "compliance"] },
  { id: "country_denylist", name: "Country Denylist", category: "Geographic Controls", applicableTo: ["payment", "fraud_detection", "credit_scoring", "procurement", "treasury", "compliance"] },
  { id: "risk_score_threshold", name: "Risk Score Threshold", category: "Fraud & Risk", applicableTo: ["fraud_detection", "credit_scoring"] },
  { id: "sanctions_check", name: "Sanctions List Check", category: "Fraud & Risk", applicableTo: ["fraud_detection", "compliance"] },
  { id: "min_credit_score", name: "Minimum Credit Score", category: "Credit-Specific", applicableTo: ["credit_scoring"] },
  { id: "debt_to_income_ratio", name: "Debt-to-Income Ratio", category: "Credit-Specific", applicableTo: ["credit_scoring"] },
  { id: "claim_type_allowlist", name: "Claim Type Allowlist", category: "Claims-Specific", applicableTo: ["claims"] },
  { id: "watchlist_screening", name: "Watchlist Screening", category: "Compliance-Specific", applicableTo: ["compliance"] },
  { id: "approved_bank_accounts", name: "Approved Bank Accounts", category: "Payment-Specific", applicableTo: ["payment", "procurement", "treasury"] },
];

const RULES_BY_TYPE: Record<string, string[]> = {
  payment: ["maxAmount", "approvedEntities", "blockWeekends", "businessHoursOnly", "firstTimeHold", "mfaThreshold", "softBlockPercent", "daily_limit", "weekly_limit", "monthly_limit", "per_entity_daily_limit", "blocked_entities", "entity_velocity", "holiday_restriction", "country_allowlist", "country_denylist", "approved_bank_accounts"],
  fraud_detection: ["maxAmount", "approvedEntities", "firstTimeHold", "daily_limit", "weekly_limit", "monthly_limit", "blocked_entities", "country_allowlist", "country_denylist", "risk_score_threshold", "sanctions_check"],
  credit_scoring: ["maxAmount", "firstTimeHold", "mfaThreshold", "daily_limit", "weekly_limit", "monthly_limit", "blocked_entities", "country_allowlist", "country_denylist", "risk_score_threshold", "min_credit_score", "debt_to_income_ratio"],
  claims: ["maxAmount", "firstTimeHold", "daily_limit", "weekly_limit", "monthly_limit", "blocked_entities", "claim_type_allowlist"],
  procurement: ["maxAmount", "approvedEntities", "blockWeekends", "businessHoursOnly", "firstTimeHold", "mfaThreshold", "daily_limit", "weekly_limit", "monthly_limit", "per_entity_daily_limit", "blocked_entities", "entity_velocity", "holiday_restriction", "country_allowlist", "country_denylist", "approved_bank_accounts"],
  treasury: ["maxAmount", "approvedEntities", "mfaThreshold", "daily_limit", "weekly_limit", "monthly_limit", "blocked_entities", "country_allowlist", "country_denylist", "approved_bank_accounts"],
  compliance: ["approvedEntities", "firstTimeHold", "blocked_entities", "country_allowlist", "country_denylist", "sanctions_check", "watchlist_screening"],
};

const POLICY_TEMPLATES_BY_TYPE: Record<string, any> = {
  payment: {
    name: "Standard Payment Policy",
    status: "active",
    maxAmount: 50000,
    approvedEntities: ["Coastal Freight Ltd", "City Couriers", "FastShip SA"],
    blockWeekends: true,
    businessHoursOnly: true,
    firstTimeHold: true,
    mfaThreshold: 25000,
    softBlockPercent: 80,
  },
  fraud_detection: {
    name: "Fraud Detection Policy",
    status: "active",
    maxAmount: 100000,
    approvedEntities: [],
    firstTimeHold: false,
    risk_score_threshold: 85,
  },
  credit_scoring: {
    name: "Credit Scoring Policy",
    status: "active",
    maxAmount: 500000,
    approvedEntities: [],
    firstTimeHold: true,
    mfaThreshold: 100000,
    min_credit_score: 650,
  },
  claims: {
    name: "Claims Processing Policy",
    status: "active",
    maxAmount: 25000,
    approvedEntities: [],
    firstTimeHold: true,
  },
  procurement: {
    name: "Procurement Policy",
    status: "active",
    maxAmount: 75000,
    approvedEntities: ["Office Supplies Co", "IT Hardware Ltd", "Cleaning Services Inc"],
    blockWeekends: true,
    businessHoursOnly: true,
    firstTimeHold: true,
    mfaThreshold: 50000,
  },
  treasury: {
    name: "Treasury Policy",
    status: "active",
    maxAmount: 1000000,
    approvedEntities: ["Global Bank", "Investment Fund Ltd", "Currency Exchange Co"],
    firstTimeHold: false,
    mfaThreshold: 250000,
  },
  compliance: {
    name: "Compliance Screening Policy",
    status: "active",
    approvedEntities: ["Verified Customer Ltd", "Trusted Partner Inc"],
    firstTimeHold: true,
  },
};

const getDefaultPolicies = () => {
  const defaultPolicies: Record<string, any[]> = {};
  Object.keys(POLICY_TEMPLATES_BY_TYPE).forEach((type: any) => {
    const id = `policy-${type}-default`;
    defaultPolicies[type] = [{ id, ...(POLICY_TEMPLATES_BY_TYPE as any)[type] }];
  });
  return defaultPolicies;
};

export default function Home() {

  const [toasts, setToasts] = useState<Array<{id: string, type: 'success' | 'error' | 'info', title: string, message: string}>>([]);
  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 5000);
  };
  const [publicKeyFp, setPublicKeyFp] = useState("");
  const [activeTab, setActiveTab] = useState("verify");
  const [decisionType, setDecisionType] = useState("payment");
  const [policies, setPolicies] = useState(getDefaultPolicies());
  const [currentPolicyId, setCurrentPolicyId] = useState<any>(null);
  const [policy, setPolicy] = useState<any>({ ...POLICY_TEMPLATES_BY_TYPE.payment });
  const [entityName, setEntityName] = useState("");
  const [amount, setAmount] = useState(0);
  const [agentId, setAgentId] = useState("");
  const [lastVIC, setLastVIC] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showRuleSelector, setShowRuleSelector] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/public-key`).then(res => setPublicKeyFp(res.data.fingerprint)).catch(() => {});
    
    const savedPolicies = localStorage.getItem("payreality_policies");
    if (savedPolicies) {
      setPolicies(JSON.parse(savedPolicies));
    } else {
      const defaults = getDefaultPolicies();
      setPolicies(defaults);
      localStorage.setItem("payreality_policies", JSON.stringify(defaults));
    }
    
    const savedHistory = localStorage.getItem("payreality_history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    
    const savedCurrentPolicy = localStorage.getItem(`payreality_current_policy_${decisionType}`);
    if (savedCurrentPolicy) {
      setCurrentPolicyId(savedCurrentPolicy);
      const typePolicies = policies[decisionType] || [];
      const found = typePolicies.find(p => p.id === savedCurrentPolicy);
      if (found) {
        setPolicy(found);
      } else {
        const defaultPolicy = POLICY_TEMPLATES_BY_TYPE[decisionType] || POLICY_TEMPLATES_BY_TYPE.payment;
        setPolicy(defaultPolicy);
      }
    } else {
      const defaultPolicy = POLICY_TEMPLATES_BY_TYPE[decisionType] || POLICY_TEMPLATES_BY_TYPE.payment;
      setPolicy(defaultPolicy);
    }
  }, [decisionType, policies, isInitialized]);

  const savePolicyAs = (status: any) => {
    if (!policy.name || policy.name.trim() === "") {
      addToast("error", "SYSTEM_ALERT", "Please enter a policy name");
      return;
    }
    
    const policyToSave = { ...policy, status, lastModified: new Date().toISOString() };
    
    let updatedTypePolicies = [...(policies[decisionType] || [])];
    if (currentPolicyId) {
      updatedTypePolicies = updatedTypePolicies.map(p => p.id === currentPolicyId ? { ...policyToSave, id: currentPolicyId } : p);
    } else {
      const newId = `policy-${decisionType}-${Date.now()}`;
      updatedTypePolicies.push({ ...policyToSave, id: newId });
      setCurrentPolicyId(newId);
    }
    
    const updatedPolicies = { ...policies, [decisionType]: updatedTypePolicies };
    setPolicies(updatedPolicies);
    localStorage.setItem("payreality_policies", JSON.stringify(updatedPolicies));
    localStorage.setItem(`payreality_current_policy_${decisionType}`, currentPolicyId || updatedTypePolicies[updatedTypePolicies.length-1].id);
    addToast("info", "SYSTEM_NOTIFICATION", `Policy "${policy.name}" ${status === "active" ? "published" : "saved as draft"}`);
    setShowTemplateSelector(false);
    setIsCreatingNew(false);
    setShowRuleSelector(false);
  };

  const loadTemplate = () => {
    const template = POLICY_TEMPLATES_BY_TYPE[decisionType];
    if (template) {
      setPolicy({ ...template, status: "draft" });
      setCurrentPolicyId(null);
      setShowTemplateSelector(false);
    }
  };

  const loadExistingPolicy = (policyToLoad: any) => {
    setPolicy(policyToLoad);
    setCurrentPolicyId(policyToLoad.id);
    setShowTemplateSelector(false);
    setIsCreatingNew(false);
    setShowRuleSelector(false);
  };

  const createNewPolicy = () => {
    const basePolicy: any = { name: "", status: "draft", approvedEntities: [] };
    if (RULES_BY_TYPE[decisionType].includes("maxAmount")) basePolicy.maxAmount = 50000;
    if (RULES_BY_TYPE[decisionType].includes("blockWeekends")) basePolicy.blockWeekends = false;
    if (RULES_BY_TYPE[decisionType].includes("businessHoursOnly")) basePolicy.businessHoursOnly = false;
    if (RULES_BY_TYPE[decisionType].includes("firstTimeHold")) basePolicy.firstTimeHold = false;
    if (RULES_BY_TYPE[decisionType].includes("mfaThreshold")) basePolicy.mfaThreshold = 25000;
    setPolicy(basePolicy);
    setCurrentPolicyId(null);
    setIsCreatingNew(true);
    setShowTemplateSelector(false);
    setShowRuleSelector(false);
  };

  const addRuleToPolicy = (ruleId: any) => {
    const rule = AVAILABLE_RULES.find(r => r.id === ruleId);
    if (!rule) return;
    
    let defaultValue;
    switch (ruleId) {
      case "daily_limit": defaultValue = 100000; break;
      case "weekly_limit": defaultValue = 500000; break;
      case "monthly_limit": defaultValue = 1000000; break;
      case "per_entity_daily_limit": defaultValue = 50000; break;
      case "blocked_entities": defaultValue = []; break;
      case "entity_velocity": defaultValue = 10; break;
      case "holiday_restriction": defaultValue = true; break;
      case "country_allowlist": defaultValue = []; break;
      case "country_denylist": defaultValue = []; break;
      case "risk_score_threshold": defaultValue = 80; break;
      case "sanctions_check": defaultValue = true; break;
      case "min_credit_score": defaultValue = 600; break;
      case "debt_to_income_ratio": defaultValue = 0.4; break;
      case "claim_type_allowlist": defaultValue = []; break;
      case "watchlist_screening": defaultValue = true; break;
      case "approved_bank_accounts": defaultValue = []; break;
      default: defaultValue = true;
    }
    
    setPolicy({ ...policy, [ruleId]: defaultValue });
    setShowRuleSelector(false);
  };

  const removeRuleFromPolicy = (ruleId: any) => {
    const newPolicy = { ...policy };
    delete newPolicy[ruleId];
    setPolicy(newPolicy);
  };

  const deletePolicy = (policyId: any) => {
    const typePolicies = policies[decisionType] || [];
    if (typePolicies.length <= 1) {
      addToast("error", "SYSTEM_ALERT", "You must keep at least one policy for this decision type");
      return;
    }
    const updatedTypePolicies = typePolicies.filter(p => p.id !== policyId);
    const updatedPolicies = { ...policies, [decisionType]: updatedTypePolicies };
    setPolicies(updatedPolicies);
    localStorage.setItem("payreality_policies", JSON.stringify(updatedPolicies));
    if (currentPolicyId === policyId) {
      const firstPolicy = updatedTypePolicies[0];
      setPolicy(firstPolicy);
      setCurrentPolicyId(firstPolicy.id);
      localStorage.setItem(`payreality_current_policy_${decisionType}`, firstPolicy.id);
    }
    addToast("error", "SYSTEM_ALERT", "Policy deleted");
  };

  const handleDecisionTypeChange = (newType: any) => {
    setDecisionType(newType);
    const typePolicies = policies[newType] || [];
    if (typePolicies.length > 0) {
      const firstPolicy = typePolicies[0];
      setPolicy(firstPolicy);
      setCurrentPolicyId(firstPolicy.id);
    } else {
      const defaultPolicy = { ...POLICY_TEMPLATES_BY_TYPE[newType] };
      setPolicy(defaultPolicy);
      setCurrentPolicyId(null);
    }
    setEntityName("");
    setAmount(0);
    setLastVIC(null);
    setShowRuleSelector(false);
  };

  const verifyDecision = async () => {
    if (!entityName) {
      addToast("error", "SYSTEM_ALERT", "Please enter entity name");
      return;
    }
    
    const activeRules = RULES_BY_TYPE[decisionType];
    if (activeRules.includes("maxAmount") && amount <= 0) {
      addToast("error", "SYSTEM_ALERT", "Please enter a valid amount");
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        vendor: entityName,
        amount: amount,
        agent_id: agentId || null,
        decision_type: decisionType,
        policy: {
          name: policy.name,
          maxAmount: policy.maxAmount || 0,
          approvedEntities: policy.approvedEntities || [],
          blockWeekends: policy.blockWeekends || false,
          businessHoursOnly: policy.businessHoursOnly || false,
          firstTimeHold: policy.firstTimeHold || false,
          mfaThreshold: policy.mfaThreshold || 0,
          daily_limit: policy.daily_limit || 0,
          weekly_limit: policy.weekly_limit || 0,
          monthly_limit: policy.monthly_limit || 0,
          risk_score_threshold: policy.risk_score_threshold || 0,
          min_credit_score: policy.min_credit_score || 0,
        }
      };
      const res = await axios.post(`${API_URL}/api/verify`, payload);
      setLastVIC(res.data);
      const newHistory = [res.data, ...history].slice(0, 200);
      setHistory(newHistory);
      localStorage.setItem("payreality_history", JSON.stringify(newHistory));
      addToast("info", "SYSTEM_NOTIFICATION", `${decisionType.replace('_', ' ').toUpperCase()} ${res.data.approved ? "APPROVED" : "BLOCKED"}`);
    } catch (err) { 
      console.error("Verification error:", err);
      addToast("error", "SYSTEM_ALERT", "Error verifying decision");
    }
    setLoading(false);
  };

  const runSimulation = async () => {
    setLoading(true);
    setSimulationResults([]);
    const testCases = [
      { entity: "Coastal Freight Ltd", amount: 42500, type: "payment" },
      { entity: "Unknown Trading", amount: 75000, type: "payment" },
      { entity: "Customer #12345", amount: 2500, type: "fraud_detection" },
      { entity: "Suspicious Transaction", amount: 50000, type: "fraud_detection" },
      { entity: "Loan Applicant A", amount: 250000, type: "credit_scoring" },
      { entity: "High Risk Borrower", amount: 750000, type: "credit_scoring" },
      { entity: "Claim #ABC123", amount: 15000, type: "claims" },
      { entity: "Claim #DEF456", amount: 35000, type: "claims" },
      { entity: "Office Furniture Ltd", amount: 45000, type: "procurement" },
      { entity: "Unregistered Vendor", amount: 80000, type: "procurement" },
      { entity: "Global Bank Transfer", amount: 500000, type: "treasury" },
      { entity: "High Value Wire", amount: 1500000, type: "treasury" },
      { entity: "Sanctions Check", amount: 0, type: "compliance" },
      { entity: "PEP Screening", amount: 0, type: "compliance" },
    ];
    
    const results = [];
    let allVICs = [...history];
    
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      await new Promise(r => setTimeout(r, 200));
      try {
        const typePolicies = policies[tc.type] || [];
        const policyToUse = typePolicies.length > 0 ? typePolicies[0] : POLICY_TEMPLATES_BY_TYPE[tc.type];
        
        const payload = {
          vendor: tc.entity,
          amount: tc.amount,
          agent_id: "AI-Simulator",
          decision_type: tc.type,
          policy: {
            name: policyToUse.name,
            maxAmount: policyToUse.maxAmount || 0,
            approvedEntities: policyToUse.approvedEntities || [],
            blockWeekends: policyToUse.blockWeekends || false,
            businessHoursOnly: policyToUse.businessHoursOnly || false,
            firstTimeHold: policyToUse.firstTimeHold || false,
            mfaThreshold: policyToUse.mfaThreshold || 0,
          }
        };
        const res = await axios.post(`${API_URL}/api/verify`, payload);
        const resultWithType = { ...res.data, decision_type: tc.type };
        results.push(resultWithType);
        setSimulationResults([...results]);
        allVICs = [resultWithType, ...allVICs];
        setHistory(allVICs.slice(0, 200));
        localStorage.setItem("payreality_history", JSON.stringify(allVICs.slice(0, 200)));
      } catch(e) { 
        console.error("Simulation error:", e);
      }
    }
    setLoading(false);
    const approvedCount = results.filter(r => r.approved).length;
    const blockedCount = results.filter(r => !r.approved).length;
    addToast("info", "SYSTEM_NOTIFICATION", `Simulation complete: ${approvedCount} approved, ${blockedCount} blocked. All saved to audit log.`);
  };

  const getDecisionLabel = (type: any) => {
    const found = DECISION_TYPES.find(d => d.value === type);
    return found ? found.label : type;
  };

  const TabButton = ({ id, label }: any) => (
    <button onClick={() => setActiveTab(id)} className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === id ? "bg-[var(--accent-red)] text-[var(--text-primary)] shadow-md" : "bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.1)]"}`}>
      {label}
    </button>
  );

  const activeRules = RULES_BY_TYPE[decisionType] || [];
  const showAmountField = activeRules.includes("maxAmount");
  const showAmountLabel = decisionType === "credit_scoring" ? "Loan Amount" : (decisionType === "claims" ? "Claim Amount" : "Amount");
  
  const availableRulesForType = AVAILABLE_RULES.filter(rule => rule.applicableTo.includes(decisionType));
  const alreadyAddedRules = Object.keys(policy).filter(key => AVAILABLE_RULES.some(r => r.id === key));
  const rulesToAdd = availableRulesForType.filter(rule => !alreadyAddedRules.includes(rule.id) && rule.id !== "name" && rule.id !== "approvedEntities" && rule.id !== "status");

  const typePolicies = policies[decisionType] || [];
  const activePolicies = typePolicies.filter(p => p.status === "active");
  const draftPolicies = typePolicies.filter(p => p.status === "draft");
  const displayedPolicies = showDrafts ? typePolicies : activePolicies;

  return (
    <div className="min-h-screen bg-transparent">

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex flex-col">
              <span className="font-body font-extrabold text-4xl text-[var(--text-primary)] tracking-tight">PayReality</span>
              <span className="font-mono text-xs text-primary tracking-[0.2em] mt-1">VERIFIABLE INTENT CERTIFICATE</span>
            </div>
            <div className="flex gap-2 mt-2 text-xs text-[var(--text-muted)] font-mono">
              <span>Provisional Patent PPN00002476</span>
              <span>Ed25519 Signatures</span>
              <span>Public Key FP: {publicKeyFp}</span>
            </div>
          </div>
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
            <Link href="/history" className="px-4 py-2 bg-[#111623] border border-white/10 text-[var(--text-primary)] rounded-lg text-sm font-mono hover:bg-white/5 transition">
              Decision Queue
            </Link>
          </div>
        </div>

        <div className="flex gap-3 mb-8 border-b border-white/10 pb-4">
          <TabButton id="policy" label="Policy Manager" />
          <TabButton id="verify" label="Verify Decision" />
          <TabButton id="simulate" label="AI Simulator" />
          <TabButton id="audit" label="Audit Log" />
        </div>

        {activeTab === "policy" && (
          <div className="space-y-6">
            <div className="glass-panel p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold font-display text-[var(--text-primary)]">Decision Type</h2>
                <select style={{backgroundColor:"rgba(255,255,255,0.05)", color:"white"}} 
                  value={decisionType} 
                  onChange={(e) => handleDecisionTypeChange(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg"
                >
                  {DECISION_TYPES.map(type => (
                    <option style={{color:"black"}} key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold font-display text-[var(--text-primary)]">My Policies</h2>
                  <button 
                    onClick={() => setShowDrafts(!showDrafts)} 
                    className={`text-xs px-2 py-1 rounded ${showDrafts ? "bg-blue-100 text-blue-700" : "bg-white/5 text-[var(--text-muted)]"}`}
                  >
                    {showDrafts ? "Hide Drafts" : "Show Drafts"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowTemplateSelector(!showTemplateSelector)} className="px-3 py-1.5 text-sm bg-white/5 rounded-lg hover:bg-white/10">Use Template</button>
                  <button onClick={createNewPolicy} className="form-action" >New Policy</button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {displayedPolicies.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => loadExistingPolicy(p)} 
                    className={`px-3 py-1.5 text-sm rounded-lg transition flex items-center gap-2 ${currentPolicyId === p.id ? "bg-[#D94028]/20 text-[#D94028] border border-[#D94028]/50" : "bg-white/5 text-[var(--text-muted)] hover:bg-white/10"}`}
                  >
                    {p.name}
                    {p.status === "draft" && <span className="text-xs bg-yellow-200 text-yellow-800 px-1 rounded">Draft</span>}
                    {displayedPolicies.length > 1 && (
                      <span onClick={(e) => { e.stopPropagation(); deletePolicy(p.id); }} className="ml-1 text-red-500 hover:text-red-700">x</span>
                    )}
                  </button>
                ))}
                {draftPolicies.length > 0 && !showDrafts && (
                  <button onClick={() => setShowDrafts(true)} className="px-3 py-1.5 text-xs bg-white/5 text-[#9CA3AF] rounded-lg">
                    +{draftPolicies.length} draft(s)
                  </button>
                )}
              </div>
              
              {showTemplateSelector && (
                <div className="mb-4 p-4 bg-transparent rounded-lg border border-white/10">
                  <p className="text-sm font-medium mb-2">Reset to default template for {getDecisionLabel(decisionType)}</p>
                  <button onClick={loadTemplate} className="px-3 py-1.5 text-sm bg-transparent border border-white/10 rounded-lg hover:bg-transparent">
                    Load Default Template
                  </button>
                </div>
              )}
            </div>

            <div className="glass-panel p-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold font-display text-[var(--text-primary)] mb-0">{isCreatingNew ? "Create New Policy" : "Edit Policy"}</h2>
                {rulesToAdd.length > 0 && !showRuleSelector && (
                  <button onClick={() => setShowRuleSelector(true)} className="px-3 py-1.5 text-sm bg-green-600 text-[var(--text-primary)] rounded-lg hover:bg-green-700">
                    + Add Rule
                  </button>
                )}
              </div>
              <p className="text-[#9CA3AF] text-sm mb-6">For: {getDecisionLabel(decisionType)}</p>
              {policy.status === "draft" && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  This policy is a draft. It is not yet active for decision verification.
                </div>
              )}
              
              {showRuleSelector && (
                <div className="mb-6 p-4 bg-transparent rounded-lg border border-white/10">
                  <h3 className="text-sm font-semibold mb-3">Add a rule to this policy:</h3>
                  <div className="flex flex-wrap gap-2">
                    {rulesToAdd.map(rule => (
                      <button
                        key={rule.id}
                        onClick={() => addRuleToPolicy(rule.id)}
                        className="px-3 py-1.5 text-xs bg-transparent border border-white/10 rounded-lg hover:bg-white/5"
                      >
                        {rule.name}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowRuleSelector(false)} className="mt-3 text-xs text-[#9CA3AF] hover:text-[var(--text-body)]">Cancel</button>
                </div>
              )}
              
              <div className="space-y-5">
                <div>
                  <label className="form-label">Policy Name</label>
                  <input type="text" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={policy.name} onChange={e => setPolicy({...policy, name: e.target.value})} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                </div>
                
                {activeRules.includes("maxAmount") && (
                  <div>
                    <label className="form-label">Max Amount per Decision</label>
                    <input type="number" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={policy.maxAmount || 0} onChange={e => setPolicy({...policy, maxAmount: parseInt(e.target.value) || 0})} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                  </div>
                )}
                
                {policy.daily_limit !== undefined && (
                  <div>
                    <label className="form-label">Daily Total Limit</label>
                    <input type="number" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={policy.daily_limit} onChange={e => setPolicy({...policy, daily_limit: parseInt(e.target.value) || 0})} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                    <button onClick={() => removeRuleFromPolicy("daily_limit")} className="text-xs text-red-500 mt-1 hover:text-red-700">Remove rule</button>
                  </div>
                )}
                
                {policy.weekly_limit !== undefined && (
                  <div>
                    <label className="form-label">Weekly Total Limit</label>
                    <input type="number" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={policy.weekly_limit} onChange={e => setPolicy({...policy, weekly_limit: parseInt(e.target.value) || 0})} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                    <button onClick={() => removeRuleFromPolicy("weekly_limit")} className="text-xs text-red-500 mt-1 hover:text-red-700">Remove rule</button>
                  </div>
                )}
                
                {policy.monthly_limit !== undefined && (
                  <div>
                    <label className="form-label">Monthly Total Limit</label>
                    <input type="number" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={policy.monthly_limit} onChange={e => setPolicy({...policy, monthly_limit: parseInt(e.target.value) || 0})} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                    <button onClick={() => removeRuleFromPolicy("monthly_limit")} className="text-xs text-red-500 mt-1 hover:text-red-700">Remove rule</button>
                  </div>
                )}
                
                {activeRules.includes("mfaThreshold") && (
                  <div>
                    <label className="form-label">MFA Threshold</label>
                    <input type="number" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={policy.mfaThreshold || 0} onChange={e => setPolicy({...policy, mfaThreshold: parseInt(e.target.value) || 0})} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                  </div>
                )}
                
                {policy.risk_score_threshold !== undefined && (
                  <div>
                    <label className="form-label">Risk Score Threshold (0-100)</label>
                    <input type="number" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={policy.risk_score_threshold} onChange={e => setPolicy({...policy, risk_score_threshold: parseInt(e.target.value) || 0})} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                    <button onClick={() => removeRuleFromPolicy("risk_score_threshold")} className="text-xs text-red-500 mt-1 hover:text-red-700">Remove rule</button>
                  </div>
                )}
                
                {policy.min_credit_score !== undefined && (
                  <div>
                    <label className="form-label">Minimum Credit Score</label>
                    <input type="number" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={policy.min_credit_score} onChange={e => setPolicy({...policy, min_credit_score: parseInt(e.target.value) || 0})} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                    <button onClick={() => removeRuleFromPolicy("min_credit_score")} className="text-xs text-red-500 mt-1 hover:text-red-700">Remove rule</button>
                  </div>
                )}
                
                <div>
                  <label className="form-label">Approved Entities (one per line)</label>
                  <textarea style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={(policy.approvedEntities || []).join('\n')} onChange={e => setPolicy({...policy, approvedEntities: e.target.value.split('\n').filter(v => v.trim())})} rows={4} className="w-full border border-white/10 rounded-xl px-4 py-2.5 font-mono text-sm" />
                  <p className="text-xs text-[var(--text-muted)] mt-1">Leave empty to allow all entities</p>
                </div>
                
                {policy.blocked_entities !== undefined && (
                  <div>
                    <label className="form-label">Blocked Entities (one per line)</label>
                    <textarea style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={(policy.blocked_entities || []).join('\n')} onChange={e => setPolicy({...policy, blocked_entities: e.target.value.split('\n').filter(v => v.trim())})} rows={3} className="w-full border border-white/10 rounded-xl px-4 py-2.5 font-mono text-sm" />
                    <button onClick={() => removeRuleFromPolicy("blocked_entities")} className="text-xs text-red-500 mt-1 hover:text-red-700">Remove rule</button>
                  </div>
                )}
                
                {activeRules.includes("blockWeekends") && (
                  <label className="flex items-center gap-2"><input type="checkbox" checked={policy.blockWeekends || false} onChange={e => setPolicy({...policy, blockWeekends: e.target.checked})} className="w-4 h-4" /> Block Weekends</label>
                )}
                
                {activeRules.includes("businessHoursOnly") && (
                  <label className="flex items-center gap-2"><input type="checkbox" checked={policy.businessHoursOnly || false} onChange={e => setPolicy({...policy, businessHoursOnly: e.target.checked})} className="w-4 h-4" /> Business Hours Only</label>
                )}
                
                {activeRules.includes("firstTimeHold") && (
                  <label className="flex items-center gap-2"><input type="checkbox" checked={policy.firstTimeHold || false} onChange={e => setPolicy({...policy, firstTimeHold: e.target.checked})} className="w-4 h-4" /> First-Time Entity Hold</label>
                )}
              </div>
              
              <div className="flex gap-3 mt-8">
                <button onClick={() => savePolicyAs("draft")} className="flex-1 bg-transparent border border-[rgba(255,255,255,0.1)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)] py-2.5 rounded font-mono text-xs font-bold tracking-[0.1em] transition">
                  // SAVE_AS_DRAFT
                </button>
                <button onClick={() => savePolicyAs("active")} className="form-action flex-1">
                  &gt; PUBLISH_POLICY
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "verify" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-panel p-8">
              <h2 className="text-xl font-semibold font-display text-[var(--text-primary)] mb-2">Verify Financial Decision</h2>
              <p className="text-[#9CA3AF] text-sm mb-6">Decision Type: {getDecisionLabel(decisionType)}</p>
              <p className="text-sm text-[var(--text-muted)] mb-4">Current Policy: <span className="font-medium">{policy.name}</span></p>
              {policy.status === "draft" && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  Warning: This policy is a draft. Publish it to use for verification.
                </div>
              )}
              <div className="space-y-5">
                <div>
                  <label className="form-label">Decision Type</label>
                  <select style={{backgroundColor:"rgba(255,255,255,0.05)", color:"white"}} value={decisionType} onChange={(e) => handleDecisionTypeChange(e.target.value)} className="w-full border border-white/10 rounded-xl px-4 py-2.5">
                    {DECISION_TYPES.map(type => (
                      <option style={{color:"black"}} key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="form-label">
                    {decisionType === "compliance" ? "Entity Name" : "Entity / Customer / Vendor"}
                  </label>
                  <input type="text" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={entityName} onChange={e => setEntityName(e.target.value)} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                </div>
                
                {showAmountField && (
                  <div>
                    <label className="form-label">{showAmountLabel}</label>
                    <input type="number" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                  </div>
                )}
                
                <div>
                  <label className="form-label">Agent ID (optional)</label>
                  <input type="text" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={agentId} onChange={e => setAgentId(e.target.value)} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                </div>
                
                <button onClick={verifyDecision} disabled={loading} className="form-action" >
                  {loading ? "Verifying..." : "Verify Decision"}
                </button>
              </div>
            </div>
            {lastVIC && (
              <div className={`system-toast w-full max-w-full ${lastVIC.approved ? 'status-success' : 'status-error'}`}>
                <svg className="toast-icon" viewBox="0 0 24 24">
                  {lastVIC.approved ? <use href="#icon-database"/> : <use href="#icon-shield-lock"/>}
                </svg>
                <div className="toast-content w-full">
                  <div className="toast-title">{lastVIC.approved ? "VERIFIABLE_INTENT_CERTIFICATE // APPROVED" : "EXCEPTION_THROWN // BLOCKED"}</div>
                  <div className="toast-message mt-4">
                    <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                      <div><span className="text-[var(--text-muted)]">Certificate ID:</span><br/>{lastVIC.vic_id}</div>
                      <div><span className="text-[var(--text-muted)]">Timestamp:</span><br/>{new Date(lastVIC.timestamp).toLocaleString()}</div>
                      <div><span className="text-[var(--text-muted)]">Entity:</span><br/>{lastVIC.vendor}</div>
                      {lastVIC.amount > 0 && <div><span className="text-[var(--text-muted)]">Amount:</span><br/>${lastVIC.amount.toLocaleString()}</div>}
                      <div><span className="text-[var(--text-muted)]">Policy:</span><br/>{lastVIC.policy_name}</div>
                    </div>
                    {lastVIC.reasons?.length > 0 && (
                      <div className="mt-4 p-3 border border-[var(--accent-red)] bg-[#D94028]/10 text-[var(--accent-red)] font-mono text-xs">
                        &gt; BLOCK_REASONS:<br/>
                        {lastVIC.reasons.map((r: any, i: number) => <div key={i}>- {r}</div>)}
                      </div>
                    )}
                    <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.1)] text-[9px] text-[var(--text-muted)] font-mono break-all">
                      ED25519_SIGNATURE: {lastVIC.signature?.slice(0, 64)}...
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "simulate" && (
          <div className="space-y-6">
            <div className="glass-panel p-8 text-center">
              <div className="w-16 h-16 bg-[#D94028]/10 border border-[var(--accent-red)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--accent-red)]">
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><use href="#icon-scan-network"/></svg>
              </div>
              <h2 className="text-xl font-semibold font-display mb-2">AI Simulator</h2>
              <p className="text-[#9CA3AF] text-sm mb-6">Current Policy: <span className="font-medium">{policy.name}</span></p>
              {policy.status === "draft" && (
                <p className="text-xs text-yellow-600 mb-4">Warning: Draft policy may not reflect intended rules.</p>
              )}
              <p className="text-xs text-[var(--text-muted)] mb-4">Simulates all 7 decision types with multiple test cases</p>
              <button onClick={runSimulation} disabled={loading} className="form-action mt-4 max-w-sm mx-auto flex justify-center items-center">
                {loading ? "> RUNNING_SIMULATION..." : "> EXECUTE_FULL_SIMULATION"}
              </button>
            </div>

            {simulationResults.length > 0 && (
              <div className="glass-panel overflow-hidden">
                <div className="px-6 py-4 bg-transparent border-b border-white/10 flex justify-between items-center">
                  <h3 className="font-semibold text-[var(--text-primary)]">Simulation Results (Saved to Queue)</h3>
                  <Link href="/history" className="text-sm text-primary hover:text-[#A8321C]">View Full Queue</Link>
                </div>
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {simulationResults.map((result, idx) => (
                    <div key={idx} className={`p-4 flex justify-between items-center ${result.approved ? "hover:bg-green-50" : "hover:bg-red-50"}`}>
                      <div className="flex-1">
                        <div className="font-medium text-[var(--text-primary)]">{result.vendor}</div>
                        <div className="text-sm text-[#9CA3AF]">${result.amount?.toLocaleString()} - {getDecisionLabel(result.decision_type)}</div>
                        <div className="text-xs text-[var(--text-muted)] font-mono">{result.vic_id?.slice(0, 20)}...</div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${result.approved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {result.approved ? "APPROVED" : "BLOCKED"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "audit" && (
          <div className="glass-panel p-8">
            <h2 className="text-xl font-semibold font-display mb-2">Audit Log</h2>
            <p className="text-[#9CA3AF] text-sm mb-6">Complete history of all AI financial decisions</p>
            {history.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">No decisions yet. Run the AI Simulator or verify a decision.</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.slice(0, 30).map((v,i) => (
                  <div key={i} className={`p-4 rounded-xl border cursor-pointer hover:shadow-md ${v.approved ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`} onClick={() => { setActiveTab("verify"); setLastVIC(v); setEntityName(v.vendor); setAmount(v.amount); setDecisionType(v.decision_type || "payment"); }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-mono ${v.approved ? "text-green-600" : "text-red-600"}`}>{v.vic_id}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${v.approved ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>{v.approved ? "APPROVED" : "BLOCKED"}</span>
                          <span className="text-xs text-[var(--text-muted)]">{getDecisionLabel(v.decision_type)}</span>
                        </div>
                        <p className="font-medium">{v.vendor}</p>
                        <p className="text-sm text-[#9CA3AF]">${v.amount?.toLocaleString()}</p>
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

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`system-toast status-${t.type}`}>
            
            <svg className="toast-icon" viewBox="0 0 24 24">
              {t.type === 'success' && <use href="#icon-database"/>}
              {t.type === 'error' && <use href="#icon-shield-lock"/>}
              {t.type === 'info' && <use href="#icon-scan-network"/>}
            </svg>

            <div className="toast-content">
              <div className="toast-title">{t.title}</div>
              <div className="toast-message">{t.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
