# Kyron Realty AI — Agora Conversational AI & Real-Time Voice System

This document outlines the real-time voice infrastructure powered by Agora's Software Defined Real-Time Network (SD-RTN) and the Agora Conversational AI Cloud Gateway (v2 API).

---

## 1. Voice Pipeline Overview

```
[ Buyer Browser ] ◄══════ Opus 48kHz WebRTC Channel ══════► [ Agora SD-RTN Media Network ]
        │                                                              │
        │ HTTP REST                                                    │
        ▼                                                              ▼
[ Next.js API Routes ] ─── POST /join (v2) ───────────────────► [ Agora Cloud Gateway v2 ]
• /api/agora/token                                            • ASR: Agora Ares / Deepgram Nova-3
• /api/agora/session/start                                    • LLM: Google Gemini 2.0 Flash (via OpenAI endpoint)
• /api/agora/session/stop                                     • TTS: Microsoft / Cartesia / ElevenLabs
```

---

## 2. Dynamic Token Service
- **Source**: `src/lib/agora-token.ts`
- **Algorithm**: `RtcTokenBuilder.buildTokenWithUid` from `agora-token`.
- **TTL**: 3600 seconds (1 hour).
- **UID Conventions**: Client Caller (`1001`), Voice Agent (`999001`).

---

## 3. Conversational AI Agent Orchestration (v2 REST API)
- **Source**: `src/lib/agora-agent-client.ts`
- **Endpoints**:
  - **Start Session**: `POST https://api.agora.io/api/conversational-ai-agent/v2/projects/{appId}/join`
  - **Stop Session**: `POST https://api.agora.io/api/conversational-ai-agent/v2/projects/{appId}/agents/{agentId}/leave`
- **Authentication**: HTTP Basic Auth with `AGORA_CUSTOMER_ID` and `AGORA_CUSTOMER_SECRET` (or `AGORA_CONVERSATIONAL_AI_API_KEY`).
- **LLM Brain**: Powered by Google Gemini (`gemini-3.5-flash-lite`) via Google's OpenAI-compatible endpoint (`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`) using `GEMINI_API_KEY`, or OpenAI (`gpt-4o-mini`) via `OPENAI_API_KEY`.
- **Persona**: "Sarah - Senior Leasing & Sales Advisor"
- **Knowledge Base Injection**: Injects property specs, neighborhood notes, and categorized FAQs into the LLM system prompt.
- **Negotiation Guardrails**: Enforces hard floor price locks and conditional concessions (e.g. 5% discount for 18-month lease).

---

## 4. Client WebRTC Hook & Visualizer
- **Hook**: `src/hooks/useAgoraVoiceAgent.ts` using `agora-rtc-sdk-ng`.
- **App ID Negotiation**: Server-verified App ID delivery from session response with client-side format validation.
- **Audio Processing**: Acoustic Echo Cancellation (AEC), Automatic Noise Suppression (ANS), Automatic Gain Control (AGC).
- **Waveform Animation**: Web Audio API `AnalyserNode` extracting 60fps frequency spectrums.
- **UI Modal**: `src/components/voice/VoiceSalesAgentModal.tsx`.

