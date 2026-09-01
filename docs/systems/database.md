# Kyron Realty AI — Database & ORM System

This document describes the PostgreSQL 17 database architecture, Drizzle ORM models, relational links, and migration protocols for Kyron Realty AI.

---

## 1. Stack & Architecture
- **Database Engine**: PostgreSQL 17.
- **ORM**: Drizzle ORM (`drizzle-orm` v0.40.x) + `postgres.js` driver.
- **Canonical Source of Truth**: [src/db/schema.ts](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/src/db/schema.ts).
- **Connection Pool**: [src/db/index.ts](file:///var/www/egnitech.com/html/wp-content/projects/kyron-realty-ai/src/db/index.ts).

---

## 2. Relational Schema Architecture

```
 ┌──────────────────────┐        1:N        ┌──────────────────────┐
 │        users         ├──────────────────►│      properties      │
 └──────────────────────┘                   └──────────┬───────────┘
                                                       │
         ┌────────────────────────┬────────────────────┼────────────────────────┬────────────────────────┐
         │ 1:N                    │ 1:1                │ 1:1                    │ 1:N                    │ 1:N
         ▼                        ▼                    ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐ ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  property_media  │    │property_knowledge│ │negotiation_matrix│    │  voice_sessions  │    │inquiries_and_lead│
└──────────────────┘    └──────────────────┘ └──────────────────┘    └────────┬─────────┘    └────────┬─────────┘
                                                                              │ 1:1                   │ 1:1
                                                                              ▼                       ▼
                                                                     ┌──────────────────────────────────────────┐
                                                                     │          viewing_appointments            │
                                                                     └──────────────────────────────────────────┘
```

### Table Definitions:
1. **`properties`**: Core inventory holding title, slug, price, listingType ('rent' | 'sale'), propertyType, specs, coverImageUrl, amenities, QR code SVG, and shareUrl.
2. **`property_media`**: Media assets (photos, floor plans, virtual tours) with sort order.
3. **`property_knowledge_bases`**: Speech-optimized elevator pitches, neighborhood context, pet/parking/utilities policies, and categorized FAQ arrays.
4. **`negotiation_matrices`**: Hard floor prices, target prices, max discount percentages, and pre-approved give-and-get concession rules.
5. **`voice_sessions`**: Agora RTC call telemetry, duration, turn count, audio transcripts, and sentiment scores.
6. **`inquiries_and_leads`**: Qualified buyer/renter contact info, budget, move-in target date, and lead status.
7. **`viewing_appointments`**: Calendar tour bookings (in-person and virtual walkthroughs).
8. **`users`**, **`accounts`**, **`sessions`**, **`verificationTokens`**: Auth.js / NextAuth authentication entities.

---

## 3. Migration Protocol
Always update `src/db/schema.ts` directly and apply changes:
```bash
npx drizzle-kit generate
npx tsx scripts/run-migration.ts
```
