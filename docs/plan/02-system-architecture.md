# 02. System Architecture & Component Design

## 1. High-Level Architecture Diagram

```
                                  [ USER CLIENTS ]
          ┌─────────────────────────────────────────────────────────────┐
          │ Owner Dashboard (Desktop)   │ Buyer Mobile Web / QR Scan    │
          │ Split-Screen Onboarding     │ Listing Page + Agora WebRTC   │
          └──────────────────────────────┬──────────────────────────────┘
                                         │ HTTPS / WSS / WebRTC
                                         ▼
                     [ NGINX REVERSE PROXY & SUBPATH ROUTER ]
                     Subpath: /projects/kyron-realty-ai
                                         │
                                         ▼
                    [ NEXT.JS 16 APPLICATION BACKEND (Node.js) ]
          ┌─────────────────────────────────────────────────────────────┐
          │ • Server Actions & Route Handlers                           │
          │ • Auth.js (NextAuth v5) Session Validation                  │
          │ • Agora Dynamic Token Generator (RTC & Conversational AI)   │
          │ • Onboarding Orchestrator & LLM Extraction Engine           │
          │ • Lead Capture & Calendar Appointment Booking               │
          └───────────┬───────────────────┬───────────────────┬─────────┘
                      │                   │                   │
       REST / JSON    │      RTC Audio    │      REST API     │  SQL Queries
                      ▼                   ▼                   ▼  (Drizzle ORM)
         ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
         │   APIFY ACTOR    │   │      AGORA       │   │  POSTGRESQL 17   │
         │     PLATFORM     │   │ CONVERSATIONAL   │   │     DATABASE     │
         │                  │   │    AI CLOUD      │   │                  │
         │ • Website Content│   │ • SD-RTN Media   │   │ • Properties     │
         │   Crawler        │   │ • STT (Deepgram/ │   │ • Media & Specs  │
         │ • Clean Markdown │   │   Agora STT)     │   │ • Knowledge Base │
         │ • Image Asset    │   │ • LLM Reasoning  │   │ • Concessions    │
         │   Extractor      │   │ • TTS (Cartesia/ │   │ • Voice Sessions │
         │                  │   │   ElevenLabs)    │   │ • Leads & Tours  │
         └──────────────────┘   └──────────────────┘   └──────────────────┘
```

---

## 2. Component Specifications

### 2.1 Frontend Client Layer
- **Framework**: Next.js 16 (React 19, TypeScript) with Turbopack.
- **Styling & UI**: Tailwind CSS v4, Lucide React icons, dual-theme styling (Clean Editorial Light & Midnight Luxury Dark).
- **Voice SDK**: `agora-rtc-sdk-ng` (v4.x) for browser microphone capture, audio track publishing, remote agent track subscription, and real-time audio level visualizer.
- **QR Code & Sharing**: `qrcode.react` / SVG QR generator with embedded branding + native Web Share API / WhatsApp deep linking. *(Superseded: `qrcode.react` was never used and is removed; the share modal uses the `qrcode` package.)*

### 2.2 Application Backend Layer (Next.js Server Actions & API Routes)
All endpoints reside under the `/projects/kyron-realty-ai/api/` subpath:
- **`POST /api/agora/token`**: ~~Generates short-lived RTC tokens using `agora-access-token` for authenticated and anonymous callers.~~ *(Superseded: removed on 2026-09-05; the session-start route mints its own token.)*
- **`POST /api/agora/session/start`**: Dispatches a start request to the Agora Conversational AI Cloud Gateway REST API with the property-specific system prompt, knowledge base context, and tool definitions.
- **`POST /api/agora/session/stop`**: Gracefully terminates an active agent session in the RTC channel and triggers session transcript summarization.
- **`POST /api/onboarding/scrape`**: Dispatches an Apify run task for a given property URL, monitors execution, and fetches raw markdown content.
- **`POST /api/onboarding/extract`**: Sends scraped markdown or interview transcripts to Gemini 2.5 / GPT-4o with structured JSON schema to populate property fields.
- **`POST /api/leads/capture`**: Endpoint invoked via tool calling by the voice agent or public web form to register a qualified buyer lead and tour booking.

### 2.3 Agora Conversational AI Engine
Agora SD-RTN orchestrates the voice agent as an automated participant in the RTC channel:
- **Audio Ingress**: Client publishes 48kHz Opus audio stream to Agora RTC channel.
- **VAD & Interruption**: Voice Activity Detection (<50ms) instantly cuts off agent playback when the user speaks.
- **Modular Pipeline**:
  - **STT**: Deepgram Nova-3 / Agora Real-time Transcription.
  - **LLM**: GPT-4o / Claude 3.5 Sonnet / Gemini 2.5 with custom function definitions.
  - **TTS**: Cartesia Sonic / ElevenLabs Turbo v2 with warm, professional real estate persona.
- **Multimodal Direct Speech-to-Speech**: Optional direct audio-in/audio-out via OpenAI Realtime / Gemini Live for sub-250ms conversational latency.

### 2.4 Scraping & Ingestion Engine (Apify)
- Uses Apify's **Website Content Crawler** actor (`apify/website-content-crawler`).
- Takes any landlord/broker listing URL.
- Configured with `maxCrawlDepth: 0` (target page only) and `crawlerType: "playwright:adaptive"` to bypass JS-rendered SPAs and anti-scraping protections.
- Returns formatted Markdown, meta tags, and high-resolution image URLs.

---

## 3. Data Flow Sequence: Public Buyer Voice Call

```
Buyer Browser              Next.js Backend             Agora SD-RTN & Agent           Postgres DB
     │                           │                               │                         │
     │ 1. Click "Talk to Agent"  │                               │                         │
     ├──────────────────────────►│                               │                         │
     │                           │ 2. Fetch Property & KB Doc    │                         │
     │                           ├────────────────────────────────────────────────────────►│
     │                           │ 3. Return KB & Concessions    │                         │
     │                           │◄────────────────────────────────────────────────────────┤
     │                           │                               │                         │
     │                           │ 4. Call Agora Start Agent API │                         │
     │                           │    (Pass Prompt + Tools)      │                         │
     │                           ├──────────────────────────────►│                         │
     │                           │ 5. Return Token & Channel     │                         │
     │◄──────────────────────────┤                               │                         │
     │                           │                               │                         │
     │ 6. Join RTC Channel       │                               │                         │
     ├──────────────────────────────────────────────────────────►│                         │
     │                           │                               │                         │
     │ 7. Bidirectional Audio (Buyer Speaks ◄═══════════════════► Agent Speaks)            │
     │    [Real-time Q&A, Negotiation & Concession Guardrail Execution]                    │
     │                           │                               │                         │
     │                           │ 8. Agent Calls "book_viewing" │                         │
     │                           │    Tool via Webhook Callback  │                         │
     │                           │◄──────────────────────────────┤                         │
     │                           │ 9. Save Lead & Appointment    │                         │
     │                           ├────────────────────────────────────────────────────────►│
     │                           │ 10. Confirm Booking to Agent  │                         │
     │                           ├──────────────────────────────►│                         │
     │ 11. Agent confirms verbally ("You're all set for Friday at 3 PM!")                  │
     │◄──────────────────────────────────────────────────────────┤                         │
     │                           │                               │                         │
```
