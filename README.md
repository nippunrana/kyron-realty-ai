# 🏢 Kyron Realty AI

> **Autonomous Real Estate Intelligence with Real-Time Agora Voice Agents, Dynamic Mid-Call Retargeting, Twilio Telephony Bridging & Google Calendar Tour Scheduling**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![Agora](https://img.shields.io/badge/Agora-SD--RTN%20%26%20ConvoAI%20v2-099DFD?style=flat-square&logo=agora)](https://www.agora.io/)
[![Twilio Telephony](https://img.shields.io/badge/Twilio-PSTN%20%26%20Media%20Streams-F22F46?style=flat-square&logo=twilio)](https://www.twilio.com/)
[![Google Calendar](https://img.shields.io/badge/Google%20Calendar-Automated%20Scheduling-4285F4?style=flat-square&logo=google-calendar)](https://developers.google.com/calendar)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=flat-square&logo=drizzle)](https://orm.drizzle.team/)
[![Automated Tests](https://img.shields.io/badge/Tests-129%20Passing-success?style=flat-square&logo=node.js)](package.json)

<br/>

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_Production_App-2ea44f?style=for-the-badge&logo=google-chrome&logoColor=white)](https://egnitech.com/projects/kyron-realty-ai)

> 🚀 **Live Production Deployment:** **[https://egnitech.com/projects/kyron-realty-ai](https://egnitech.com/projects/kyron-realty-ai)**  
> *Experience the 24/7 AI Voice Sales Agent, conversational property onboarding studio, real-time Google Calendar booking, and live telephony manager bridging in production.*

<br/>

**[🌐 Live Demo](https://egnitech.com/projects/kyron-realty-ai)** &bull; **[🏛️ System Architecture](#️-system-architecture)** &bull; **[🎙️ Agora Voice Engine](#-agora-products--features-used)** &bull; **[📞 Three-Way Telephony Bridge](#-three-way-property-manager-telephony-call)** &bull; **[📅 Google Calendar Booking](#-voice-driven-google-calendar-tour-scheduling)** &bull; **[🚀 Quick Start](#-quick-start)**

---

## 🌐 Live Interactive Demo

You can explore and test the full application live in production with zero local setup:

🔗 **Production URL:** **[https://egnitech.com/projects/kyron-realty-ai](https://egnitech.com/projects/kyron-realty-ai)**

### Key Workflows to Test Live:
1. **Persistent Global Sales Agent (Sarah)**: 
   - Click **"Talk to Agent"** on any public page. Sarah connects via Agora SD-RTN WebRTC in under 800ms.
   - Seamlessly navigate between the Home page, Public Listings, and individual listing details—**the voice call persists without interruption**.
2. **Pure Voice GSAP Search Hub**:
   - Ask Sarah: *"Show me 3 BHK apartments for rent in Mumbai with pet-friendly rules under 60k."*
   - Watch the voice-driven search hub open automatically, display numbered results, and dynamically refine filters without touching a mouse or keyboard.
   - Say: *"Open result 2"* to let Sarah confirm and navigate straight to that home.
3. **Mid-Call Property Retargeting**:
   - When you land on a property page, Sarah's prompt swaps mid-call without dropping audio or rebilling the session.
   - Sarah evaluates your stated budget against the property's verified facts using our **code-computed fit verdict engine** (`adjustable`, `bridgeable`, or `hard miss`), and answers with real travel times from our **code-computed location value engine**.
4. **Three-Way Property Manager Telephony Call**:
   - Ask Sarah: *"Can I speak with the property manager?"*
   - Sarah initiates an outbound PSTN call via Twilio to the manager's phone.
   - The manager receives a private IVR whisper screening (*"Press 1 to connect, 2 if busy"*).
   - Once connected, Sarah announces the manager's arrival and gracefully transitions into **Observer Mode** with strict `[SILENT]` tags—remaining 100% silent while the humans speak, but instantly answering if addressed by name (*"Sarah, what was the security deposit again?"*).
5. **Automated Google Calendar Tour Scheduling**:
   - Say: *"I'd like to book a private viewing this Saturday afternoon."*
   - Sarah checks the owner's Google Calendar `freeBusy` schedule, proposes available 1-hour slots, and books the tour into Google Calendar and the database in real time.
6. **Conversational Onboarding Studio (Elena Vance)**:
   - Experience voice-guided listing creation for property owners—intake 6 core specifications conversationally, review hyper-local transit and neighborhood data synthesized by Gemini, and scan a QR code to upload photos directly from your smartphone.

---

## 📌 Overview

**Kyron Realty AI** replaces high-friction real estate forms, slow email inquiries, and fragmented broker communications with autonomous, real-time voice intelligence powered by **Agora SD-RTN**, **Google Gemini**, **Twilio Telephony**, and **Google Calendar**.

### Traditional Real Estate vs. Kyron Realty AI

| Capability | Traditional Real Estate | Kyron Realty AI (Voice-First Intelligence) |
| :--- | :--- | :--- |
| **Listing Onboarding** | 20–30 tedious manual fields with high drop-off rates | **Voice-guided conversational intake (Elena Vance)** completing listing creation in ~2 minutes with mobile QR photo upload |
| **Speed-to-Lead** | 12–48 hour delay via contact forms; lost buyer momentum | **Instant, sub-second voice connection (<800ms)** available 24/7 across every page |
| **Cross-Page Journey** | Voice widgets break or restart on page navigation | **Persistent root layout presence** maintaining active WebRTC sessions across route changes |
| **Pricing & Negotiations** | Manual broker phone tags for concession inquiries | **Code-computed fit verdict engine** bound by owner floor prices with exchange-of-value rules |
| **Location Claims** | Vague, subjective adjectives ("prime area", "posh locality") | **Code-computed location engine** quoting exact measured walking & driving times |
| **Manager Escalations** | "We'll have an agent call you back tomorrow" | **Live 3-way PSTN telephony bridging (Twilio + Agora RTC UID 888)** with private whisper screening and silent observer AI |
| **Tour Scheduling** | Email ping-pong for open tour slots | **Direct Google Calendar `freeBusy` tour booking** with zero calendar privacy exposure |
| **Accuracy & Trust** | Generic chatbots hallucinating policies and prices | **Strict zero-hallucination policy** grounded in verified database knowledge bases |

---

## 🎭 Dual Voice Agent Personas & Operational Modes

```mermaid
flowchart TD
    subgraph OwnerSide [Property Owners & Hosts]
        Owner[Property Owner] -->|Voice Onboarding Studio| Elena[Elena Vance<br/>Luxury Listing Specialist]
        Elena -->|Step 1| Specs[Core Specs Intake & Verification]
        Elena -->|Step 2| Local[Hyper-Local Transit & Amenity Synthesis]
        Elena -->|Step 3| QRUpload[Instant Mobile QR Photo Intake]
        QRUpload -->|1-Click Publish| DBListing[(Published Listing)]
    end

    subgraph BuyerSide [Prospective Buyers & Renters]
        Buyer[Prospective Buyer / Renter] -->|Global Voice Pod| Sarah[Sarah<br/>Senior Sales & Leasing Advisor]
        
        Sarah -->|Mode 1: Search Hub| GsapHub[Pure Voice GSAP Search<br/>• Sticky City Context<br/>• Numbered Results<br/>• Tag-Only Navigation]
        
        Sarah -->|Mode 2: Property Page| Retarget[Mid-Call Retargeting<br/>• Code-Computed Fit Engine<br/>• Code-Computed Location Engine<br/>• Dual-Thread Call Memory]
        
        Sarah -->|Mode 3: Telephony Bridge| Telephony[Three-Way Manager Call<br/>• Twilio PSTN Outbound Call<br/>• Private IVR Whisper Screening<br/>• Silent Observer Mode [SILENT]]
        
        Sarah -->|Mode 4: Tour Booking| Calendar[Google Calendar Tour Booking<br/>• Real-Time freeBusy Check<br/>• Append-Priority Confirmation]
    end

    DBListing -.-> Retarget
    DBListing -.-> GsapHub
```

### 1. Elena Vance — Principal Luxury Listing Specialist (Onboarding Studio)
- **Conversational Intake**: Guides owners through 6 core property specifications (listing type, address, price, bed/bath count, and square footage) conversationally without web form fatigue.
- **Dynamic UI Orchestration**: Programmatically controls on-screen modals (Core Specs Review Card and Full Property Specs Window) in sync with spoken conversation.
- **Hyper-Local Area Intelligence**: Synthesizes neighborhood commute hubs, transit lines, schools, and nearby amenities based on verified Google Maps Routes API distances.
- **Mobile QR Photo Upload**: Generates an instant mobile QR code allowing owners to snap and upload high-res property photos directly from their smartphone while continuing their voice conversation.

### 2. Sarah — Senior Sales & Leasing Advisor (Global Floating Presence)
Sarah is mounted at the root application layout (`src/components/sales/FloatingSalesAgent.tsx`), enabling her to stay connected across page navigations and operate across four sophisticated modes:

#### Mode A: Global Voice Search (`GsapSearchHub`)
- **100% Voice-Driven Showcase**: Controls an interactive, animated GSAP search overlay with zero manual inputs, buttons, or clickable chips.
- **Sticky City Context**: Locks search context to the current city once established, allowing fluid refinements (*"show pet-friendly"*, *"make it 3 bedrooms"*, *"under 50k"*) without repeating the location.
- **Numbered Results & Confirmation Gates**: Renders visible `Result N` badges; Sarah reads back the match and obtains buyer confirmation before navigating to the listing.

#### Mode B: Mid-Call Listing Retargeting
- **Silent Prompt Swap (`/update`)**: Swaps Sarah's prompt to the active property's knowledge base mid-call without dropping the Agora audio stream or rebilling.
- **Code-Computed Fit Verdict (`src/lib/property-fit.ts`)**: Code evaluates budget, bed count, and pet rules against owner guardrails into three deterministic severities:
  - `adjustable`: Inside authorized owner range — trades concessions for lease terms.
  - `bridgeable`: Within 10% of floor price — pivots to in-person viewing.
  - `hard miss`: Blocker named honestly — redirects buyer to other inventory.
  - *Strict Floor Security*: The owner's minimum floor price is **never** passed to the LLM prompt.
- **Code-Computed Location Value (`src/lib/location-value.ts`)**: Enforces measured transit and driving times; strictly forbids ungrounded status adjectives (*"posh"*, *"prime"*, *"luxury"*).
- **Dual-Thread Journey Memory (`src/lib/sales-journey.ts`)**: Preserves exact, uncompressed caller requirements while maintaining per-home visit notes.

#### Mode C: Three-Way Property Manager Telephony Call
- **Server-Side PSTN Dialing**: Initiates an outbound phone call to the property manager via Twilio using the silent `[CALL_MANAGER]` tag. Manager phone numbers are strictly protected server-side and never exposed to the client or LLM prompt facts.
- **Private IVR Whisper Screening**: The manager hears: *"Press 1 to connect, 2 if busy"*, ensuring customer calls are never exposed to voicemails or unprepared pickups.
- **Twilio Media Stream WebSocket Relay (`scripts/telephony-bridge/bridge.py`)**: Bridges 8kHz G.711 mu-law PSTN audio into the live Agora WebRTC channel (`UID 888`) via linear PCM resampling, enabling sub-second multi-party voice communication.
- **Server-Side Gemini STT & Agora `/think` Injection**: Because Agora Conversational AI cloud agents subscribe to a single remote WebRTC user (`userUid`), manager phone speech is transcribed in real time via acoustic VAD and Gemini STT in the bridge, then relayed to Sarah via the Agora `/think` REST API (`mode="context"` for silent listening or `mode="respond"` when addressed).
- **Silent Observer Mode (`[SILENT]`)**: Sarah introduces the manager, then transitions to Observer Mode. Between human dialogue, Sarah outputs `[SILENT]`, which Agora TTS and transcripts filter out. If either participant addresses her by name (*"Sarah, ..."*), checks her presence (*"Sarah, are you there?"*), or asks caller role questions, she answers immediately in 1–2 factual sentences before returning to silence.
- **PostgreSQL Session & Transcript Persistence**: Telephony status, Twilio Call SID, and manager transcripts are persisted to `voice_sessions` in PostgreSQL, enabling cluster-wide state synchronization across PM2 worker instances.
- **Unified Multi-Party Dialogue**: The web client (`useAgoraVoiceAgent`) renders chronologically sorted messages across buyer, Sarah, and property manager while stripping synthetic tags and ghost echo bubbles.

#### Mode D: Voice-Driven Google Calendar Tour Scheduling
- **Live `freeBusy` Availability**: Queries the host's Google Calendar API (`calendar.app.created` scope) and local bookings database to identify genuine 1-hour tour openings.
- **Zero Privacy Leakage**: Conflicting calendar events are presented strictly as "Booked" with zero attendee or event title information exposed.
- **Append-Priority Delivery**: Booking cues (`[TOUR_BOOKED:...]`) are dispatched with `append` priority to ensure Sarah completes her spoken sentences without mid-word interruptions.

---

## 🏛️ System Architecture

```mermaid
flowchart TB
    subgraph ClientBrowser [Browser Client — Next.js 16 / React 19]
        UserMic[User Microphone]
        UI[Interactive UI & Audio Visualizer]
        FloatAgent[Floating Sales Agent & Dialogue Stream]
        GSAP[GSAP Voice Search Hub]
        AgoraClient[Agora RTC & RTM Web SDKs]
        Toolkit[agora-agent-client-toolkit]
    end

    subgraph AgoraNetwork [Agora SD-RTN Global Real-Time Network]
        RTCChannel[Agora RTC Audio Channel]
        RTMStream[Agora RTM Signaling & Transcripts]
        ConvoGateway[Agora Conversational AI Cloud Gateway v2<br/>Dynamic AccessToken2 Authorization & /think REST API]
    end

    subgraph IntelligenceLayer [Speech & Intelligence Engine]
        ASR[Agora Native ASR / Ares / Deepgram]
        LLM[Google Gemini 3.5 Flash-Lite / OpenAI GPT-4o-mini]
        TTS[Agora Managed TTS / MiniMax speech-2.6-turbo]
    end

    subgraph TelephonyBridge [Twilio Telephony & Bridge Service]
        PSTN[Manager Phone / PSTN]
        TwilioVoice[Twilio Voice API & Media Streams]
        PyBridge[Python Telephony Bridge<br/>scripts/telephony-bridge/bridge.py<br/>Bidirectional 8kHz mu-law ⟷ 16kHz PCM]
        AgoraPySDK[Agora RTC Linux Python SDK<br/>Channel Participant UID 888]
    end

    subgraph BackendServices [Next.js 16 App Router Backend]
        API_Agora[/api/agora/session/start, stop, retarget]
        API_Telephony[/api/agora/telephony/call, webhook, bridge-event]
        API_Calendar[/api/properties/id/calendar/]
        TokenGen[Agora Dual RTC + RTM Token Generator]
        FitEngine[Property Fit & Location Value Engines]
    end

    subgraph ExternalServices [External Cloud Services]
        GCal[Google Calendar API v3]
        GMaps[Google Maps Routes API]
    end

    subgraph DatabaseLayer [Persistence & Storage]
        DB[(PostgreSQL 17 Database)]
        Drizzle[Drizzle ORM 0.40]
        Uploads[Local Persistent Uploads Storage]
    end

    %% Audio & Media Flows
    UserMic -->|Live WebRTC Audio| RTCChannel
    RTCChannel <-->|Bidirectional Audio| ConvoGateway
    ConvoGateway -->|Speech Audio| ASR
    ASR -->|Transcribed Text| LLM
    LLM -->|Streamed Tokens| TTS
    TTS -->|Synthesized Audio| ConvoGateway
    ConvoGateway -->|Live Transcripts & Tags| RTMStream
    RTMStream --> Toolkit --> FloatAgent & GSAP & UI

    %% Telephony Bridge Flow
    PSTN <-->|PSTN Call| TwilioVoice
    TwilioVoice <-->|WebSocket Media Stream| PyBridge
    PyBridge <-->|Raw PCM Audio Frames| AgoraPySDK
    AgoraPySDK <-->|Agora WebRTC Stream UID 888| RTCChannel
    PyBridge -->|VAD + Gemini STT Transcriptions| API_Telephony

    %% Backend Control Flows
    UI -->|Start/Retarget Call| API_Agora
    FloatAgent -->|Call Manager Tag| API_Telephony
    FloatAgent -->|Book Tour Tag| API_Calendar
    API_Telephony --> TwilioVoice
    API_Telephony -->|REST /think Context & Respond| ConvoGateway
    API_Telephony -->|Persist Sessions & Transcripts| DB
    API_Calendar --> GCal
    API_Agora --> TokenGen
    API_Agora --> FitEngine
    API_Agora -->|REST /join, /update, /leave| ConvoGateway
    TokenGen --> DB
    Drizzle --> DB
```

---

## 🎙️ Agora Products & Features Used

Kyron Realty AI relies strictly on an **Agora-Only Conversational AI Architecture** (zero browser speech fallbacks):

| Agora Product / Feature | Implementation Details |
| :--- | :--- |
| **Conversational AI Cloud Gateway v2** | Full lifecycle orchestration via Agora REST APIs (`/v2/projects/{appId}/join`, `/leave`, and `/update`). Enables mid-call prompt swapping and retargeting without dropping active WebRTC connections. |
| **Conversational AI `/think` REST API** | Enables dynamic injection of external speaker text and instructions into the running agent without interrupting active audio. Features dual action modes (`mode="respond"` with `on_listening_action: "interrupt"` for instant answers when addressed, and `mode="context"` with `on_listening_action: "append"` for silent contextual awareness). |
| **Dynamic Token Authentication (`AccessToken2`)** | Cloud Gateway REST requests are signed dynamically using `agora-token` AccessToken2 authorization (`buildAgoraCloudAuthHeader`), requiring only `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE`. |
| **Voice / WebRTC (`agora-rtc-sdk-ng`)** | Ultra-low latency bi-directional audio capture, live frequency visualizers, dual-participant audio rendering, and sub-second agent speech playback. |
| **Real-Time Messaging (`agora-rtm`)** | Full signaling and transcript streaming via dual-token authentication. Powers live captions, turn detection, silent tag dispatching (`[SEARCH]`, `[CALL_MANAGER]`, `[TOUR_BOOKED]`), and append-priority cues. |
| **Agora Managed Text-to-Speech (TTS)** | Ultra-natural speech synthesis powered by **Agora Managed TTS** (MiniMax `speech-2.6-turbo`) out-of-the-box with zero third-party cloud subscription keys required. Optional BYOK support for ElevenLabs, Cartesia, and Azure Neural TTS. |
| **Agora Native Speech-to-Text (ASR)** | Real-time English speech recognition via Agora's native ASR (`ares`) with optional BYOK support for Deepgram Nova-3. |
| **Agora RTC Python SDK** | Powers the background telephony bridge (`scripts/telephony-bridge/bridge.py`), joining the Agora RTC channel as a pre-mixed audio participant (`UID 888`) to bridge PSTN phone calls. |
| **Fail-Fast Error Handling** | Strict policy: If Agora WebRTC or Cloud Gateway connectivity fails, the call fails explicitly with DB session marking and user notifications. No fake assistant reply scripts or browser speech synthesis fallbacks are permitted. |

---

## 📞 Three-Way Property Manager Telephony Call

The telephony integration enables live, seamless handoffs between prospective buyers in the web browser and human property managers on their mobile phones:

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Buyer (Browser WebRTC)
    participant Sarah as Sarah (Agora ConvoAI)
    participant Server as Next.js API & PostgreSQL
    participant Bridge as Python Bridge (UID 888)
    participant Twilio as Twilio PSTN Gateway
    actor Manager as Property Manager (+91 Phone)

    Buyer->>Sarah: "Can I speak directly with the property manager?"
    Sarah->>Server: Silent Tag [CALL_MANAGER:property_id=...] (via RTM)
    Server->>Twilio: Initiate Outbound Call via Twilio REST API
    Twilio->>Manager: Dials Phone Number
    Manager->>Twilio: Answers Phone
    Twilio->>Manager: Private Whisper: "Press 1 to connect, 2 if busy"
    Manager->>Twilio: Presses '1'
    Twilio->>Server: Webhook /api/agora/telephony/webhook
    Server->>Twilio: Returns TwiML <Connect><Stream> to Python Bridge
    Twilio->>Bridge: Opens WebSocket Audio Stream (8kHz G.711 mu-law)
    Bridge->>Bridge: Resamples 8kHz mu-law ⟷ 16kHz linear PCM
    Bridge->>Sarah: Joins Agora RTC Channel as UID 888
    Sarah->>Buyer: "The property manager has joined the call. I'm here if you need me!"
    Server->>Sarah: Swaps Prompt to Observer Mode via Agora REST /update
    Server->>Server: Persists active session state to voice_sessions table
    
    rect rgb(240, 248, 255)
        Note over Buyer,Manager: Three-Way Audio Call Active
        Buyer<->Bridge: Bidirectional Spoken Audio via Agora RTC (UID 888)
        Bridge<->Twilio: Bidirectional Audio Stream (8kHz mu-law)
        Twilio<->Manager: PSTN Audio (Buyer and Manager speak directly)
        
        Note over Bridge,Sarah: Real-Time Cognition & Observer Mode
        Manager->>Twilio: Manager speaks to Buyer
        Twilio->>Bridge: Phone Audio Frames
        Bridge->>Bridge: Acoustic VAD + Gemini Real Estate STT
        Bridge->>Server: Transcribed Utterance via /bridge-event
        Server->>Server: Appends to PostgreSQL voice_sessions.manager_transcripts
        Server->>Sarah: Injects Context via Agora REST /think (mode="context")
        Sarah-->>Sarah: Emits [SILENT] (filtered from audio & transcripts)
        
        Note over Buyer,Sarah: Direct Human Query to Agent
        Buyer->>Sarah: "Sarah, are you there?"
        Sarah->>Buyer: "Yes, I'm here! How can I help you both?"
        Sarah->>Bridge: Audio on RTC Channel (Manager hears Sarah)
        
        Note over Manager,Sarah: Phone Manager Query to Agent
        Manager->>Twilio: "Sarah, what was the security deposit again?"
        Twilio->>Bridge: Audio Stream
        Bridge->>Bridge: VAD + Gemini STT ("Sarah, what was the security deposit again?")
        Bridge->>Server: Dispatches /bridge-event
        Server->>Sarah: Dispatches /think (mode="respond", on_listening_action="interrupt")
        Sarah->>Buyer: "The security deposit is two months rent."
        Sarah->>Bridge: Broadcasts on RTC Channel (Manager hears answer)
        Sarah-->>Sarah: Returns immediately to [SILENT] Observer Mode
    end

    Manager->>Twilio: Hangs up call
    Twilio->>Bridge: Closes WebSocket
    Bridge->>Sarah: Releases UID 888 from Agora RTC Channel
    Server->>Sarah: Reverts Prompt to Sales Agent Mode via /update
    Server->>Server: Updates voice_sessions telephony_status to 'completed'
    Sarah->>Buyer: "Hope that was helpful! Would you like to schedule a viewing or explore other listings?"
```

### Key Architectural Pillars:
- **Zero Client Phone Disclosure**: The manager's phone number is retrieved and dialed strictly server-side (`src/lib/agora-telephony.ts`). It is never passed to the client browser or serialized in listing discovery JSON, and Sarah's prompt facts carry only `hasManagerPhone: boolean` so the LLM physically cannot leak or hallucinate the number.
- **Private Whisper Screening Before Bridge**: The manager is dialed on PSTN (+91 Indian E.164 numbers) via Twilio and screened with a private IVR whisper (*"Press 1 to connect, 2 if busy"*). The manager is only bridged into the Agora WebRTC channel (`UID 888`) after pressing 1, preventing ringing, voicemails, or unprepared pickups on the live customer call.
- **Twilio Media Stream WebSocket Relay (`scripts/telephony-bridge/bridge.py`)**: Bridges bidirectional audio between 8kHz G.711 mu-law and 16kHz linear PCM into Agora RTC channel `UID 888` on the server, avoiding SIP DNS lookup failures and providing clean audio mixing.
- **Acoustic VAD & Gemini Real-Estate STT**: The Python bridge employs adaptive voice activity detection (280 energy threshold, 960ms silence window, hangover buffer) and Gemini STT primed with real-estate terminology (deposit, rent, carpet area, lease) and phonetic name normalization for "Sarah", relaying transcribed speech to `/api/agora/telephony/bridge-event`.
- **Agora Conversational AI `/think` Dynamic Relay**: Because Agora's cloud agent runtime subscribes to a single remote WebRTC participant (`userUid`), manager phone speech is transcribed and relayed to Sarah via Agora's official `/think` REST API. Contextual dialogue is injected with `mode="context"` (`on_listening_action: "append"`), while direct queries use `mode="respond"` (`on_listening_action: "interrupt"`) to yield instantaneous verbal answers.
- **Silent Observer Mode (`[SILENT]`)**: Once bridged, Sarah introduces the manager before transitioning to Observer Mode (`buildObserverPrompt`). Between human turns, Sarah emits `[SILENT]`, which Agora TTS skips via `skip_patterns: [4]` and the dialogue stream drops via bracket filtering. When either person addresses her by name (*"Sarah, ..."*), checks her presence (*"Sarah, are you there?"*), or asks caller identity questions (*"Do you know who I am?"*), she answers in 1–2 factual sentences before returning immediately to silent observation.
- **PostgreSQL Session & Transcript Persistence**: Telephony status, Twilio Call SID, and manager transcripts are persisted directly to PostgreSQL `voice_sessions`, ensuring cluster-wide resilience across PM2 worker processes and unified multi-party transcripts.
- **Unified Multi-Party Dialogue & Ghost Bubble Elimination**: The web client (`useAgoraVoiceAgent`) renders chronologically sorted messages across buyer, Sarah, and manager while filtering out synthetic tags and ghost echo bubbles (`Property Manager:` prefixes).

---

## 📅 Voice-Driven Google Calendar Tour Scheduling

Kyron Realty AI connects prospective buyers directly to property owners' real-time schedules:

- **Granular Consent (`calendar.app.created`)**: Strictly confines application writes to the dedicated calendar created for Kyron Realty AI. Never accesses or tampers with the owner's personal events.
- **Dynamic `freeBusy` Availability**: Sarah queries Google Calendar `freeBusy` across the host's primary calendar and Kyron calendar in combination with local database bookings to detect genuinely open 1-hour slots.
- **Anti-Interruption Flow**: Booking confirmation cues (`[TOUR_BOOKED:...]`) are dispatched with `append` priority, allowing Sarah to conclude her explanation smoothly before acknowledging the confirmation.
- **Privacy Guaranteed**: Conflicting slots are rendered strictly as "Booked" with zero attendee information, summaries, or descriptions exposed.

---

## 🛠️ Tech Stack

- **Frontend Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19, TypeScript)
- **Voice & Real-Time Media**: [Agora SD-RTN](https://www.agora.io/) (`agora-rtc-sdk-ng`, `agora-rtm`, `agora-agent-client-toolkit`, `agora-token`)
- **Telephony & PSTN Bridge**: [Twilio Voice](https://www.twilio.com/) (Media Streams WebSocket) + Python 3 (`agora-rtc-sdk`, `websockets`, `scipy`, `numpy`)
- **Artificial Intelligence**: Google Gemini 3.5 Flash-Lite (`@google/genai`) / OpenAI GPT-4o-mini
- **Calendar & Maps**: Google Calendar API v3, Google Maps Routes & Embed APIs
- **Database & Storage**: PostgreSQL 17, [Drizzle ORM](https://orm.drizzle.team/), `postgres.js`
- **Animation & Styling**: [GSAP](https://greensock.com/gsap/) (`gsap`, `@gsap/react`), [Tailwind CSS v4](https://tailwindcss.com/), Lucide Icons
- **Authentication**: NextAuth v5 (NextAuth Credentials + Google OAuth with automatic calendar token linkage)
- **Process Management & Hosting**: Ubuntu VPS, PM2 Cluster (`ecosystem.config.cjs`), Nginx Reverse Proxy, GitHub Actions CI/CD

---

## 📂 Codebase Architecture

```
kyron-realty-ai/
├── src/
│   ├── app/
│   │   ├── (auth)/login/             # NextAuth authentication pages
│   │   ├── api/
│   │   │   ├── agora/                # Agora session lifecycle (start, stop, retarget)
│   │   │   │   └── telephony/        # Twilio outbound calls, TwiML webhooks, bridge events & status
│   │   │   ├── auth/                 # NextAuth route handlers & Google token persist
│   │   │   ├── properties/           # Property queries, search, and calendar slots
│   │   │   └── leads/                # Lead & booking capture endpoints
│   │   ├── dashboard/                # Protected owner portal (inventory, onboarding)
│   │   ├── listings/                 # Public listing discovery & [slug] property pages
│   │   ├── privacy/ & terms/         # Public legal pages (Google OAuth verified)
│   │   ├── layout.tsx                # Root layout mounting FloatingSalesAgent
│   │   └── page.tsx                  # High-conversion luxury landing page
│   ├── components/
│   │   ├── dashboard/                # Property management & onboarding studio
│   │   ├── home/                     # Speed-to-lead comparison, interactive simulator
│   │   ├── public/                   # Public listing hero, specs, and tour scheduler
│   │   ├── sales/                    # FloatingSalesAgent, GsapSearchHub, DialogueStream
│   │   └── voice/                    # Agora RTC audio visualizer & control pods
│   ├── db/
│   │   ├── index.ts                  # PostgreSQL connection pool with Drizzle ORM
│   │   └── schema.ts                 # Single source of truth for all database tables
│   ├── hooks/
│   │   ├── useAgoraVoiceAgent.ts     # Agora WebRTC, RTM & multi-party transcript hook
│   │   ├── voice-intents.ts          # Voice intent tag parsing ([SEARCH], [CALL_MANAGER], etc.)
│   │   ├── voice-transcript.ts       # Multi-role transcript formatting & ghost bubble filtering
│   │   └── audio-visualizer.ts       # Web Audio API frequency visualizer
│   └── lib/
│       ├── agora-agent-client.ts     # Agora ConvoAI Cloud Gateway REST API client (/join, /update, /think)
│       ├── agora-telephony.ts        # Twilio telephony dialer, whisper TwiML & DB session persistence
│       ├── agora-token.ts            # Dynamic AccessToken2 generator for RTC, RTM & Cloud REST
│       ├── calendar-service.ts       # Google Calendar freeBusy & booking engine
│       ├── google-calendar.ts        # Google OAuth credential refresh & calendar link
│       ├── property-fit.ts           # Deterministic property fit verdict calculator
│       ├── location-value.ts         # Code-computed travel time & service density engine
│       ├── sales-journey.ts          # Dual-thread caller journey memory manager
│       ├── sarah-search-prompt.ts    # Sarah Global Voice Search mode prompt
│       └── sarah-property-prompt.ts  # Sarah Listing Retargeting & Observer mode prompts
├── scripts/
│   ├── telephony-bridge/             # Python Twilio-to-Agora audio bridge service
│   │   ├── bridge.py                 # WebSocket Media Stream relay + Agora Python RTC UID 888
│   │   └── requirements.txt          # Python dependencies (agora-rtc-sdk, websockets, scipy)
│   ├── test-calendar-booking.ts      # Automated calendar booking round-trip verification
│   ├── test-twilio-call.ts           # Automated Twilio outbound call verification
│   └── eval-elena-prompt.ts          # Onboarding synthesis prompt evaluation
├── docs/
│   └── built-systems/                # Detailed rules & constraints for all built systems
├── ecosystem.config.cjs              # PM2 cluster configuration for Next.js & Python bridge
└── package.json                      # Project dependencies and verification scripts
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (LTS)
- Python 3.10+ (for Twilio telephony bridge service)
- PostgreSQL 17 instance
- Agora Developer Account ([console.agora.io](https://console.agora.io/))
- Google Cloud Console Project (with Google Calendar API & OAuth 2.0 enabled)
- Twilio Account (with an active phone number)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/nippunrana/kyron-realty-ai.git
cd kyron-realty-ai

# Install Node.js dependencies
npm install

# (Optional) Install Python telephony bridge dependencies
pip3 install -r scripts/telephony-bridge/requirements.txt
```

### 2. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```
Open `.env` and fill in your credentials:
```ini
# PostgreSQL 17 Database
DATABASE_URL="postgres://user:password@localhost:5432/kyron_realty_ai"

# Application Base Path (Runs under subpath prefix)
NODE_ENV="development"
PORT=3000
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000/projects/kyron-realty-ai"
AUTH_SECRET="your-32-byte-hex-secret"

# Agora Cloud Gateway & RTC Credentials
# Dynamic Token Auth generates AccessToken2 headers automatically
AGORA_APP_ID="your_agora_app_id"
AGORA_APP_CERTIFICATE="your_agora_app_certificate"

# Google Gemini API
GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="gemini-3.5-flash-lite"

# Google OAuth & Calendar Integration
AUTH_GOOGLE_ID="your_google_oauth_client_id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="your_google_oauth_client_secret"

# Twilio Telephony Integration
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_PHONE_NUMBER="+14155552671"
```

> **Note on Voice Synthesis**: No third-party TTS subscription key is required! By default, the application automatically uses **Agora Managed TTS** (MiniMax `speech-2.6-turbo`).

### 3. Database Migrations
```bash
npm run db:generate   # Generate schema migrations
npm run db:migrate    # Apply migrations to PostgreSQL
npm run db:studio     # (Optional) Open visual Drizzle Studio
```

### 4. Start Development Servers

**Terminal 1 — Next.js Application:**
```bash
npm run dev
```
Open [http://localhost:3000/projects/kyron-realty-ai](http://localhost:3000/projects/kyron-realty-ai) to access the application.

**Terminal 2 — (Optional) Python Telephony Bridge:**
```bash
BRIDGE_PORT=3005 python3 scripts/telephony-bridge/bridge.py
```

---

## 🧪 Testing & Automated Verification

The repository features an automated test suite verifying voice intent handling, property fit calculations, location value determinations, and prompt safety rules:

```bash
# Run the complete test suite (129 passing tests)
npm run test:intents

# Run ESLint pure-render validation
npm run lint

# Run Knip dead code and unused export analysis
npm run lint:unused

# Build Next.js standalone production bundle
npm run build
```

---

## 🌐 Production Deployment & Subpath Hosting

The application is deployed with Next.js standalone mode under the subpath prefix **`/projects/kyron-realty-ai`**:

### PM2 Process Manager (`ecosystem.config.cjs`)
In production, PM2 manages both the Next.js standalone cluster and the Python telephony bridge service:
```bash
# Reload or start services with updated environment variables
pm2 reload ecosystem.config.cjs --update-env
```

### CI/CD Deployment Pipeline (`.github/workflows/deploy.yml`)
Every push to `main` triggers automated GitHub Actions deployment to the production VPS with zero-downtime execution following 5 strict gates:
1. `npm run lint`: Zero ESLint errors (enforcing React 19 render purity).
2. `npm run lint:unused`: Knip dead-code & unused export audit.
3. `npm run test:intents`: 129 automated tests for voice intents, fit verdicts, and prompt contracts.
4. `npm run build`: Strict TypeScript verification and standalone build generation.
5. **Agora Policy Gate**: Verifies zero browser speech synthesis or speech recognition APIs exist in `src/`.

---

## 🤝 Acknowledgments

- Built with [Agora](https://www.agora.io/) SD-RTN Real-Time Voice and Conversational AI Cloud Gateway.
- Powered by [Google Gemini](https://ai.google.dev/) for intelligent property synthesis and reasoning.
- Telephony integration powered by [Twilio](https://www.twilio.com/) Voice Media Streams.
- Calendar synchronization powered by [Google Calendar API](https://developers.google.com/calendar).
