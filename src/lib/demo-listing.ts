/**
 * The marketing demo property shown on the homepage. It is not a database row.
 * The buyer voice agent uses these facts only when this exact slug is requested
 * and no listing with that slug exists; real listings never fall back to them.
 * Keep every value here consistent with the copy in src/components/home/.
 */
export const DEMO_LISTING_SLUG = "marina-luxury-loft";

// No id on purpose: the agent resolves the demo by slug, so it can never collide with a real row id.
export const DEMO_LISTING = {
  title: "Luxury 2-Bedroom Marina Loft with Golden Gate Views",
  slug: DEMO_LISTING_SLUG,
  price: "3450",
  listingType: "rent",
  address: "250 Marina Boulevard, Unit 4B",
  city: "San Francisco",
  state: "CA",
  bedrooms: 2,
  bathrooms: 2,
  sqft: 1150,
  description:
    "Sunlit two-bedroom loft in the Marina District with Golden Gate views, in-unit washer and dryer, and a reserved garage stall.",
  petPolicyDetail: "Dogs and cats up to 60 lbs are welcome with a refundable deposit.",
  parkingDetail: "One assigned garage stall with Level-2 EV charging.",
  minFloorPrice: 3250,
  concessionRules: [
    { condition: "18-month lease", concession: "5% monthly rent discount" },
    { condition: "Move-in within 7 days", concession: "Parking fee waived" },
  ],
  coverImageUrl:
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
} as const;
