# Kyron Realty AI — Property Onboarding & Apify Ingestion System

This document outlines the dual-path property ingestion pipeline, split-screen onboarding studio, and Gemini-powered knowledge base synthesizer.

---

## 1. Onboarding Studio UI
- **Location**: `src/app/dashboard/properties/new/page.tsx`
- **Controller**: `src/components/dashboard/onboarding/OnboardingStudio.tsx`
- **Design Mode**: Product Mode with Light Theme and high-contrast sapphire/emerald accents.
- **Left Pane (`ConversationalPanel.tsx`)**:
  - Tab 1: Instant URL scraping via Apify.
  - Tab 2: Interactive Voice & Text Interview with browser speech recognition.
- **Right Pane (`LivePropertyInspector.tsx`)**:
  - Live photo gallery with status badges.
  - Click-to-edit primary metric inputs (Price, Beds, Baths, Sqft).
  - 3-tab deep inspector (Specs & Amenities, Voice Agent Brain, Concession Guardrails).

---

## 2. Ingestion & Extraction Pipeline
- **Apify Crawler (`src/lib/apify-crawler.ts`)**:
  - Executes `apify/website-content-crawler` actor.
  - Extracts clean markdown, page content, and high-resolution images.
  - Built-in direct HTTP and demo fallbacks for offline testing.
- **Gemini Synthesizer (`src/lib/kb-extractor.ts`)**:
  - Uses `@google/genai` (Gemini 2.5) with structured JSON output schema.
  - Generates speech-optimized elevator pitch, categorized FAQs, and negotiation matrices.

---

## 3. API Endpoints
- `POST /api/onboarding/scrape`: Scrapes property URL.
- `POST /api/onboarding/extract`: Synthesizes knowledge base and guardrails.
- `POST /api/properties/create`: Persists property and generates QR code SVG.
