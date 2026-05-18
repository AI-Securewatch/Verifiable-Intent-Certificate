
# PayReality – Verifiable Intent Certificates (VICs) for AI Payments

**Deterministic governance for AI agent payments. Cryptographic proof of every transaction.**

---

## Overview

PayReality is a **policy‑to‑payment adapter** that sits between AI agents and payment gateways. Every payment is checked against human‑signed rules before money moves. If a payment violates policy, it is blocked instantly. Every decision generates a **Verifiable Intent Certificate (VIC)** – a cryptographically signed, tamper‑proof audit trail for regulators, auditors, and insurers.

**This is not a probabilistic guardrail. This is a deterministic hard stop.**

---

## The Problem

| Without PayReality | With PayReality |
|:------------------|:----------------|
| AI agents make payments with no audit trail | Every payment decision is cryptographically sealed |
| No proof of why a payment was approved or blocked | VICs provide deterministic evidence |
| Regulators and auditors cannot verify compliance | Full audit trail for EU AI Act, ISO 42001 |
| Insurers cannot distinguish between AI error, human error, or malicious attack | VICs provide the telemetry layer for AI performance insurance |

---

## Features

| Feature | Description |
|:--------|:------------|
| **Policy Manager** | Create, name, save, load, and delete policies. Prebuilt templates included. |
| **Rule Types** | Max amount, vendor allowlist, weekend blocking, business hours, first-payment hold, MFA threshold, soft alerts |
| **Verify Payment** | Check a single payment against the active policy. Instant approve/block with VIC generation. |
| **AI Simulator** | Run batch simulations to test policies against random payments. |
| **Live Payment Queue** | View all payments with filters (All / Approved / Blocked). |
| **VIC Modal** | Click "View" on any payment to see the full cryptographic certificate – not raw JSON. |
| **Audit Log** | Complete history of every verification decision. |
| **Ed25519 Signatures** | Real cryptography, not a mock. |

---

## Tech Stack

**Frontend (Next.js + Tailwind CSS)**
- Next.js 16
- Tailwind CSS
- Axios
- jsPDF + html2canvas
- Lucide React

**Backend (FastAPI + Python)**
- FastAPI
- Ed25519 (cryptography)
- Uvicorn

**Data Persistence**
- LocalStorage (browser) – policies and payment history
- No database required for the demo

---

## Installation & Setup

### Prerequisites
- Node.js 20+
- Python 3.11+
- pip

### Clone the repository

```bash
git clone https://github.com/AI-Securewatch/Verifiable-Intent-Certificate.git
cd Verifiable-Intent-Certificate
```

### Install frontend dependencies

```bash
npm install
```

### Install backend dependencies

```bash
pip install fastapi uvicorn cryptography
```

### Run the demo

**Terminal 1 – Backend (FastAPI):**

```bash
python api.py
```

Server runs at `http://localhost:8000`

**Terminal 2 – Frontend (Next.js):**

```bash
npm run dev
```

Dashboard runs at `http://localhost:3000`

---

## How to Demo

| Step | Action |
|:----:|:-------|
| 1 | Open **Policy Manager** – create a new policy or load a template |
| 2 | Go to **Verify Payment** – test an approved payment (e.g., Coastal Freight Ltd, $42,500) |
| 3 | Test a blocked payment (e.g., Unknown Trading, $75,000) – see the VIC with block reasons |
| 4 | Go to **AI Simulator** – run 8 random payments to populate the queue |
| 5 | Open **Live Payment Queue** (`/history`) – filter, view, and export VICs |
| 6 | Click **View** on any payment – see the professional VIC certificate modal |

---

## Architecture

```text
AI Agent (or Manual Input)
        │
        ▼
PayReality API (FastAPI + Ed25519)
  ┌─────────────────────────────────────┐
  │  Policy Envelope (Human‑signed rules)│
  │  - Max amount: $50,000              │
  │  - Approved vendors list            │
  │  - Time restrictions                │
  │  - First-payment hold, MFA, alerts  │
  └─────────────────────────────────────┘
        │
        ▼
  Deterministic Evaluation → Allow / Block
        │
        ▼
  Verifiable Intent Certificate (VIC)
  - Ed25519 signature
  - Canonical JSON payload
  - Public key fingerprint
```

---

## Testing

PayReality uses Jest for unit/component testing and Playwright for end-to-end (E2E) testing.

### Run Unit Tests

```bash
npm run test
```

### Run E2E Tests

*Note: Playwright requires Node.js >= 20.9.0 to run with Next.js.*

```bash
npm run test:e2e
```

---

## Patent Information

**Provisional Patent PPN00002476** – Verifiable Intent Certificates for AI Payment Governance

---

## License

Proprietary – AI Securewatch (Pty) Ltd

For licensing inquiries, contact sean@aisecurewatch.com

---

## Authors

| Name | Role |
|:-----|:-----|
| **Sean Chihwendu** | CEO, Product Vision |
| **Nathan Obiekwe** | CTO, Core Engine & API |
| **Tshiamo Masuluke** | CMO, Go‑to‑Market |

---

## Partners

- **iTOO Special Risks** – aiSure™ AI performance insurance pilot
- **Munich Re** – Global reinsurance partner

---

## Contact

- Website: [aisecurewatch.com](https://aisecurewatch.com)
- Email: sean@aisecurewatch.com
- GitHub: [AI-Securewatch](https://github.com/AI-Securewatch)

---

## One Sentence

> *"PayReality is the black box for AI payments – deterministic governance, cryptographic proof, and enterprise‑grade audit trails."*
```
