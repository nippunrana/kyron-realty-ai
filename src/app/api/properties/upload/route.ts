import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { properties, propertyMedia } from "@/db/schema";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { BASE_PATH } from "@/lib/base-path";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB per file
const MAX_IMAGE_DIMENSION = 1200; // Max width/height bounding box
const WEBP_QUALITY = 85; // Optimized compression quality

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const formData = await req.formData();

    const draftIdStr = formData.get("draftId") as string | null;
    const token = formData.get("token") as string | null;

    if (!draftIdStr) {
      return NextResponse.json({ error: "Draft ID is required." }, { status: 400 });
    }

    const draftId = Number(draftIdStr);
    if (isNaN(draftId) || draftId <= 0) {
      return NextResponse.json({ error: "Invalid draft ID." }, { status: 400 });
    }

    // Lookup property
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, draftId))
      .limit(1);

    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    // Authentication & Authorization:
    // Allow either the logged-in owner OR a matching uploadToken
    const isOwner = session?.user?.id && session.user.id === property.ownerId;
    const hasValidToken = token && property.uploadToken && token === property.uploadToken;

    if (!isOwner && !hasValidToken) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired upload session token." },
        { status: 403 }
      );
    }

    // Extract files
    const fileEntries = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;
    const files: File[] = [];

    if (fileEntries.length > 0) {
      files.push(...fileEntries);
    } else if (singleFile) {
      files.push(singleFile);
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No image files provided." }, { status: 400 });
    }

    const currentImages = Array.isArray(property.images) ? [...property.images] : [];
    if (currentImages.length + files.length > 30) {
      return NextResponse.json(
        { error: `Maximum limit of 30 images exceeded. Currently attached: ${currentImages.length}` },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "properties", String(draftId));
    await mkdir(uploadDir, { recursive: true });

    const newImageUrls: string[] = [];
    const mediaRecordsToInsert: Array<{
      propertyId: number;
      mediaType: string;
      url: string;
      caption: string;
      sortOrder: number;
    }> = [];

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: `Unsupported image format: ${file.type}. Allowed: JPEG, PNG, WebP, GIF, AVIF.` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File '${file.name}' exceeds the 15MB size limit.` },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);

      // Process image:
      // 1. Auto-orient based on EXIF (.rotate())
      // 2. Proportional resize inside 1200x1200 without enlargement if already smaller
      // 3. Convert to WebP at 85% quality and strip private camera/GPS metadata
      let processedBuffer: Buffer;
      try {
        processedBuffer = await sharp(inputBuffer)
          .rotate()
          .resize({
            width: MAX_IMAGE_DIMENSION,
            height: MAX_IMAGE_DIMENSION,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: WEBP_QUALITY })
          .toBuffer();
      } catch (imgErr) {
        console.error(`Failed to process image '${file.name}':`, imgErr);
        return NextResponse.json(
          { error: `Failed to process image '${file.name}'. The file may be corrupt or an invalid image.` },
          { status: 400 }
        );
      }

      const safeRandom = crypto.randomUUID().slice(0, 8);
      const filename = `${Date.now()}-${safeRandom}.webp`;
      const filePath = path.join(uploadDir, filename);

      await writeFile(filePath, processedBuffer);

      const publicUrl = `${BASE_PATH}/uploads/properties/${draftId}/${filename}`;
      newImageUrls.push(publicUrl);

      mediaRecordsToInsert.push({
        propertyId: draftId,
        mediaType: "image",
        url: publicUrl,
        caption: `${property.title} - Photo`,
        sortOrder: currentImages.length + newImageUrls.length - 1,
      });
    }

    const updatedImages = [...currentImages, ...newImageUrls];

    // Persist to DB
    await db
      .update(properties)
      .set({
        images: updatedImages,
        coverImageUrl: property.coverImageUrl || updatedImages[0] || null,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, draftId));

    if (mediaRecordsToInsert.length > 0) {
      await db.insert(propertyMedia).values(mediaRecordsToInsert);
    }

    return NextResponse.json({
      success: true,
      images: updatedImages,
      uploaded: newImageUrls,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to upload image.";
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
