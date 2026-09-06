import "dotenv/config";
import { db } from "../src/db";
import { properties } from "../src/db/schema";
import QRCode from "qrcode";
import { BASE_PATH, PUBLIC_ORIGIN } from "../src/lib/base-path";
import { eq } from "drizzle-orm";

async function backfillPropertyQrCodes() {
  console.log("=== Backfilling Property QR Codes & Share URLs ===\n");

  const allProperties = await db
    .select({
      id: properties.id,
      title: properties.title,
      slug: properties.slug,
      qrCodeSvg: properties.qrCodeSvg,
      shareUrl: properties.shareUrl,
    })
    .from(properties);

  console.log(`Found ${allProperties.length} total properties in database.`);

  let updatedCount = 0;

  for (const prop of allProperties) {
    if (!prop.slug) {
      console.warn(`[Skip] Property ${prop.id} ("${prop.title}") has no slug.`);
      continue;
    }

    const expectedShareUrl = prop.shareUrl || `${PUBLIC_ORIGIN}${BASE_PATH}/listings/${prop.slug}`;
    const needsQrUpdate =
      !prop.qrCodeSvg ||
      prop.qrCodeSvg.trim().length === 0 ||
      !prop.qrCodeSvg.includes("width=\"256\"");
    const needsShareUrlUpdate = !prop.shareUrl || prop.shareUrl.trim().length === 0;

    if (needsQrUpdate || needsShareUrlUpdate) {
      console.log(
        `[Updating] Property ${prop.id} ("${prop.title}"): generating vector QR (width=256) for ${expectedShareUrl}`
      );

      const qrCodeSvg = await QRCode.toString(expectedShareUrl, {
        type: "svg",
        width: 256,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });

      await db
        .update(properties)
        .set({
          shareUrl: expectedShareUrl,
          qrCodeSvg,
          updatedAt: new Date(),
        })
        .where(eq(properties.id, prop.id));

      updatedCount++;
    } else {
      console.log(`[OK] Property ${prop.id} ("${prop.title}") already has valid QR code.`);
    }
  }

  console.log(`\nSuccessfully backfilled ${updatedCount} properties.`);
  process.exit(0);
}

backfillPropertyQrCodes().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
