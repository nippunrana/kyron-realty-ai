import { ApifyClient } from "apify-client";

export interface ScrapedListingResult {
  success: boolean;
  url: string;
  title: string;
  markdown: string;
  source: "apify";
  images: string[];
  error?: string;
}

/**
 * Universal property URL crawler using Apify Website Content Crawler.
 * Strict Mode: Directly calls Apify actor and throws immediately if token is missing or crawl fails.
 */
export async function scrapePropertyUrl(url: string): Promise<ScrapedListingResult> {
  const cleanUrl = url.trim();
  if (!cleanUrl) {
    throw new Error("A valid property listing URL is required.");
  }

  const apifyToken = process.env.APIFY_API_TOKEN?.trim();

  if (!apifyToken || apifyToken === "your_apify_api_token_here") {
    throw new Error(
      "Missing APIFY_API_TOKEN in .env. Please configure a valid Apify API Token from https://console.apify.com/account/integrations."
    );
  }

  console.log(`[Apify] Starting Website Content Crawler actor for: ${cleanUrl}`);
  const client = new ApifyClient({ token: apifyToken });

  try {
    const run = await client.actor("apify/website-content-crawler").call(
      {
        startUrls: [{ url: cleanUrl }],
        maxCrawlDepth: 0,
        crawlerType: "playwright:adaptive",
        removeElementsCssSelector: "nav, footer, script, style, noscript, .ads, .cookie-banner, .navigation",
        saveHtml: false,
        saveMarkdown: true,
        saveScreenshots: false,
      },
      { timeout: 60 }
    );

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    const firstItem = items[0] as any;

    if (!firstItem || (!firstItem.markdown && !firstItem.text)) {
      throw new Error(`Apify crawler returned no text or markdown content for URL: ${cleanUrl}`);
    }

    console.log(`[Apify] Crawl complete for: ${cleanUrl}`);
    const extractedImages: string[] = [];
    if (Array.isArray(firstItem.metadata?.images)) {
      extractedImages.push(...firstItem.metadata.images);
    }

    return {
      success: true,
      url: cleanUrl,
      title: firstItem.metadata?.title || firstItem.title || "Property Listing",
      markdown: firstItem.markdown || firstItem.text || "",
      source: "apify",
      images: extractedImages,
    };
  } catch (err: any) {
    console.error(`[Apify Crawler Failed]:`, err.message || err);
    throw new Error(`Apify crawler error: ${err.message || err}`);
  }
}
