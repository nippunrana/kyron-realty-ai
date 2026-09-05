# Kyron Realty AI — Agora Conversational AI & Real-Time Voice System

This document outlines the real-time voice infrastructure powered by Agora's Software Defined Real-Time Network (SD-RTN) and the Agora Conversational AI Cloud Gateway (v2 API).

---

## 1. Voice Pipeline Overview

```
[ Buyer Browser ] ◄══════ Opus 48kHz WebRTC Channel ══════► [ Agora SD-RTN Media Network ]
        ▲                                                              ▲
        │ RTM Signaling (Live Transcripts & Chat)                      │
        ▼                                                              ▼
[ agora-agent-client-toolkit ] ◄── Transcripts ───────────────────────┤
        │ HTTP REST                                                    │
        ▼                                                              ▼
[ Next.js API Routes ] ─── POST /join (v2) ───────────────────► [ Agora Cloud Gateway v2 ]
• /api/agora/token                                            • ASR: Agora Ares / Deepgram Nova-3
• /api/agora/session/start                                    • LLM: Google Gemini 3.5 Flash-Lite (via OpenAI endpoint)
• /api/agora/session/stop                                     • TTS: Agora Managed Mode (MiniMax) / BYOK (ElevenLabs/Cartesia/Azure)
```

---

## 2. Dynamic Token Service
- **Source**: `src/lib/agora-token.ts`
- **Algorithms**:
  - `RtcTokenBuilder.buildTokenWithUid`: Issues signed RTC tokens for user media tracks (`1001`).
  - `RtmTokenBuilder.buildToken`: Issues signed RTM tokens for user transcript stream & chat.
  - `RtcTokenBuilder.buildTokenWithRtm`: Issues dual signed RTC+RTM tokens for the voice agent (`999001`) carrying `ServiceRtc` (publisher) and `ServiceRtm` (login). Required for Agora Cloud Gateway Conversational AI agents when `enable_rtm: true` is active.
- **TTL**: 3600 seconds (1 hour).
- **UID Conventions**: Client Caller (`1001`), Voice Agent (`999001`).

---

## 3. Conversational AI Agent Orchestration (v2 REST API)
- **Source**: `src/lib/agora-agent-client.ts`
- **Endpoints**:
  - **Start Session**: `POST https://api.agora.io/api/conversational-ai-agent/v2/projects/{appId}/join`
  - **Stop Session**: `POST https://api.agora.io/api/conversational-ai-agent/v2/projects/{appId}/agents/{agentId}/leave`
- **Authentication**: HTTP Basic Auth with `AGORA_CUSTOMER_ID` and `AGORA_CUSTOMER_SECRET` (or `AGORA_CONVERSATIONAL_AI_API_KEY`).
- **RTM Configuration**: Join payload specifies `advanced_features: { enable_rtm: true }` and `parameters: { data_channel: "rtm", enable_error_message: true }`.
- **Fail-Fast Error Handling**: Non-200 responses from `/join` immediately mark the database session as `status: "failed"` and throw an explicit error. Zero silent mock fallbacks.
- **LLM Brain**: Powered by Google Gemini (`gemini-3.5-flash-lite`) via Google's OpenAI-compatible endpoint (`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`) using `GEMINI_API_KEY`, or OpenAI (`gpt-4o-mini`) via `OPENAI_API_KEY`.
- **Persona**: "Sarah - Senior Leasing & Sales Advisor" for buyers; "Alex - Onboarding Specialist" for owner onboarding.
- **Knowledge Base Injection**: Injects property specs, neighborhood notes, and categorized FAQs into the LLM system prompt.
- **Negotiation Guardrails**: Enforces hard floor price locks and conditional concessions (e.g. 5% discount for 18-month lease).

---

## 4. Client WebRTC & RTM Hook (`useAgoraVoiceAgent`)
- **Hook**: `src/hooks/useAgoraVoiceAgent.ts` using `agora-rtc-sdk-ng`, `agora-rtm`, and `agora-agent-client-toolkit`.
- **Zero Browser Audio**: 100% of speech audio is delivered via Agora SD-RTN WebRTC audio tracks. Zero `window.speechSynthesis` or local fake reply generators.
- **Live Transcripts**: Subscribes to Agora RTM channel via `rtmClient.subscribe(channelName)` and `ai.subscribeMessage(channelName)` before RTC join, listening for `AgoraVoiceAIEvents.TRANSCRIPT_UPDATED`.
- **Checklist Deduplication**: Completed user speech turns (`item.status === TurnStatus.END`) trigger property extraction deduplicated by `turn_id` and cached for typed text.
- **Audio Processing**: Acoustic Echo Cancellation (AEC), Automatic Noise Suppression (ANS), Automatic Gain Control (AGC).
- **Waveform Animation**: Web Audio API `AnalyserNode` extracting 60fps frequency spectrums.
- **UI Consumers**:
  - `src/components/dashboard/onboarding/ConversationalPanel.tsx`
  - `src/components/voice/VoiceSalesAgentModal.tsx`

