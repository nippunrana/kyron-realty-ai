# AgoraRealty AI — Negotiation Matrix & Conversation Scenarios

## 1. The "Exchange of Value" Concession Matrix

In real estate leasing and sales, inexperienced agents often slash prices without receiving anything in return. AgoraRealty AI enforces strict **Give-Get Concession Ladders**:

| Tier | Customer Situation | Concession (What AI Gives) | Required Commitment (What AI Gets) | Guardrail Constraint |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1: Lease Term Extension** | Customer says rent is slightly above budget (5–8% gap). | 5% discount on monthly rent (e.g., $3,400 $\rightarrow$ $3,230). | Must sign an **18-month or 24-month lease** instead of standard 12 months. | Cannot drop below Property Floor Rate ($3,100). |
| **Tier 2: Fast Occupancy** | Customer is ready to move in immediately. | Waive monthly parking fee ($200/mo) or 50% off first month's security deposit. | Must sign lease and take occupancy **within 7 calendar days**. | Only valid for units vacant > 14 days. |
| **Tier 3: Upfront Payment** | Customer asks for maximum discount. | 8% discount on total contract value. | Full **12-month rent paid upfront** in advance. | Requires proof of funds verification. |
| **Tier 4: Impossible Budget Gap** | Customer offers budget > 20% below floor price. | **No price discount.** Pivot to alternative unit in inventory. | Customer agrees to tour a 1BHK + Den or slightly further neighborhood. | Never negotiate below hard floor rate. |

---

## 2. Real Estate BANT Qualification Framework

During natural voice turn-taking, the AI dynamically extracts and scores lead parameters without sounding like an interrogation:

```
+-------------------------------------------------------------------------------+
| B - Budget: Rent range ($2.5k - $3.5k) or Purchase capacity ($800k - $1.2M)   |
| A - Authority: Sole tenant, couple, family, or corporate lease decision-maker |
| N - Need: Bedrooms (1/2/3 BHK), Pet policy, Balcony, Parking, Move-in urgency |
| T - Timeline: Move-in within 14 days, 30 days, or casual 3-month browser      |
+-------------------------------------------------------------------------------+
```

---

## 3. Real-Time Objection Handling Scripts

### Objection 1: "The building across the street is $300 cheaper."
- **AI Response Strategy**: Acknowledge $\rightarrow$ Isolate hidden fees $\rightarrow$ Highlight net value.
- **Sample AI Dialogue**:
  > *"I completely understand price comparison is important! Just so you know, the building on 4th Street doesn't include in-unit washer/dryers or covered garage parking, which typically adds $250 a month to your living costs. At Pine Street, all those amenities plus our 24/7 fitness center are fully included. When you factor that in, our net cost is actually lower. Shall we look at the unit layout together?"*

### Objection 2: "Can you waive the broker fee / security deposit?"
- **AI Response Strategy**: Trade for lease duration or fast signing.
- **Sample AI Dialogue**:
  > *"The standard security deposit is one full month's rent. However, if your credit score is above 720 and you can finalize your application by Friday, our management allows a reduced deposit of just $500. Can I send the pre-qualification link to your phone right now?"*

### Objection 3: Sudden Requirement Change (Interruption Handling)
- **Customer**: *"Actually, my partner just reminded me we need a home office space, so a 1-bed won't work."*
- **AI Response Strategy**: Instant memory update $\rightarrow$ Dynamic DB query $\rightarrow$ Seamless pivot.
- **Sample AI Dialogue**:
  > *"Got it! Let's pivot from the 1-bed. I have two great 2-bedroom options on the 6th floor, or a spacious 1-bed with a separate sunroom den that works perfectly as an office for $400 less than a full 2-bed. Which of those sounds more appealing?"*

---

## 4. Warm Human Broker Escalation Protocol

When a customer triggers an escalation flag:
1. **Triggers**:
   - Cash buyer or purchase budget > $1,000,000.
   - Specific legal contract inquiries (commercial zoning, lease assignment clauses).
   - High customer frustration sentiment score (<0.3 for 2 consecutive turns).
2. **Action**:
   - AI: *"Let me connect you directly with Marcus, our senior listing broker for this property. He is available right now on this line—one moment."*
   - Agora backend bridges Marcus into the audio channel.
   - Marcus's tablet/screen displays the **Live AI Dossier**:
     - **Lead Name**: Alexander Hayes
     - **Interest**: Flat #1402 (Penthouse Sale - $1.45M)
     - **Financing**: Pre-approved with Chase Bank ($400k down)
     - **Key Question**: Closing timeline and HOA balcony restrictions.
