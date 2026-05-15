from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import hashlib
import json
import uuid
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
import base64

app = FastAPI(title="PayReality VIC API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

_SEED = b"payreality-demo-seed-2026"
_key = Ed25519PrivateKey.from_private_bytes(hashlib.sha256(_SEED).digest()[:32])
_PUBLIC_KEY = _key.public_key()
_PUBLIC_KEY_FINGERPRINT = hashlib.sha256(_PUBLIC_KEY.public_bytes(Encoding.Raw, PublicFormat.Raw)).hexdigest()[:16]

class PolicyRules(BaseModel):
    name: str
    maxAmount: Optional[float] = 0
    approvedEntities: List[str] = []
    blockWeekends: Optional[bool] = False
    businessHoursOnly: Optional[bool] = False
    firstTimeHold: Optional[bool] = False
    mfaThreshold: Optional[float] = 0
    daily_limit: Optional[float] = 0
    weekly_limit: Optional[float] = 0
    monthly_limit: Optional[float] = 0
    risk_score_threshold: Optional[float] = 0
    min_credit_score: Optional[float] = 0

class VerifyRequest(BaseModel):
    vendor: str
    amount: float
    agent_id: Optional[str] = None
    decision_type: str
    policy: PolicyRules

class VICResponse(BaseModel):
    vic_id: str
    timestamp: str
    vendor: str
    amount: float
    agent_id: Optional[str]
    decision_type: str
    policy_name: str
    approved: bool
    signature: str
    public_key_fingerprint: str
    reasons: List[str]

@app.get("/api/public-key")
async def get_public_key():
    return {"fingerprint": _PUBLIC_KEY_FINGERPRINT}

@app.post("/api/verify")
async def verify_payment(request: VerifyRequest):
    now = datetime.now(timezone.utc)
    reasons = []
    approved = True
    
    # Amount limit check
    if request.policy.maxAmount and request.policy.maxAmount > 0 and request.amount > request.policy.maxAmount:
        reasons.append(f"Amount ${request.amount:,.2f} exceeds policy limit of ${request.policy.maxAmount:,.0f}")
        approved = False
    
    # Daily limit check (simplified for demo)
    if request.policy.daily_limit and request.policy.daily_limit > 0 and request.amount > request.policy.daily_limit:
        reasons.append(f"Amount exceeds daily limit of ${request.policy.daily_limit:,.0f}")
        approved = False
    
    # Weekly limit check
    if request.policy.weekly_limit and request.policy.weekly_limit > 0 and request.amount > request.policy.weekly_limit:
        reasons.append(f"Amount exceeds weekly limit of ${request.policy.weekly_limit:,.0f}")
        approved = False
    
    # Monthly limit check
    if request.policy.monthly_limit and request.policy.monthly_limit > 0 and request.amount > request.policy.monthly_limit:
        reasons.append(f"Amount exceeds monthly limit of ${request.policy.monthly_limit:,.0f}")
        approved = False
    
    # Entity allowlist check
    if request.policy.approvedEntities and len(request.policy.approvedEntities) > 0:
        if request.vendor not in request.policy.approvedEntities:
            reasons.append(f"Entity '{request.vendor}' is not on the approved list")
            approved = False
    
    # Weekend check
    if request.policy.blockWeekends and now.weekday() >= 5:
        reasons.append("Weekend decisions are blocked by policy")
        approved = False
    
    # Business hours check
    if request.policy.businessHoursOnly and (now.hour < 9 or now.hour >= 17):
        reasons.append("Decisions outside business hours (9am-5pm) are blocked")
        approved = False
    
    # First-time entity hold
    if request.policy.firstTimeHold:
        reasons.append("First-time entity requires manual approval")
        approved = False
    
    # MFA threshold
    if request.policy.mfaThreshold and request.policy.mfaThreshold > 0 and request.amount > request.policy.mfaThreshold:
        reasons.append(f"Amount over ${request.policy.mfaThreshold:,.0f} requires MFA approval")
        approved = False
    
    # Risk score threshold (placeholder - would need actual risk score)
    if request.policy.risk_score_threshold and request.policy.risk_score_threshold > 0:
        reasons.append(f"Risk score exceeds threshold of {request.policy.risk_score_threshold} (simulated)")
        approved = False
    
    # Minimum credit score (placeholder)
    if request.policy.min_credit_score and request.policy.min_credit_score > 0:
        reasons.append(f"Credit score below minimum of {request.policy.min_credit_score} (simulated)")
        approved = False
    
    vic_id = f"VIC-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    vic_data = {
        "vic_id": vic_id,
        "timestamp": now.isoformat(),
        "vendor": request.vendor,
        "amount": request.amount,
        "agent_id": request.agent_id,
        "decision_type": request.decision_type,
        "policy_name": request.policy.name,
        "approved": approved,
        "reasons": reasons,
        "public_key_fingerprint": _PUBLIC_KEY_FINGERPRINT
    }
    
    canonical_string = json.dumps(vic_data, sort_keys=True, separators=(',', ':'))
    signature = _key.sign(canonical_string.encode())
    signature_b64 = base64.b64encode(signature).decode()
    
    return VICResponse(
        vic_id=vic_id,
        timestamp=vic_data["timestamp"],
        vendor=request.vendor,
        amount=request.amount,
        agent_id=request.agent_id,
        decision_type=request.decision_type,
        policy_name=request.policy.name,
        approved=approved,
        signature=signature_b64,
        public_key_fingerprint=_PUBLIC_KEY_FINGERPRINT,
        reasons=reasons
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
