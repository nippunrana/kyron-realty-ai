# 07. Implementation Roadmap & Verification Plan

## 1. Phased Execution Roadmap

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │ PHASE 1: DATABASE & CORE INFRASTRUCTURE                                │
  │ • Apply Drizzle ORM schema updates (properties, media, KB, leads)      │
  │ • Environment configuration (Agora, Apify, LLM API keys)               │
  └──────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ PHASE 2: APIFY SCRAPING & KNOWLEDGE BASE PIPELINE                      │
  │ • Apify Website Content Crawler integration                            │
  │ • Structured JSON extraction & speech-optimized KB synthesis           │
  └──────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ PHASE 3: DASHBOARD ONBOARDING STUDIO                                   │
  │ • Split-Screen Studio UI (/dashboard/properties/new)                   │
  │ • Conversational Voice & Text Wizard with live preview inspector       │
  │ • One-click listing publication                                        │
  └──────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ PHASE 4: AGORA CONVERSATIONAL AI ENGINE                                │
  │ • Agora RTC Token generator with RtcTokenBuilder2                      │
  │ • Agora Conversational AI Cloud Gateway session dispatcher             │
  │ • Real-time WebRTC browser audio client & canvas waveform visualizer   │
  └──────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ PHASE 5: PUBLIC LISTING, QR DISTRIBUTION & SALES AGENT                 │
  │ • Public listing view (/listings/[slug])                               │
  │ • QR Code modal & WhatsApp marketing card generator                    │
  │ • Voice Sales Agent with negotiation guardrails & tour booking         │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Milestone Deliverables & Verification Criteria

| Phase | Core Deliverables | Verification Criterion |
| :--- | :--- | :--- |
| **Phase 1** | PostgreSQL schema migration via Drizzle | `npx drizzle-kit push` executes with zero errors. All 7 tables verified in DB. |
| **Phase 2** | Apify crawler service & LLM parser | Submitting a test listing URL returns structured property specs & high-res images. |
| **Phase 3** | Split-screen dashboard onboarding | Owner can create a rental/sale listing via URL or conversational wizard; real-time preview updates dynamically. |
| **Phase 4** | Agora RTC + Conversational AI agent | Browser connects to RTC channel; AI agent joins, speaks greeting, and responds with `<300ms` latency. |
| **Phase 5** | Public listing & sales agent | Buyer can scan QR code on mobile, open listing, converse with AI voice agent, negotiate terms within floor price, and book a tour. |

---

## 3. Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://kyron_realty_ai_user:password@localhost:5432/kyron_realty_ai"

# Subpath & App Config
NEXT_PUBLIC_BASE_PATH="/projects/kyron-realty-ai"
NEXTAUTH_URL="https://egnitech.com/projects/kyron-realty-ai"
NEXTAUTH_SECRET="your-32-char-secret"

# Agora Voice & Conversational AI
AGORA_APP_ID="your_agora_app_id"
AGORA_APP_CERTIFICATE="your_agora_app_certificate"
AGORA_CONVERSATIONAL_AI_API_KEY="your_agora_rest_api_key"

# Apify Web Scraping
APIFY_API_TOKEN="apify_api_your_token"

# LLM & Voice Services (Direct or via Agora BYOK)
OPENAI_API_KEY="sk-proj-..."
GEMINI_API_KEY="AIzaSy..."
CARTESIA_API_KEY="your-cartesia-key"
```

---

## 4. Hackathon Live Demo Script (Step-by-Step)

1. **The Problem Setup (30s)**: Show how tedious real estate data entry is, and how slow traditional email lead response times are.
2. **Instant Onboarding (45s)**: In the Kyron Dashboard, paste an external listing URL → watch the split-screen studio scrape the listing via Apify and populate specs, photos, and synthesized voice sales pitch in real-time.
3. **Guardrail Setup (15s)**: Set target rent at \$3,450/mo, floor price at \$3,250/mo, and concession rule "5% off for 18-month lease". Click Publish.
4. **Physical & WhatsApp Marketing (30s)**: Display the instant QR Code and click WhatsApp share to preview the rich flyer card.
5. **Live Voice Sales Demo (90s)**:
   - Open the public listing page on mobile / browser.
   - Click "Talk to AI Agent" → Agora RTC connects instantly.
   - Live Voice Interaction:
     - Ask about parking & pet policy → AI answers immediately with low latency.
     - Try lowballing: "Can you do \$3,100?" → AI politely refuses (below \$3,250 floor).
     - Negotiate: "Can you give me a discount for an 18-month lease?" → AI calculates 5% discount (\$3,277) and proposes it!
     - Close the Deal: "Let's book a viewing this Saturday at 2 PM." → AI confirms and schedules the tour.
6. **Dashboard Lead Verification (30s)**: Return to dashboard → show the captured lead, sentiment score, full audio transcript, and confirmed calendar appointment.
