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
      alert("Please enter a policy name");
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
    alert(`Policy "${policy.name}" ${status === "active" ? "published" : "saved as draft"}`);
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
      alert("You must keep at least one policy for this decision type");
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
    alert("Policy deleted");
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
      alert("Please enter entity name");
      return;
    }
    
    const activeRules = RULES_BY_TYPE[decisionType];
    if (activeRules.includes("maxAmount") && amount <= 0) {
      alert("Please enter a valid amount");
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
      alert(`${decisionType.replace('_', ' ').toUpperCase()} ${res.data.approved ? "APPROVED" : "BLOCKED"}`);
    } catch (err) { 
      console.error("Verification error:", err);
      alert("Error verifying decision");
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
    alert(`Simulation complete: ${approvedCount} approved, ${blockedCount} blocked. All saved to audit log.`);
  };

  const getDecisionLabel = (type: any) => {
    const found = DECISION_TYPES.find(d => d.value === type);
    return found ? found.label : type;
  };

  const TabButton = ({ id, label }: any) => (
    <button onClick={() => setActiveTab(id)} className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === id ? "bg-primary text-white shadow-md" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}>
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

      <div id="global-brand-preloader" className="fixed inset-0 bg-[#0a0e17] z-[999999] flex flex-col items-center justify-center transition-opacity duration-600" style={{opacity: isInitialized ? 0 : 1, pointerEvents: isInitialized ? 'none' : 'auto'}}>
        <div className="relative w-[140px] h-[140px] flex items-center justify-center overflow-hidden rounded bg-[#111623] border border-white/5">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#D94028] shadow-[0_0_20px_5px_rgba(217,64,40,0.95)] animate-[preloaderScanSweep_2.2s_linear_infinite_alternate] z-10"></div>
          <svg className="w-[90px] h-[90px] fill-white animate-[preloaderEyePulse_3s_ease-in-out_infinite_alternate]" viewBox="0 0 1600 1300">
             <path d="M854.35.01l42.66,3.02c358.52,31.7,669.05,301,742.73,663.38l3.25,19.26v34.13c-1.34,5.98-1.95,12.11-3.42,18.08-24.61,100.06-146.48,139.88-227.39,81.12-58.67-42.6-54.42-93.91-73.98-157.19-71.22-230.41-273.72-366.45-506.93-369.63-246.47-3.36-462.98,142.48-531.6,388.47-14.54,52.14-13.75,105.13-69.79,130.36-71.29,32.1-198.85,2.84-224.49-81.16-2.23-7.28-2.62-15.28-5.38-22.1v-20.08c1.41-1.2,1.55-2.95,1.84-4.64C66.47,300.04,412.69,11.66,789.21,1.05l2.37-1.05h62.78ZM796.28,34.45C457.94,44.42,148.04,277.62,52.48,611.4c-8.34,29.13-23.74,79.18-15.14,107.86,18.65,62.22,115.25,80,168.64,64.3,48.54-14.26,47.36-58.34,58.16-100.1,69.34-268.15,300.6-428.95,568.11-425.39,252.48,3.36,469.69,154.74,541.49,405.53,12.95,45.22,11.81,87.31,49.02,120.49,64.74,57.73,174.66,22.19,186.75-66.93,4.07-29.98-8.63-74.3-17.03-103.76C1497.53,280.27,1184.73,41.29,846.06,34.11l-49.78.33h0Z"/>
             <path d="M853.37,1250.87h-58.85c-229.12-18.7-387.65-232.7-344.97-464.99,7.41-40.33,29.13-103.11,54.21-135.25,10.02-12.85,25.52-16.45,36.23-2.11,12.27,16.43-3.6,31.09-11.11,44.89-120.9,221.98,23.8,493.64,269.07,513.29,96.86,7.76,204.85-31.49,269.74-106.39,11.97-13.82,29.62-48.12,51.98-31.13,21.71,16.5-3.47,42.6-15.68,56.23-62.97,70.31-156.85,119.55-250.63,125.48Z"/>
          </svg>
        </div>
        <div className="mt-6 font-mono text-[11px] text-[#9CA3AF] text-center tracking-[0.1em]">
          <span className="text-[#D94028] font-bold">&gt; INITIALIZING_BRAND_CORE</span><br/>
        </div>
      </div>
    
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold font-display text-white">PayReality</h1>
            <p className="text-[#9CA3AF] mt-1">Verifiable Intent Certificates for AI Financial Decisions</p>
            <div className="flex gap-2 mt-2 text-xs text-gray-400 font-mono">
              <span>Provisional Patent PPN00002476</span>
              <span>Ed25519 Signatures</span>
              <span>Public Key FP: {publicKeyFp}</span>
            </div>
          </div>
          <Link href="/history" className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900">
            Decision Queue
          </Link>
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
                <h2 className="text-lg font-semibold font-display text-white">Decision Type</h2>
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
                  <h2 className="text-lg font-semibold font-display text-white">My Policies</h2>
                  <button 
                    onClick={() => setShowDrafts(!showDrafts)} 
                    className={`text-xs px-2 py-1 rounded ${showDrafts ? "bg-blue-100 text-blue-700" : "bg-white/5 text-gray-400"}`}
                  >
                    {showDrafts ? "Hide Drafts" : "Show Drafts"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowTemplateSelector(!showTemplateSelector)} className="px-3 py-1.5 text-sm bg-white/5 rounded-lg hover:bg-white/10">Use Template</button>
                  <button onClick={createNewPolicy} className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-[#A8321C]">New Policy</button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {displayedPolicies.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => loadExistingPolicy(p)} 
                    className={`px-3 py-1.5 text-sm rounded-lg transition flex items-center gap-2 ${currentPolicyId === p.id ? "bg-[#D94028]/20 text-[#D94028] border border-[#D94028]/50" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
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
                <h2 className="text-xl font-semibold font-display text-white mb-0">{isCreatingNew ? "Create New Policy" : "Edit Policy"}</h2>
                {rulesToAdd.length > 0 && !showRuleSelector && (
                  <button onClick={() => setShowRuleSelector(true)} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
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
                  <button onClick={() => setShowRuleSelector(false)} className="mt-3 text-xs text-[#9CA3AF] hover:text-gray-300">Cancel</button>
                </div>
              )}
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Policy Name</label>
                  <input type="text" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={policy.name} onChange={e => setPolicy({...policy, name: e.target.value})} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                </div>
                
                {activeRules.includes("maxAmount") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Max Amount per Decision</label>
                    <input type="number" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={policy.maxAmount || 0} onChange={e => setPolicy({...policy, maxAmount: parseInt(e.target.value) || 0})} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                  </div>
                )}
                
                {policy.daily_limit !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Daily Total Limit</label>
                    <input type="number" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={policy.daily_limit} onChange={e => setPolicy({...policy, daily_limit: parseInt(e.target.value) || 0})} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                    <button onClick={() => removeRuleFromPolicy("daily_limit")} className="text-xs text-red-500 mt-1 hover:text-red-700">Remove rule</button>
                  </div>
                )}
                
                {policy.weekly_limit !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Weekly Total Limit</label>
                    <input type="number" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={policy.weekly_limit} onChange={e => setPolicy({...policy, weekly_limit: parseInt(e.target.value) || 0})} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                    <button onClick={() => removeRuleFromPolicy("weekly_limit")} className="text-xs text-red-500 mt-1 hover:text-red-700">Remove rule</button>
                  </div>
                )}
                
                {policy.monthly_limit !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Monthly Total Limit</label>
                    <input type="number" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={policy.monthly_limit} onChange={e => setPolicy({...policy, monthly_limit: parseInt(e.target.value) || 0})} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                    <button onClick={() => removeRuleFromPolicy("monthly_limit")} className="text-xs text-red-500 mt-1 hover:text-red-700">Remove rule</button>
                  </div>
                )}
                
                {activeRules.includes("mfaThreshold") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">MFA Threshold</label>
                    <input type="number" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={policy.mfaThreshold || 0} onChange={e => setPolicy({...policy, mfaThreshold: parseInt(e.target.value) || 0})} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                  </div>
                )}
                
                {policy.risk_score_threshold !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Risk Score Threshold (0-100)</label>
                    <input type="number" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={policy.risk_score_threshold} onChange={e => setPolicy({...policy, risk_score_threshold: parseInt(e.target.value) || 0})} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                    <button onClick={() => removeRuleFromPolicy("risk_score_threshold")} className="text-xs text-red-500 mt-1 hover:text-red-700">Remove rule</button>
                  </div>
                )}
                
                {policy.min_credit_score !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Minimum Credit Score</label>
                    <input type="number" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={policy.min_credit_score} onChange={e => setPolicy({...policy, min_credit_score: parseInt(e.target.value) || 0})} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                    <button onClick={() => removeRuleFromPolicy("min_credit_score")} className="text-xs text-red-500 mt-1 hover:text-red-700">Remove rule</button>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Approved Entities (one per line)</label>
                  <textarea style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={(policy.approvedEntities || []).join('\n')} onChange={e => setPolicy({...policy, approvedEntities: e.target.value.split('\n').filter(v => v.trim())})} rows={4} className="w-full border border-white/10 rounded-xl px-4 py-2.5 font-mono text-sm" />
                  <p className="text-xs text-gray-400 mt-1">Leave empty to allow all entities</p>
                </div>
                
                {policy.blocked_entities !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Blocked Entities (one per line)</label>
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
                <button onClick={() => savePolicyAs("draft")} className="flex-1 bg-gray-200 text-gray-300 py-2.5 rounded-xl font-medium hover:bg-gray-300">
                  Save as Draft
                </button>
                <button onClick={() => savePolicyAs("active")} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-[#A8321C]">
                  Publish
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "verify" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-panel p-8">
              <h2 className="text-xl font-semibold font-display text-white mb-2">Verify Financial Decision</h2>
              <p className="text-[#9CA3AF] text-sm mb-6">Decision Type: {getDecisionLabel(decisionType)}</p>
              <p className="text-sm text-gray-400 mb-4">Current Policy: <span className="font-medium">{policy.name}</span></p>
              {policy.status === "draft" && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  Warning: This policy is a draft. Publish it to use for verification.
                </div>
              )}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Decision Type</label>
                  <select style={{backgroundColor:"rgba(255,255,255,0.05)", color:"white"}} value={decisionType} onChange={(e) => handleDecisionTypeChange(e.target.value)} className="w-full border border-white/10 rounded-xl px-4 py-2.5">
                    {DECISION_TYPES.map(type => (
                      <option style={{color:"black"}} key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {decisionType === "compliance" ? "Entity Name" : "Entity / Customer / Vendor"}
                  </label>
                  <input type="text" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={entityName} onChange={e => setEntityName(e.target.value)} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                </div>
                
                {showAmountField && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">{showAmountLabel}</label>
                    <input type="number" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={amount} onChange={e => setAmount(parseFloat(e.target.value) || 0)} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Agent ID (optional)</label>
                  <input type="text" style={{backgroundColor:"rgba(255,255,255,0.05)"}} value={agentId} onChange={e => setAgentId(e.target.value)} className="w-full border border-white/10 rounded-xl px-4 py-2.5" />
                </div>
                
                <button onClick={verifyDecision} disabled={loading} className="w-full bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-[#A8321C] disabled:opacity-50">
                  {loading ? "Verifying..." : "Verify Decision"}
                </button>
              </div>
            </div>
            {lastVIC && (
              <div className={`rounded-2xl border-2 p-8 ${lastVIC.approved ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}>
                <div className="text-center border-b pb-4 mb-4">
                  <div className="inline-block bg-transparent px-4 py-1 rounded-full text-xs font-mono">VERIFIABLE INTENT CERTIFICATE</div>
                  <div className={`text-2xl font-bold font-display mt-3 ${lastVIC.approved ? "text-green-600" : "text-red-600"}`}>{lastVIC.approved ? "APPROVED" : "BLOCKED"}</div>
                  <div className="text-xs text-gray-400 mt-1">{getDecisionLabel(lastVIC.decision_type)}</div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b"><span className="text-[#9CA3AF]">Certificate ID</span><span className="font-mono text-sm">{lastVIC.vic_id}</span></div>
                  <div className="flex justify-between py-2 border-b"><span className="text-[#9CA3AF]">Timestamp</span><span>{new Date(lastVIC.timestamp).toLocaleString()}</span></div>
                  <div className="flex justify-between py-2 border-b"><span className="text-[#9CA3AF]">Entity</span><span>{lastVIC.vendor}</span></div>
                  {lastVIC.amount > 0 && <div className="flex justify-between py-2 border-b"><span className="text-[#9CA3AF]">Amount</span><span>${lastVIC.amount.toLocaleString()}</span></div>}
                  <div className="flex justify-between py-2 border-b"><span className="text-[#9CA3AF]">Policy Applied</span><span>{lastVIC.policy_name}</span></div>
                </div>
                {lastVIC.reasons?.length > 0 && (
                  <div className="bg-red-100 rounded-xl p-4 mt-4">
                    <div className="font-semibold text-red-700 text-sm mb-1">Block Reasons</div>
                    <ul className="list-disc list-inside text-red-600 text-sm">
                      {lastVIC.reasons.map((r: any, i: number) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
                <div className="mt-4 pt-3 border-t">
                  <div className="text-xs text-gray-400 font-mono break-all">
                    <span className="font-semibold">Ed25519 Signature</span> {lastVIC.signature?.slice(0, 64)}...
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "simulate" && (
          <div className="space-y-6">
            <div className="glass-panel p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">AI</div>
              <h2 className="text-xl font-semibold font-display mb-2">AI Simulator</h2>
              <p className="text-[#9CA3AF] text-sm mb-6">Current Policy: <span className="font-medium">{policy.name}</span></p>
              {policy.status === "draft" && (
                <p className="text-xs text-yellow-600 mb-4">Warning: Draft policy may not reflect intended rules.</p>
              )}
              <p className="text-xs text-gray-400 mb-4">Simulates all 7 decision types with multiple test cases</p>
              <button onClick={runSimulation} disabled={loading} className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50">
                {loading ? "Simulating..." : "Run Full Simulation"}
              </button>
            </div>

            {simulationResults.length > 0 && (
              <div className="glass-panel overflow-hidden">
                <div className="px-6 py-4 bg-transparent border-b border-white/10 flex justify-between items-center">
                  <h3 className="font-semibold text-white">Simulation Results (Saved to Queue)</h3>
                  <Link href="/history" className="text-sm text-primary hover:text-[#A8321C]">View Full Queue</Link>
                </div>
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {simulationResults.map((result, idx) => (
                    <div key={idx} className={`p-4 flex justify-between items-center ${result.approved ? "hover:bg-green-50" : "hover:bg-red-50"}`}>
                      <div className="flex-1">
                        <div className="font-medium text-white">{result.vendor}</div>
                        <div className="text-sm text-[#9CA3AF]">${result.amount?.toLocaleString()} - {getDecisionLabel(result.decision_type)}</div>
                        <div className="text-xs text-gray-400 font-mono">{result.vic_id?.slice(0, 20)}...</div>
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
              <div className="text-center py-12 text-gray-400">No decisions yet. Run the AI Simulator or verify a decision.</div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.slice(0, 30).map((v,i) => (
                  <div key={i} className={`p-4 rounded-xl border cursor-pointer hover:shadow-md ${v.approved ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`} onClick={() => { setActiveTab("verify"); setLastVIC(v); setEntityName(v.vendor); setAmount(v.amount); setDecisionType(v.decision_type || "payment"); }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-mono ${v.approved ? "text-green-600" : "text-red-600"}`}>{v.vic_id}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${v.approved ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>{v.approved ? "APPROVED" : "BLOCKED"}</span>
                          <span className="text-xs text-gray-400">{getDecisionLabel(v.decision_type)}</span>
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
    </div>
  );
}
