# 04. Agora Conversational AI & Real-Time Voice Pipeline

## 1. Agora Conversational AI Architecture

The voice architecture leverages the **Agora Conversational AI Cloud Gateway** to achieve sub-300ms speech-to-speech round-trip latency without requiring custom WebSocket proxy servers.

```
┌─────────────────────────┐          Agora RTC Channel (Opus 48kHz)         ┌─────────────────────────┐
│     BUYER BROWSER       │◄═══════════════════════════════════════════════►│   AGORA SD-RTN ENGINE   │
│  • agora-rtc-sdk-ng     │                                                 │  • Global Mesh Network  │
│  • Web Audio Visualizer │                                                 │  • Ultra-low Jitter     │
│  • Live Subtitles       │                                                 │  • VAD Interruption Cut │
└─────────────────────────┘                                                 └───────────┬─────────────┘
             │                                                                          │
             │ HTTPS                                                                    │ Internal SD-RTN
             ▼                                                                          ▼
┌─────────────────────────┐                                                 ┌─────────────────────────┐
│   NEXT.JS API SERVER    │          POST /v1/projects/{appId}/agents/start │ AGORA AGENT CLOUD GW    │
│  • Token Generation     ├────────────────────────────────────────────────►│  1. STT: Deepgram Nova-3│
│  • Injects KB Context   │                                                 │  2. LLM: GPT-4o Realtime│
│  • Tool Calling Webhook │◄────────────────────────────────────────────────┤  3. TTS: Cartesia Sonic │
└─────────────────────────┘                 Tool Webhook Callbacks          └─────────────────────────┘
```

---

## 2. Dynamic Token Generation & Security

### 2.1 RTC Token Dispatcher (`/api/agora/token`)
> **Superseded (2026-09-05):** this route and the `agora-access-token` package were removed. Tokens are minted only inside the session-start route via `src/lib/agora-token.ts`.

- Uses `agora-access-token` package with `RtcTokenBuilder2`.
- Generates 1-hour expiring tokens tied to unique channel IDs.
- Caller receives:
  - `appId`: Agora App ID
  - `channelName`: `listing-${slug}-${randomHex}`
  - `token`: Cryptographically signed token
  - `uid`: Integer user identifier (e.g. `1001`)

```typescript
import { RtcTokenBuilder2, RtcRole } from "agora-access-token";

export async function generateAgoraRtcToken(channelName: string, uid: number) {
  const appId = process.env.AGORA_APP_ID!;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE!;
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder2.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpiredTs,
    privilegeExpiredTs
  );

  return { token, channelName, uid, appId };
}
```

---

## 3. Agora Conversational Agent Orchestration (`/api/agora/session/start`)

When a user initiates a voice call, Next.js calls the Agora Conversational AI REST Gateway to spin up the agent in the same RTC channel.

### 3.1 REST API Request Payload
```json
{
  "name": "Kyron-Realty-Sales-Agent",
  "properties": {
    "channel": "listing-marina-loft-a91b",
    "token": "<AGORA_AGENT_RTC_TOKEN>",
    "agent_rtc_uid": "999001",
    "remote_rtc_uids": ["1001"],
    "idle_timeout": 60
  },
  "parameters": {
    "vad": {
      "mode": "auto",
      "prefix_padding_ms": 300,
      "silence_duration_ms": 500
    },
    "stt": {
      "vendor": "deepgram",
      "model": "nova-3",
      "language": "en"
    },
    "llm": {
      "vendor": "openai",
      "model": "gpt-4o",
      "system_prompt": "You are 'Sarah', the exclusive leasing advisor for 250 Marina Boulevard...",
      "temperature": 0.6,
      "greeting": "Hello! Thanks for your interest in 250 Marina Boulevard. Are you looking to move in this month?",
      "tools": [
        {
          "name": "check_concession_eligibility",
          "description": "Calculate allowed discount based on lease length and move-in timeline.",
          "parameters": {
            "type": "object",
            "properties": {
              "lease_months": { "type": "integer" },
              "move_in_days": { "type": "integer" }
            },
            "required": ["lease_months"]
          }
        },
        {
          "name": "book_property_viewing",
          "description": "Schedule a tour for the buyer.",
          "parameters": {
            "type": "object",
            "properties": {
              "buyer_name": { "type": "string" },
              "buyer_phone": { "type": "string" },
              "preferred_datetime": { "type": "string" },
              "tour_type": { "type": "string", "enum": ["in_person", "virtual_video"] }
            },
            "required": ["buyer_name", "buyer_phone", "preferred_datetime"]
          }
        }
      ]
    },
    "tts": {
      "vendor": "cartesia",
      "model": "sonic-english",
      "voice_id": "a0e99841-438c-4a64-b679-ae501e7d6091"
    }
  }
}
```

---

## 4. Real Estate Tool Definitions & Execution

The LLM in the voice loop executes tools by invoking Next.js webhook endpoints:

| Tool Name | Trigger Condition | Execution Logic |
| :--- | :--- | :--- |
| **`check_concession_eligibility`** | Buyer asks "Can you do \$3,200?" or "Is rent negotiable?" | Evaluates `negotiation_matrices` table rules (e.g. 18-mo lease permits 5% discount). Returns approved offer or polite counter. |
| **`book_property_viewing`** | Buyer agrees to schedule a visit ("Can I see it this Friday?") | Validates slot availability, inserts record into `viewing_appointments`, returns confirmation code. |
| **`escalate_to_human_broker`** | Buyer is an enterprise/cash investor or requests human broker | Sends immediate SMS/email alert to property owner with call summary and caller phone. |

---

## 5. WebRTC Browser Client (`agora-rtc-sdk-ng`)

### 5.1 React Voice Call Controller Hook (`useAgoraVoiceAgent`)
- **Initialization**: Creates local audio track using `AgoraRTC.createMicrophoneAudioTrack()`.
- **Channel Join**: Joins channel and publishes local mic audio.
- **Remote Subscription**: Subscribes to `user-published` events where `user.uid === 999001` (the agent) and plays agent audio.
- **Audio Visualizer**: Uses Web Audio API `AnalyserNode` to compute real-time waveform bars for both caller and agent.
- **Turn Detection UI**: Detects who is actively speaking to render dynamic glowing visual indicators.
