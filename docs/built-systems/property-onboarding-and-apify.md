# Kyron Realty AI — Property Onboarding & Apify Ingestion System

This document outlines the dual-path property ingestion pipeline, split-screen onboarding studio, and Gemini-powered knowledge base synthesizer.

---

## 1. Onboarding Studio UI
- **Location**: `src/app/dashboard/properties/new/page.tsx`
- **Controller**: `src/components/dashboard/onboarding/OnboardingStudio.tsx`
- **Design Mode**: Product Mode with Light Theme and high-contrast sapphire/emerald accents.
- **Left Pane (`ConversationalPanel.tsx`)**:
  - URL Listing Scraper (Apify web ingestion).
  - Elena Vance AI Agent Persona Card (Principal Luxury Listing Specialist).
  - Real-time animated soundwave pill with dynamic speaking/listening state transitions.
  - Compact scrollable dialogue stream container for live turns.
  - Agora SD-RTN call controls (Connect, Mute, End Call).
- **Right Pane (`LivePropertyInspector.tsx`)**:
  - Real-time dynamic parameter revelation (Discovered Specs & Synthesized Intelligence).
  - No empty static prefilled forms; parameters appear dynamically upon detection.
  - 6-Point dynamic verification checklist and circular progress indicator.
  - Sticky deployment action button unlocking at 6/6 verified attributes.

---

## 2. Ingestion & Extraction Pipeline
- **Apify Crawler (`src/lib/apify-crawler.ts`)**:
  - Executes `apify/website-content-crawler` actor.
  - Extracts clean markdown, page content, and high-resolution images.
  - Built-in direct HTTP and demo fallbacks for offline testing.
- **Gemini Synthesizer (`src/lib/kb-extractor.ts`)**:
  - Uses `@google/genai` (Gemini 2.5) with strict Fact vs. Copy split and zero-fabrication constraints.
  - Live conversational turns use instant deterministic heuristics (<10ms).
  - Post-call synthesis runs once against accumulated dialogue transcript to generate speech-optimized elevator pitch, categorized FAQs, and concession matrices without inventing unstated lease terms or specs.

---

## 3. API Endpoints
- `POST /api/onboarding/scrape`: Scrapes property URL.
- `POST /api/onboarding/extract`: Synthesizes knowledge base and guardrails.
- `POST /api/properties/create`: Persists property and generates QR code SVG.
