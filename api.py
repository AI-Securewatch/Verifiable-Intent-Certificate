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
    name: Optional[str] = None
    maxAmount: float
    approvedVendors: List[str]
    blockWeekends: bool
    businessHoursOnly: bool
    firstPaymentHold: bool
    mfaThreshold: float
    softBlockPercent: float

class VerifyRequest(BaseModel):
    vendor: str
    amount: float
    agent_id: Optional[str] = None
    policy: PolicyRules

class VICResponse(BaseModel):
    vic_id: str
    timestamp: str
    vendor: str
    amount: float
    agent_id: Optional[str]
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
    if request.amount > request.policy.maxAmount:
        reasons.append(f"Amount ${request.amount:,.2f} exceeds policy limit of ${request.policy.maxAmount:,.0f}")
        approved = False
    
    # Vendor allowlist check
    if request.policy.approvedVendors and len(request.policy.approvedVendors) > 0:
        if request.vendor not in request.policy.approvedVendors:
            reasons.append(f"Vendor '{request.vendor}' is not on the approved list")
            approved = False
    
    # Weekend check
    if request.policy.blockWeekends and now.weekday() >= 5:
        reasons.append("Weekend payments are blocked by policy")
        approved = False
    
    # Business hours check
    if request.policy.businessHoursOnly and (now.hour < 9 or now.hour >= 17):
        reasons.append("Payments outside business hours (9am-5pm) are blocked")
        approved = False
    
    # First payment hold
    if request.policy.firstPaymentHold:
        reasons.append("First payment to new vendor requires manual approval")
        approved = False
    
    # MFA threshold
    if request.amount > request.policy.mfaThreshold:
        reasons.append(f"Amount over ${request.policy.mfaThreshold:,.0f} requires MFA approval")
        approved = False
    
    # Generate VIC
    vic_id = f"VIC-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    vic_data = {
        "vic_id": vic_id,
        "timestamp": now.isoformat(),
        "vendor": request.vendor,
        "amount": request.amount,
        "agent_id": request.agent_id,
        "approved": approved,
        "policy_name": request.policy.name or "Default Policy",
        "reasons": reasons,
        "public_key_fingerprint": _PUBLIC_KEY_FINGERPRINT
    }
    
    # Sign the VIC data
    canonical_string = json.dumps(vic_data, sort_keys=True, separators=(',', ':'))
    signature = _key.sign(canonical_string.encode())
    signature_b64 = base64.b64encode(signature).decode()
    
    return VICResponse(
        vic_id=vic_id,
        timestamp=vic_data["timestamp"],
        vendor=request.vendor,
        amount=request.amount,
        agent_id=request.agent_id,
        approved=approved,
        signature=signature_b64,
        public_key_fingerprint=_PUBLIC_KEY_FINGERPRINT,
        reasons=reasons
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
