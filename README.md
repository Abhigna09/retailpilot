
# RetailPilot — AI Retail Operations & Procurement Agent

> Built for Razorpay AI Buildathon 2026 — Track 1: AI Growth & Agentic Commerce

**Live app**: [add your Vercel URL here]
**Backend API**: `https://4nyjyl4oa9.execute-api.ap-south-1.amazonaws.com/prod/`

## Problem

Small retail stores manage inventory manually — checking stock levels, deciding what to reorder, when, and how much, by gut feel or spreadsheet. This causes two costly problems:

- **Stockouts** — fast-selling items run out because reorder happens too late, losing sales
- **Dead / expiring stock** — slow-moving or near-expiry items sit unsold, tying up money or becoming a total loss

## What we built

An AI retail operations and procurement agent that protects merchant revenue by turning inventory risks into safe, explainable commercial actions.

**Inventory signal → Commercial decision → Safe, bounded transaction → Outcome tracking → Merchant revenue protection**

The agent follows a full lifecycle for every issue it finds:

**Observe → Detect → Reason → Decide → Safety Check → Act / Ask / Block → Track → Audit**

Every step is persisted as a real `AgentAction` record with a genuine timestamped event history — not a UI illusion, an actual database object that traces from detection through execution.

### Example flow

Cooking Oil has 21 units left, selling ~4/day:

> "You currently have 21 units of 1L Cooking Oil left in stock. Based on your current sales rate, this supply will completely run out in about 5 days. Recommended: reorder 13 units now."

The agent checks whether this fits the store owner's autopay rules. If yes and safety checks pass, it places the order and pays the vendor automatically. If the order needs approval, it shows exactly what will be ordered, from whom, and for how much, before anything happens. If a safety check fails, it blocks the action and says why — never silently proceeding.

## Bounded autonomy — the core behavior

Depending on the real situation, the agent can:

- **Act automatically** — when within the merchant's defined safety boundaries (autopay enabled, under spend threshold)
- **Ask for approval** — when a valid action exceeds its autonomy limits
- **Block or refuse** — when a safety check fails (spend limit exceeded, vendor mismatch, duplicate order, amount mismatch)

These outcomes come from real application logic and real data — never hardcoded demo results.

## Where AI is used (and where it isn't)

**AI (Gemini API):**
- Turning raw detection numbers into plain-language reasoning and recommendations
- Judging borderline cases in the explanation layer

**Deliberately NOT AI (plain code):**
- Sales velocity, reorder threshold, expiry-risk math — deterministic, must be exact and repeatable
- Safety checks (spend limit, vendor verification, duplicate-order guard, amount-match) — hard-coded rules. A safety gate an LLM could reason around defeats the purpose
- Payment execution itself — a direct, deterministic Razorpay API call once safety checks pass

The AI's job is understanding and explaining. Money-moving guardrails are code, not prompts.

## Architecture

```
Login / Signup
      |
  Sidebar navigation
      |
   -----------------------------------------------------
   |          |            |          |          |
 Home     Analysis     Products    Vendors   Product Expiry
   |          |                                    |
   -----------------------------------------------------
              |
      Detection engine (velocity, reorder, dead-stock, expiry)
              |
      Reasoning agent (Gemini — explains & recommends)
              |
      Approval & autopay routing
              |
      Safety checks (spend limit, vendor match, duplicate, amount match)
              |
   -----------------------------
   |                           |
Payment execution      Notification (simulated)
  (Razorpay)                   |
   -----------------------------
              |
       AgentAction persisted
       (real events, real timestamps)
              |
         Activity Log
```

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Node.js + TypeScript, AWS Lambda |
| API | AWS API Gateway |
| Database | AWS DynamoDB (single-table design) |
| Infra as code | AWS CDK |
| AI reasoning | Gemini API |
| Payments | Razorpay API (sandbox) |
| Frontend | React + TypeScript (Vite) |
| Frontend hosting | Vercel |
| Architecture pattern | Hexagonal (models / services / handlers) |

## Real vs simulated — honest scope

| Piece | Status |
|---|---|
| Auth, onboarding, product/vendor management | Real |
| Detection engine (velocity, reorder, dead-stock, expiry math) | Real |
| Reasoning agent (Gemini explanations) | Real |
| Safety checks | Real |
| Autopay toggle & approval routing | Real |
| AgentAction persistence & event history | Real |
| Sales & expiry batch recording | Real |
| Razorpay order creation | Real API call — collect-payment API, not a real vendor bank payout |
| "Money sent to vendor's bank account" | Simulated — proof-of-concept for the payment-trigger step. Production would use RazorpayX Payouts, which needs separate business KYC and approval not achievable in this build window |
| Vendor notification | Simulated — UI/audit confirmation only, no real WhatsApp/email sent |

## Features

- Auto-detection of reorder needs, dead stock, and expiry risk across the full inventory
- Plain-language reasoning for every flagged issue
- Bounded autonomy: autonomous execution, approval-required, or blocked — driven by real safety checks
- Real persisted AgentAction lifecycle with genuine event timestamps
- Activity Log — real audit trail, not a reconstructed timeline
- Sales History and Product Expiry tracking, feeding real data back into detection
- Vendor and product management with per-product autopay thresholds

## Project structure

```
/src
  /models       — domain models (product, vendor, sale, expiry batch, user, agentAction)
  /services      — business logic (detection, reasoning, safety, payment, approval, notification, agent actions)
  /handlers      — Lambda entry points
  /shared        — shared response helpers
/infra           — AWS CDK stack definitions
/frontend        — React dashboard (sidebar nav, Home, Analysis, Products, Vendors, Product Expiry, Sales History, Activity Log)
```

## Team

Solo build — Abhigna Gajendra, with Claude as build partner.
```
