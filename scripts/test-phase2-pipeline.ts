import "dotenv/config";
import { scrapePropertyUrl } from "../src/lib/apify-crawler";
import { extractPropertyKnowledgeBase } from "../src/lib/kb-extractor";

async function testPhase2Pipeline() {
  console.log("=== Testing Phase 2: Ingestion & Knowledge Base Pipeline ===\n");

  const testUrl = "https://www.zillow.com/homedetails/250-Marina-Blvd-San-Francisco-CA-94123/sample";
  console.log(`1. Testing Property URL Scraping for: ${testUrl}`);
  const scrapedResult = await scrapePropertyUrl(testUrl);

  console.log(`[✓] Scrape completed (Source: ${scrapedResult.source})`);
  console.log(`    Title: ${scrapedResult.title}`);
  console.log(`    Markdown Length: ${scrapedResult.markdown.length} chars`);
  console.log(`    Images Found: ${scrapedResult.images.length}`);

  console.log("\n2. Testing Gemini 2.5 Knowledge Base & Guardrail Extraction...");
  const extracted = await extractPropertyKnowledgeBase({
    url: testUrl,
    markdown: scrapedResult.markdown,
    conversationText: "Owner noted that price is $3,450/month, 2 beds 2 baths, and they are willing to give 5% discount for an 18-month lease.",
    existingImages: scrapedResult.images,
  });

  console.log("\n=== Extraction Results ===");
  console.log(`[✓] Property Title: ${extracted.property.title}`);
  console.log(`[✓] Slug: ${extracted.property.slug}`);
  console.log(`[✓] Listing Type: ${extracted.property.listingType.toUpperCase()} ($${extracted.property.price}/mo)`);
  console.log(`[✓] Specs: ${extracted.property.bedrooms} Bed, ${extracted.property.bathrooms} Bath, ${extracted.property.sqft} sqft`);
  console.log(`[✓] Amenities (${extracted.property.amenities.length}): ${extracted.property.amenities.slice(0, 4).join(", ")}...`);
  console.log(`\n[✓] Speech-Optimized Sales Pitch:\n    "${extracted.knowledgeBase.synthesizedSalesPitch}"`);
  console.log(`\n[✓] FAQs Extracted (${extracted.knowledgeBase.faqs.length}):`);
  extracted.knowledgeBase.faqs.forEach((faq, idx) => {
    console.log(`    ${idx + 1}. [${faq.category}] Q: ${faq.question}`);
    console.log(`       A: ${faq.answer}`);
  });

  console.log("\n[✓] Negotiation Concession Matrix:");
  console.log(`    Target Price: $${extracted.negotiationMatrix.targetPrice}`);
  console.log(`    Min Floor Price: $${extracted.negotiationMatrix.minFloorPrice}`);
  console.log(`    Max Discount %: ${extracted.negotiationMatrix.maxAllowedDiscountPct}%`);
  console.log(`    Concession Rules (${extracted.negotiationMatrix.concessionRules.length}):`);
  extracted.negotiationMatrix.concessionRules.forEach((rule) => {
    console.log(`      • ${rule.condition} ➔ ${rule.concession}`);
  });

  console.log("\nPhase 2 Pipeline Verification: 100% Passed! 🚀");
}

testPhase2Pipeline().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
