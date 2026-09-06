import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { eq } from "drizzle-orm";
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
    const download = searchParams.get("download") === "1";
    const format = searchParams.get("format");

    const [property] = await db
      .select({
        id: properties.id,
        ownerId: properties.ownerId,
        uploadToken: properties.uploadToken,
        title: properties.title,
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

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const uploadUrl = `${protocol}://${host}${BASE_PATH}/properties/upload/${property.id}?token=${property.uploadToken}`;

    let qrCodeSvg = property.qrCodeSvg;
    if (!qrCodeSvg) {
      qrCodeSvg = await QRCode.toString(uploadUrl, {
        type: "svg",
        width: 256,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });
    }

    // JSON format requested
    if (format === "json" || req.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json({
        success: true,
        qrCodeSvg,
        uploadUrl,
      });
    }

    // Serve raw SVG image
    const headers = new Headers();
    headers.set("Content-Type", "image/svg+xml");
    headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");

    if (download) {
      headers.set(
        "Content-Disposition",
        `attachment; filename="kyron-qr-upload-${property.id}.svg"`
      );
    }

    return new NextResponse(qrCodeSvg, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate QR code.";
    console.error("QR route error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
