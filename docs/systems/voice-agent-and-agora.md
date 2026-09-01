# Kyron Realty AI — Agora Conversational AI & Real-Time Voice System

This document outlines the real-time voice infrastructure powered by Agora's Software Defined Real-Time Network (SD-RTN) and the Agora Conversational AI Cloud Gateway.

---

## 1. Voice Pipeline Overview

```
[ Buyer Browser ] ◄══════ Opus 48kHz WebRTC Channel ══════► [ Agora SD-RTN Media Network ]
        │                                                              │
        │ HTTP REST                                                    │
        ▼                                                              ▼
[ Next.js API Routes ] ─── POST /agents/start ──────────────► [ Agora Cloud Gateway ]
• /api/agora/token                                            • STT: Deepgram Nova-3
• /api/agora/session/start                                    • LLM: GPT-4o with KB
• /api/agora/session/stop                                     • TTS: Cartesia Sonic
```

---

## 2. Dynamic Token Service
- **Source**: `src/lib/agora-token.ts`
- **Algorithm**: `RtcTokenBuilder.buildTokenWithUid` from `agora-token`.
- **TTL**: 3600 seconds (1 hour).
- **UID Conventions**: Client Caller (`1001`), Voice Agent (`999001`).

---

## 3. Conversational AI Agent Orchestration
- **Source**: `src/lib/agora-agent-client.ts`
- **Persona**: "Sarah - Senior Leasing & Sales Advisor"
- **Knowledge Base Injection**: Injects property specs, neighborhood notes, and categorized FAQs into the LLM system prompt.
- **Negotiation Guardrails**: Enforces hard floor price locks and conditional concessions (e.g. 5% discount for 18-month lease).

---

## 4. Client WebRTC Hook & Visualizer
- **Hook**: `src/hooks/useAgoraVoiceAgent.ts` using `agora-rtc-sdk-ng`.
- **Audio Processing**: Acoustic Echo Cancellation (AEC), Automatic Noise Suppression (ANS).
- **Waveform Animation**: Web Audio API `AnalyserNode` extracting 60fps frequency spectrums.
- **UI Modal**: `src/components/voice/VoiceSalesAgentModal.tsx`.
