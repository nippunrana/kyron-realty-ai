# AgoraRealty AI — Technical Architecture & Agora Agents SDK Implementation

## 1. High-Level Architecture Overview

AgoraRealty AI leverages Agora's ultra-low-latency Software Defined Real-Time Network (SD-RTN) and the newly released **Agora Agents SDK** to orchestrate real-time speech-to-speech sales interactions.

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                      |
|  - WebRTC Browser Client / Mobile SDK / SIP Phone Inbound                         |
|  - Real-Time Audio Streaming (Opus 48kHz) via Agora Channel                       |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        AGORA CONVERSATIONAL AI ENGINE (SD-RTN)                    |
|  - Ultra-Low Latency Media Routing (<100ms global latency)                        |
|  - Real-Time Voice Activity Detection (VAD) & Natural Interruption Handling       |
|  - Dynamic Token Signing & Automatic Channel Session Lifecycle                    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                          AGORA AGENTS SDK PIPELINE                                |
|                                                                                   |
|  [ MODE A: MODULAR PIPELINE ]             [ MODE B: MULTIMODAL REALTIME ]        |
|  - STT: Deepgram Nova-3                   - MLLM: OpenAI Realtime / Gemini Live   |
|  - LLM: GPT-4o / Claude 3.5 Sonnet        - Direct Audio-in to Audio-out          |
|    with Real Estate Tools                 - Sub-300ms Conversational Latency      |
|  - TTS: Cartesia / MiniMax                                                        |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                       APPLICATION & BUSINESS LOGIC LAYER                          |
|  1. Property Database RAG: PostgreSQL / Vector DB for Flat Inventory & Amenities |
|  2. Adaptive Concession Matrix: Dynamic Give-Get Pricing Engine & Guardrails      |
|  3. Scheduling & CRM: Google Calendar / Calendly API, HubSpot / Follow Up Boss    |
|  4. Live Escalation Sentinel: Sentiment Analyzer & Agora Multi-Party Bridge       |
+-----------------------------------------------------------------------------------+
```

---

## 2. Implementation with Agora Agents SDK (Python)

Below is the production-ready code structure using the `agora-agents` Python SDK:

```python
import os
import time
from agora_agent import Agora, Agent, Area
from agora_agent.utils import expires_in_hours
from agora_agent.agentkit import DeepgramSTT, CartesiaTTS, OpenAI

# 1. Initialize Agora Client with dynamic authentication
APP_ID = os.getenv("AGORA_APP_ID")
APP_CERTIFICATE = os.getenv("AGORA_APP_CERTIFICATE")

client = Agora(
    area=Area.US,
    app_id=APP_ID,
    app_certificate=APP_CERTIFICATE,
)

# 2. Define Agent Persona & Real Estate System Prompt
AGENT_PROMPT = """
You are 'Sarah', a senior leasing and property sales advisor at Skyline Properties.
Your goal is to qualify inbound callers, answer questions about available flats (Buy & Rent),
and negotiate lease terms/pricing within strict broker concession rules.

Key Guidelines:
1. Always be conversational, polite, and direct.
2. If a customer interrupts or changes their requirements (budget, move-in date, pets), adapt immediately.
3. If a customer objects to pricing, use the 'Exchange of Value' principle:
   - Offer a 5% discount ONLY if they commit to an 18+ month lease.
   - Offer waived parking fee ($200/mo) ONLY if they move in within 7 days.
   - If they remain below the floor price, pivot to an alternative matching flat.
4. When qualified, offer two specific time slots for an in-person viewing.
5. If the caller is an enterprise investor or cash buyer over $1M, initiate a warm transfer.
"""

GREETING = "Hello! Thanks for calling Skyline Properties. Are you looking to rent or buy a flat today?"

# 3. Build the Typed Voice Agent Pipeline
agent = (
    Agent(client=client, turn_detection={"language": "en-US", "mode": "vad", "prefix_padding_ms": 300})
    .with_stt(
        DeepgramSTT(
            model="nova-3",
            language="en",
        )
    )
    .with_llm(
        OpenAI(
            model="gpt-4o",
            system_messages=[{"role": "system", "content": AGENT_PROMPT}],
            greeting_message=GREETING,
            failure_message="One second while I check our current availability.",
            max_history=40,
            params={
                "temperature": 0.6,
                "max_tokens": 512,
            },
        )
    )
    .with_tts(
        CartesiaTTS(
            model="sonic-english",
            voice_id="a0e99841-438c-4a64-b679-ae501e7d6091",  # Warm, professional tone
        )
    )
)

# 4. Launch Channel Session with Automatic Token Handling
def start_realty_session(channel_name: str, user_uid: str):
    session = agent.create_session(
        channel=channel_name,
        agent_uid="999001",
        remote_uids=[user_uid],
        name=f"realty-call-{int(time.time())}",
        idle_timeout=45,
        expires_in=expires_in_hours(2),
        debug=False,
    )
    return session.start()
```

---

## 3. Implementation with Multimodal Pipeline (`.with_mllm`)

For scenarios requiring ultra-low latency (<300ms) and emotional tone detection, Agora Agents SDK supports direct Speech-to-Speech:

```python
from agora_agent.agentkit import OpenAIMultimodal

# Direct Multimodal Realtime Pipeline
mllm_agent = (
    Agent(client=client, turn_detection={"language": "en-US"})
    .with_mllm(
        OpenAIMultimodal(
            model="gpt-4o-realtime-preview",
            voice="alloy",
            instructions=AGENT_PROMPT,
            greeting_message=GREETING,
            temperature=0.7,
        )
    )
)
```

---

## 4. Real Estate Tool Calling Definition

In Modular Mode, the LLM has access to custom tools:

```json
[
  {
    "type": "function",
    "function": {
      "name": "search_flats",
      "description": "Search available flats by listing type, bedrooms, max price, pet policy, and location.",
      "parameters": {
        "type": "object",
        "properties": {
          "listing_type": { "type": "string", "enum": ["rent", "sale"] },
          "bedrooms": { "type": "integer" },
          "max_price": { "type": "number" },
          "pets_allowed": { "type": "boolean" },
          "neighborhood": { "type": "string" }
        },
        "required": ["listing_type", "bedrooms", "max_price"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "book_property_viewing",
      "description": "Book an in-person or video walkthrough with the property manager.",
      "parameters": {
        "type": "object",
        "properties": {
          "flat_id": { "type": "string" },
          "customer_name": { "type": "string" },
          "customer_phone": { "type": "string" },
          "slot_datetime": { "type": "string", "description": "ISO 8601 formatted datetime" }
        },
        "required": ["flat_id", "customer_name", "slot_datetime"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "escalate_to_human_broker",
      "description": "Bridge a licensed human broker into the Agora voice channel for VIP buyers.",
      "parameters": {
        "type": "object",
        "properties": {
          "buyer_name": { "type": "string" },
          "deal_value": { "type": "number" },
          "summary_notes": { "type": "string" }
        },
        "required": ["deal_value", "summary_notes"]
      }
    }
  }
]
```
