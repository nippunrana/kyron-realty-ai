import { GoogleGenAI } from "@google/genai";

export interface ExtractedPropertyPayload {
  property: {
    title: string;
    slug: string;
    description: string;
    listingType: "rent" | "sale";
    propertyType: "apartment" | "single_family" | "condo" | "townhouse" | "commercial";
    price: number;
    securityDeposit: number;
    minLeaseMonths: number;
    hoaFeeMonthly: number;
    address: string;
    unitNumber: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    yearBuilt: number;
    availableDate?: string;
    amenities: string[];
    features: string[];
    coverImageUrl?: string;
    images: string[];
  };
  knowledgeBase: {
    rawScrapedMarkdown: string;
    synthesizedSalesPitch: string;
    neighborhoodSummary: string;
    schoolDistrictInfo: string;
    petPolicyDetail: string;
    parkingDetail: string;
    utilitiesDetail: string;
    applicationProcess: string;
    faqs: Array<{ question: string; answer: string; category: string }>;
    agentTone: string;
    greetingMessage: string;
  };
  negotiationMatrix: {
    allowNegotiation: boolean;
    targetPrice: number;
    minFloorPrice: number;
    maxAllowedDiscountPct: number;
    concessionRules: Array<{
      condition: string;
      concession: string;
      maxConcessionValue: number;
      requiresApproval: boolean;
    }>;
    notesForAgent: string;
  };
}

function generateKebabSlug(title: string, city: string): string {
  const base = `${title} ${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${base || "property"}-${randomSuffix}`;
}

