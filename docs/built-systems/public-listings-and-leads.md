# Kyron Realty AI — Public Listings & Lead Capture System

This document outlines the public listing experience, marketing toolkit (QR Codes & WhatsApp cards), and automated buyer lead capture workflows.

---

## 1. Public Listing Architecture
- **Route**: `src/app/listings/[slug]/page.tsx`
- **Component**: `src/components/public/PublicListingClient.tsx`
- **Subpath Support**: Fully resolves `${BASE_PATH}/listings/[slug]`.
- **OpenGraph & SEO**: Generates dynamic rich preview cards for WhatsApp and social media.

---

## 2. Marketing & Distribution Toolkit
- **Vector QR Code Generator**: Generates SVG and PNG QR codes encoded directly with the public listing URL.
- **WhatsApp Share Deep Link**: Generates 1-click formatted WhatsApp messages with listing specs and voice agent direct links.

---

## 3. Inbound Conversion & Lead Booking
- **Floating CTA Bar**: Sticky conversion launcher on mobile & desktop with instant "Talk with AI Voice Agent" and "Book Viewing" triggers.
- **Lead Capture API (`src/app/api/leads/capture/route.ts`)**:
  - Validates buyer contact info, move-in timeline, and budget.
  - Inserts records into `inquiries_and_leads` and `viewing_appointments`.
