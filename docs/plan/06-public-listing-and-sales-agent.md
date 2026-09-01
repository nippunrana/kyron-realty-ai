# 06. Public Listing Experience & Buyer Voice Sales Agent

## 1. High-Converting Public Listing Page (`/listings/[slug]`)

The public listing is designed for rapid mobile loading and maximum lead conversion from QR code scans and WhatsApp links:

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│  [← Back to Portal]               KYRON REALTY AI              [Share / QR Code]  │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│   ┌───────────────────────────────┐  ┌─────────────────────────────────────────┐  │
│   │                               │  │ 250 Marina Boulevard, San Francisco     │  │
│   │     [High-Res Hero Photo]     │  │ $3,450 / month • 2 Bed • 2 Bath • 1,150sf│  │
│   │                               │  │ Available Nov 1st • Pet Friendly        │  │
│   └───────────────────────────────┘  └─────────────────────────────────────────┘  │
│   [Thumbnail 1] [Thumbnail 2] [Thumbnail 3] [Virtual Tour Link]                   │
│                                                                                   │
│   ┌────────────────────────────────────────────────────────────────────────────┐  │
│   │ ⚡ 24/7 AI SALES CONCIERGE                                                 │  │
│   │ Have questions about utilities, lease terms, or want to schedule a visit?   │  │
│   │                                                                            │  │
│   │      [ 🎙️ TALK TO AI AGENT ]          [ 💬 Chat Online ]                    │  │
│   └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
│   • Property Features: In-unit W/D, EV Charging, Panoramic Bay Views, Hardwood    │
│   • Neighborhood Insights: 98 WalkScore, 5-min walk to Marina Green               │
│   • Verified Landlord Policies & Application Steps                                │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Marketing & Distribution Toolkit

### 2.1 Instant QR Code Generator
- Located in the Owner Dashboard for every listing.
- Generates high-resolution vector SVG and PNG printable for:
  - Yard signs & "For Rent / For Sale" boards.
  - Broker flyers & open-house window posters.
- Direct URL encoded: `${ORIGIN}/projects/kyron-realty-ai/listings/${slug}`.

### 2.2 WhatsApp & Social Share Deep Link
One-click WhatsApp share generates rich cards with OpenGraph preview:
```
"🏡 Just Listed: 250 Marina Boulevard, SF!
2 Bed | 2 Bath | Luxury Finishes | $3,450/mo.

Tap here to explore photos and speak directly with our 24/7 Voice AI Agent for instant answers & viewing bookings:
https://egnitech.com/projects/kyron-realty-ai/listings/marina-loft"
```

---

## 3. Interactive Voice Sales Modal

When a prospective buyer taps **"Talk to AI Agent"**:

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                               KYRON AI VOICE CONCIERGE                            │
│                                "Sarah - Leasing Specialist"                       │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│                        ((((   LIVE AUDIO VISUALIZER   ))))                        │
│                                                                                   │
│   Agent Speaking: "Hello! Thanks for checking out 250 Marina Blvd. Are you        │
│   looking for an immediate move-in, or exploring for next month?"                 │
│                                                                                   │
│   ─────────────────────────────────────────────────────────────────────────────   │
│   Live Transcript Stream:                                                         │
│   [Buyer]: "Hi Sarah, does this unit come with assigned parking and is pet ok?"   │
│   [Sarah]: "Yes! It includes one reserved garage spot, and both dogs and cats     │
│             are welcome under 50 lbs with a small deposit."                       │
│                                                                                   │
├───────────────────────────────────────────────────────────────────────────────────┤
│    [ 🔇 Mute Mic ]             [ 🔴 End Call ]             [ 📅 Book Viewing ]    │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. AI Sales Persona & Negotiation Engine

### 4.1 System Persona Prompt Template
```markdown
You are 'Sarah', a top-performing real estate leasing and sales specialist representing this specific property.
Your mission is to inform, build excitement, answer questions truthfully using the provided knowledge base, and convert the caller into a booked in-person viewing.

CORE RULES:
1. Tone: Warm, professional, articulate, and direct. Keep spoken answers concise (1-3 sentences).
2. Grounding: ONLY state facts contained in the property knowledge base. If unknown, offer to have the human broker follow up.
3. Exchange-of-Value Negotiation:
   - Target price: {{target_price}}. Hard floor price: {{min_floor_price}}.
   - NEVER drop the price without asking for an exchange (e.g. "I can discuss a 5% discount if you're open to an 18-month lease—would that timeline work for you?").
4. Closing: When the buyer shows strong interest, proactively offer two tour time slots.
```

### 4.2 Lead & Appointment Capture Workflow
1. When the buyer agrees to a tour slot, the agent calls `book_property_viewing`.
2. Asks for buyer's First & Last Name and Phone Number.
3. Automatically writes record to `inquiries_and_leads` and `viewing_appointments`.
4. The owner receives an instant notification with lead quality score and recording transcript.