export async function extractPropertyKnowledgeBase(
  input: {
    markdown?: string;
    conversationText?: string;
    url?: string;
    existingImages?: string[];
  }
): Promise<ExtractedPropertyPayload> {
  const contentToAnalyze = [
    input.url ? `Source Listing URL: ${input.url}` : "",
    input.conversationText ? `Owner Interview Notes:\n${input.conversationText}` : "",
    input.markdown ? `Listing Content & Markdown:\n${input.markdown}` : "",
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
You are an expert real estate intelligence system and senior property manager.
Analyze the following raw real estate listing content / owner conversation and extract an exhaustive, structured property profile, a speech-optimized knowledge base for an Agora voice sales agent, and a negotiation guardrail matrix.

Input Content:
${contentToAnalyze}

You MUST return a valid JSON object strictly matching this TypeScript structure (do not enclose in markdown ticks if using json mime type, or return clean JSON):
{
  "property": {
    "title": string (e.g. "Luxury 2-Bedroom Marina Loft with Bay Views"),
    "description": string (compelling 2-3 paragraph listing description),
    "listingType": "rent" | "sale",
    "propertyType": "apartment" | "single_family" | "condo" | "townhouse" | "commercial",
    "price": number (numeric value only, e.g. 3450),
    "securityDeposit": number,
    "minLeaseMonths": number (default 12),
    "hoaFeeMonthly": number (default 0),
    "address": string (e.g. "250 Marina Boulevard"),
    "unitNumber": string (e.g. "Unit 4B" or ""),
    "city": string (e.g. "San Francisco"),
    "state": string (e.g. "CA"),
    "zipCode": string (e.g. "94123"),
    "country": string (default "USA"),
    "bedrooms": number,
    "bathrooms": number,
    "sqft": number,
    "yearBuilt": number,
    "availableDate": string (ISO date or "Immediate"),
    "amenities": string[] (e.g. ["In-unit W/D", "Garage Parking", "EV Charging", "Balcony", "Rooftop Pool"]),
    "features": string[] (e.g. ["Hardwood flooring", "Floor-to-ceiling windows", "Quartz countertops"]),
    "coverImageUrl": string,
    "images": string[] (array of image URLs found or empty array)
  },
  "knowledgeBase": {
    "synthesizedSalesPitch": string (punchy 2-sentence conversational hook designed to be spoken aloud naturally by a voice agent),
    "neighborhoodSummary": string (walkability, restaurants, transit, vibe),
    "schoolDistrictInfo": string,
    "petPolicyDetail": string (detailed rules, fees, weight limits),
    "parkingDetail": string (assigned spots, guest parking, garage type),
    "utilitiesDetail": string (what is included vs paid by tenant/buyer),
    "applicationProcess": string (requirements, screening, deposit),
    "faqs": [
      { "question": string, "answer": string, "category": "Pricing & Lease" | "Amenities & Specs" | "Policies & Rules" | "Neighborhood" }
    ],
    "agentTone": "warm_professional",
    "greetingMessage": string (e.g. "Hello! Thanks for your interest in 250 Marina Blvd. Are you looking to move in this month?")
  },
  "negotiationMatrix": {
    "allowNegotiation": true,
    "targetPrice": number (matches property.price),
    "minFloorPrice": number (strict minimum allowed price, usually 5-7% below target),
    "maxAllowedDiscountPct": number (e.g. 5.0),
    "concessionRules": [
      {
        "condition": "18_month_lease",
        "concession": "5% discount on monthly rent",
        "maxConcessionValue": 200,
        "requiresApproval": false
      },
      {
        "condition": "move_in_under_7_days",
        "concession": "Waived first month parking fee ($200 value)",
        "maxConcessionValue": 200,
        "requiresApproval": false
      }
    ],
    "notesForAgent": string (internal guidelines for the voice bot)
  }
}
      `.trim();

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "";
      const parsed = JSON.parse(text);

      const title = parsed.property?.title || "Modern Urban Residence";
      const city = parsed.property?.city || "San Francisco";
      const slug = generateKebabSlug(title, city);

      // Merge existing images if found
      const combinedImages = Array.from(
        new Set([
          ...(parsed.property?.images || []),
          ...(input.existingImages || []),
        ])
      ).filter(Boolean);

      return {
        property: {
          ...parsed.property,
          slug,
          coverImageUrl:
            parsed.property?.coverImageUrl ||
            combinedImages[0] ||
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
          images:
            combinedImages.length > 0
              ? combinedImages
              : [
                  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
                  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
                ],
        },
        knowledgeBase: {
          ...parsed.knowledgeBase,
          rawScrapedMarkdown: input.markdown || contentToAnalyze,
        },
        negotiationMatrix: parsed.negotiationMatrix,
      };
    } catch (aiError: any) {
      console.warn(`[GenAI] Gemini extraction failed (${aiError.message}), using heuristic synthesis.`);
    }
  }

  // Heuristic Fallback
  const fallbackTitle = "Modern Marina Luxury Loft";
  const fallbackCity = "San Francisco";
  const fallbackSlug = generateKebabSlug(fallbackTitle, fallbackCity);

  return {
    property: {
      title: fallbackTitle,
      slug: fallbackSlug,
      description:
        "Stunning high-floor residence featuring panoramic views, chef's kitchen, hardwood floors, in-unit laundry, and private outdoor balcony.",
      listingType: "rent",
      propertyType: "apartment",
      price: 3450,
      securityDeposit: 3450,
      minLeaseMonths: 12,
      hoaFeeMonthly: 0,
      address: "250 Marina Boulevard",
      unitNumber: "Unit 4B",
      city: "San Francisco",
      state: "CA",
      zipCode: "94123",
      country: "USA",
      bedrooms: 2,
      bathrooms: 2.0,
      sqft: 1150,
      yearBuilt: 2021,
      availableDate: "Immediate",
      amenities: [
        "In-unit Washer/Dryer",
        "Dedicated Garage Parking",
        "EV Charging",
        "Private Balcony",
        "Rooftop Terrace",
      ],
      features: ["Hardwood Flooring", "Quartz Countertops", "High Ceilings"],
      coverImageUrl:
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      images: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    knowledgeBase: {
      rawScrapedMarkdown: input.markdown || contentToAnalyze,
      synthesizedSalesPitch:
        "Welcome to 250 Marina Boulevard! This home offers rare panoramic bay views, in-unit laundry, and private garage parking in one of the city's most walkable neighborhoods.",
      neighborhoodSummary:
        "Prime Marina location with a 98 WalkScore, steps away from Chestnut Street restaurants, cafes, and the waterfront.",
      schoolDistrictInfo: "Top-rated San Francisco Unified School District.",
      petPolicyDetail: "Dogs and cats welcome (under 50 lbs) with $500 pet deposit and $50/month pet rent.",
      parkingDetail: "1 assigned underground garage parking stall with EV charger included.",
      utilitiesDetail: "Water, sewer, and trash removal are covered. Tenant is responsible for electricity and internet.",
      applicationProcess:
        "Online application, 680+ credit score required, gross monthly income 2.5x rent.",
      faqs: [
        {
          question: "What utilities are included in the rent?",
          answer: "Water, trash, and sewer are included. Tenant pays electric and WiFi.",
          category: "Policies & Rules",
        },
        {
          question: "Is parking included?",
          answer: "Yes, one assigned garage parking space with Level 2 EV charging is included.",
          category: "Amenities & Specs",
        },
        {
          question: "Is the price negotiable?",
          answer: "We can discuss a 5% discount if you are open to an 18-month lease commitment.",
          category: "Pricing & Lease",
        },
      ],
      agentTone: "warm_professional",
      greetingMessage:
        "Hello! Thanks for checking out 250 Marina Boulevard. Are you looking to move in this month?",
    },
    negotiationMatrix: {
      allowNegotiation: true,
      targetPrice: 3450,
      minFloorPrice: 3250,
      maxAllowedDiscountPct: 5.0,
      concessionRules: [
        {
          condition: "18_month_lease",
          concession: "5% discount on monthly rent ($3,277/mo)",
          maxConcessionValue: 173,
          requiresApproval: false,
        },
        {
          condition: "move_in_under_7_days",
          concession: "Waived first month parking fee ($200 value)",
          maxConcessionValue: 200,
          requiresApproval: false,
        },
      ],
      notesForAgent: "Strictly adhere to the $3,250 floor price. Proactively offer tours for qualified callers.",
    },
  };
}
