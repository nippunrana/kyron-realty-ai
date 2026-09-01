# 05. Property Onboarding & Knowledge Base Synthesis

## 1. The Split-Screen Onboarding Studio

The property onboarding studio lives at `/dashboard/properties/new` and uses an interactive split-screen layout:

```
┌────────────────────────────────────────┬────────────────────────────────────────┐
│         CONVERSATIONAL STUDIO          │         LIVE KNOWLEDGE INSPECTOR       │
│  [🎤 Speak] [💬 Chat Input]             │  [Real-Time Property Preview Card]     │
│                                        │                                        │
│  Bot: "Welcome! To get started, paste  │  🏷️ Title: 250 Marina Luxury Loft      │
│  a listing link or tell me about the   │  📍 Location: Marina Blvd, SF, CA      │
│  property you're listing today."       │  💰 Price: $3,450 / month (Rent)       │
│                                        │  🛏️ 2 Bed  🛁 2 Bath  📐 1,150 sqft    │
│  User: "Here is the Zillow link:       │  ───────────────────────────────────── │
│  https://zillow.com/homes/..."         │  📸 Media Extracted (6 High-Res Photos)│
│                                        │  🐾 Pets: Dogs & Cats OK ($50/mo)      │
│  [⚙️ Apify Scraping in progress...]    │  🚗 Parking: 1 Reserved Garage Space   │
│  [✨ AI Knowledge Base Synthesizing...]│  ───────────────────────────────────── │
│                                        │  🎯 Negotiation Guardrails:            │
│  Bot: "I extracted 6 photos and key    │    • Floor: $3,250/mo                  │
│  specs! Would you like to set a floor  │    • Concession: 5% off for 18mo lease │
│  price or concession rules?"           │  ───────────────────────────────────── │
│                                        │  [🚀 Publish Listing & Generate QR]    │
└────────────────────────────────────────┴────────────────────────────────────────┘
```

---

## 2. Ingestion Path A: Apify URL Scraping Pipeline

### 2.1 Apify Actor Execution
When a user submits a URL, Next.js triggers the **Apify Website Content Crawler** (`apify/website-content-crawler`):

```typescript
import { ApifyClient } from "apify-client";

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

export async function scrapePropertyListingUrl(url: string) {
  const run = await apifyClient.actor("apify/website-content-crawler").call({
    startUrls: [{ url }],
    maxCrawlDepth: 0,
    crawlerType: "playwright:adaptive",
    removeElementsCssSelector: "nav, footer, script, style, .ads, .cookie-banner",
    saveHtml: false,
    saveMarkdown: true,
  });

  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
  return items[0]?.markdown || "";
}
```

### 2.2 LLM Structured Extraction Schema
Raw markdown is sent to the LLM (Gemini 2.5 / GPT-4o) with a rigid extraction schema:

```json
{
  "title": "Modern 2-Bedroom Marina Loft with Golden Gate Views",
  "listingType": "rent",
  "propertyType": "apartment",
  "price": 3450,
  "deposit": 3450,
  "bedrooms": 2,
  "bathrooms": 2.0,
  "sqft": 1150,
  "address": "250 Marina Boulevard",
  "city": "San Francisco",
  "state": "CA",
  "zipCode": "94123",
  "amenities": ["In-unit W/D", "Hardwood Floors", "Dishwasher", "Balcony", "Garage Parking"],
  "images": [
    "https://images.example.com/prop1_hero.jpg",
    "https://images.example.com/prop1_living.jpg"
  ],
  "petPolicy": "Cats and dogs permitted under 50 lbs with $500 deposit and $50/mo pet rent.",
  "parking": "One dedicated garage parking spot included.",
  "utilities": "Water and trash removal included. Tenant pays electric and internet."
}
```

---

## 3. Ingestion Path B: Conversational Q&A Decision Tree

If no URL is provided, or to fill in missing details (such as floor prices and concession rules), the AI runs an interactive questionnaire:

```
                      [START ONBOARDING]
                              │
                    Listing Type & Price?
                 ┌────────────┴────────────┐
                 ▼                         ▼
             [RENTAL]                   [SALE]
         • Monthly Rent              • Asking Price
         • Security Deposit          • HOA Fees
         • Lease Term Length         • Financing/Cash Preference
                 │                         │
                 └────────────┬────────────┘
                              ▼
                  Physical Specs & Photos
         • Beds, Baths, Sqft, Address
         • Photo upload / image links
                              │
                              ▼
                  Policies, Utilities & Perks
         • Pets, Parking, In-unit Laundry, AC
         • Included utilities vs Tenant paid
                              │
                              ▼
                 Negotiation & Concessions
         • Minimum Floor Price (e.g. $3,250)
         • Allowed give-and-get concessions:
           - 18+ month lease = 5% rent discount
           - Move in <7 days = free parking month
                              │
                              ▼
              [KNOWLEDGE BASE COMPILED & SAVED]
```

---

## 4. Automatic Knowledge Base Synthesis

Once raw data is captured, the system automatically generates:
1. **Speech-Optimized Pitch (`synthesizedSalesPitch`)**: A 2-sentence conversational hook designed to be spoken aloud naturally by the Agora voice agent.
2. **Categorized FAQ Engine (`faqs`)**: Pre-indexed questions and verified answers covering pricing, building amenities, application criteria, and neighborhood highlights.
3. **Guardrail Rules**: Populates `negotiation_matrices` table to ensure the AI never undercuts the owner's bottom line.
