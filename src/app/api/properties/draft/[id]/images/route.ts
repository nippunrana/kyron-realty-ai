import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { properties, propertyMedia } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { BASE_PATH } from "@/lib/base-path";

import QRCode from "qrcode";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const draftId = Number(id);
    if (isNaN(draftId)) {
      return NextResponse.json({ error: "Invalid draft ID." }, { status: 400 });
    }

    const session = await auth();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    const [property] = await db
      .select({
        id: properties.id,
        ownerId: properties.ownerId,
        uploadToken: properties.uploadToken,
        images: properties.images,
        coverImageUrl: properties.coverImageUrl,
        title: properties.title,
        address: properties.address,
        qrCodeSvg: properties.qrCodeSvg,
      })
      .from(properties)
      .where(eq(properties.id, draftId))
      .limit(1);

    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const isOwner = session?.user?.id && session.user.id === property.ownerId;
    const hasValidToken = token && property.uploadToken && token === property.uploadToken;

    if (!isOwner && !hasValidToken) {
      return NextResponse.json({ error: "Unauthorized access to draft property." }, { status: 403 });
    }

    const images = Array.isArray(property.images) ? property.images : [];

    let qrCodeSvg = property.qrCodeSvg;
    if (!qrCodeSvg && property.uploadToken) {
      const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
      const protocol = req.headers.get("x-forwarded-proto") || "http";
      const uploadUrl = `${protocol}://${host}${BASE_PATH}/properties/upload/${property.id}?token=${property.uploadToken}`;
      try {
        qrCodeSvg = await QRCode.toString(uploadUrl, {
          type: "svg",
          width: 256,
          margin: 2,
          color: {
            dark: "#0f172a",
            light: "#ffffff",
          },
        });
      } catch (qrErr) {
        console.warn("Failed to generate fallback QR code in draft images route:", qrErr);
      }
    }

    return NextResponse.json({
      success: true,
      images,
      coverImageUrl: property.coverImageUrl,
      title: property.title,
      address: property.address,
      qrCodeSvg,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch images.";
    console.error("Failed to fetch draft images:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const draftId = Number(id);
    if (isNaN(draftId)) {
      return NextResponse.json({ error: "Invalid draft ID." }, { status: 400 });
    }

    const session = await auth();
    const body = await req.json();
    const { imageUrl, token } = body || {};

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required for deletion." }, { status: 400 });
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, draftId))
      .limit(1);

    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const isOwner = session?.user?.id && session.user.id === property.ownerId;
    const hasValidToken = token && property.uploadToken && token === property.uploadToken;

    if (!isOwner && !hasValidToken) {
      return NextResponse.json({ error: "Unauthorized to delete image." }, { status: 403 });
    }

    const currentImages = Array.isArray(property.images) ? [...property.images] : [];
    const updatedImages = currentImages.filter((img) => img !== imageUrl);

    let newCover = property.coverImageUrl;
    if (property.coverImageUrl === imageUrl) {
      newCover = updatedImages[0] || null;
    }

    await db
      .update(properties)
      .set({
        images: updatedImages,
        coverImageUrl: newCover,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, draftId));

    // Remove from propertyMedia
    await db
      .delete(propertyMedia)
      .where(and(eq(propertyMedia.propertyId, draftId), eq(propertyMedia.url, imageUrl)));

    // Clean up file on disk if it was a local upload
    try {
      const uploadPrefix = `${BASE_PATH}/uploads/properties/${draftId}/`;
      if (imageUrl.startsWith(uploadPrefix)) {
        const filename = imageUrl.slice(uploadPrefix.length);
        const filePath = path.join(process.cwd(), "public", "uploads", "properties", String(draftId), filename);
        await unlink(filePath).catch(() => {});
      }
    } catch {
      // Ignore filesystem deletion errors
    }

    return NextResponse.json({
      success: true,
      images: updatedImages,
      coverImageUrl: newCover,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete image.";
    console.error("Failed to delete image:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
