/**
 * The marketing demo property shown on the homepage. It is not a database row.
 * The buyer voice agent uses these facts only when this exact slug is requested
 * and no listing with that slug exists; real listings never fall back to them.
 * Keep every value here consistent with the copy in src/components/home/.
 */
export const DEMO_LISTING_SLUG = "marina-luxury-loft";

// No id on purpose: the agent resolves the demo by slug, so it can never collide with a real row id.
export const DEMO_LISTING = {
  title: "Luxury 3-BHK Executive Condo on Golf Course Road",
  slug: DEMO_LISTING_SLUG,
  price: "95000",
  listingType: "rent",
  address: "Tower 4, The Aralias, Golf Course Road",
  city: "Gurugram",
  state: "HR",
  bedrooms: 3,
  bathrooms: 3,
  sqft: 2150,
  description:
    "High-floor 3-bedroom luxury residence on Golf Course Road with panoramic golf course views, designer modular kitchen, and 2 reserved basement parking stalls.",
  petPolicyDetail: "Pets welcome with prior society registration and refundable deposit.",
  parkingDetail: "Two reserved basement parking bays with dedicated EV charging point.",
  minFloorPrice: 90000,
  concessionRules: [
    { condition: "18-month lease", concession: "5% monthly rent discount (₹90,250/mo)" },
    { condition: "Move-in within 7 days", concession: "1st month society maintenance waived" },
  ],
  coverImageUrl:
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
} as const;
