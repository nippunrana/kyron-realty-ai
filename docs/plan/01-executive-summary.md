# 01. Executive Summary & Vision

## 1. Project Overview
**Kyron Realty AI** is a voice-first real estate intelligence and sales platform built for the Agora Hackathon. It bridges property owners/brokers and prospective buyers/renters through real-time conversational AI voice agents powered by **Agora SD-RTN**, **Agora Conversational AI Cloud Gateway**, and **Apify Web Scraping**.

---

## 2. The Core Problem & Solution

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                                 THE OLD WAY                                       │
│  - Static listing forms require 30+ minutes of manual data entry per property.     │
│  - Inquiries sit in CRM inboxes for hours or days; 78% of leads bounce.           │
│  - Human agents repeat identical property specs 50x/day.                          │
│  - No instant voice qualification or after-hours negotiation.                     │
└───────────────────────────────────────────────────────────────────────────────────┘
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                             KYRON REALTY AI SOLUTION                              │
│  1. Conversational Onboarding Studio (Voice / Text + URL Scraping via Apify).      │
│  2. Instant Knowledge Base & Negotiation Guardrail Generation.                    │
│  3. Physical & Digital Marketing: Instant QR Codes & WhatsApp Share Cards.        │
│  4. 24/7 Real-Time Agora Voice Sales Agent (<300ms latency, handles Q&A,         │
│     exchange-of-value price negotiation, and books viewing tours directly).       │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Dual User Journeys

### Journey A: Property Owner / Broker (Dashboard Onboarding)
1. **Access Studio**: Owner navigates to `/dashboard/properties/new` in the authenticated workspace.
2. **Conversational Ingestion**:
   - **Path 1 (Instant URL)**: Owner pastes an existing listing URL (e.g. broker site, Zillow, portal) → Apify Website Content Crawler extracts raw markdown and images in seconds → AI structures the data.
   - **Path 2 (Voice/Text Interview)**: Owner talks or chats with the AI Onboarding Bot, answering questions regarding sale vs. rent, price, floor plan, pet rules, amenities, and concession limits.
3. **Real-Time Live Inspector**: As the interview progresses, a split-screen live preview card dynamically populates with extracted facts, photos, and synthesized knowledge bases.
4. **Publish & Share**: Listing is published; owner gets an instant high-res QR code, WhatsApp promotional card, and unique link (`/listings/[slug]`).

### Journey B: Prospective Buyer / Renter (Public Listing & AI Voice Agent)
1. **Discovery**: Buyer scans QR code on yard sign/flyer or taps WhatsApp link.
2. **Public Listing**: Browser opens `/listings/[slug]` displaying photo carousel, key specs, pricing, and verified amenities.
3. **Instant Voice Conversation**: Buyer clicks **"Talk to AI Agent"** → Agora WebRTC connection activates instantly.
4. **Intelligent Sales Dialogue**:
   - Natural spoken conversation with sub-300ms latency.
   - Buyer asks questions ("Are utilities included?", "What's the parking situation?", "Is the price negotiable?").
   - AI answers accurately using the property's deep knowledge base.
   - AI employs the **Exchange of Value** negotiation matrix (e.g., offering a concession only in exchange for a longer lease or quick move-in).
5. **Lead Capture & Tour Booking**: AI collects buyer contact info and schedules an in-person or virtual walkthrough directly into the CRM calendar.

---

## 4. Key Hackathon Metrics & Success Criteria
- **Conversational Latency**: `<300ms` speech-to-speech roundtrip via Agora Conversational AI.
- **Onboarding Speed**: Property listing creation in `<60 seconds` via Apify URL scraping.
- **Lead Conversion Rate**: Direct transition from voice conversation to booked tour.
- **Accuracy & Guardrails**: 100% adherence to landlord price floors and concession boundaries.
