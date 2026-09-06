import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  properties,
  inquiries,
  propertyKnowledgeBases,
  negotiationMatrices,
  propertyMedia,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const userId = session.user.id;

    const { id } = await params;
    const propertyId = Number(id);
    if (isNaN(propertyId) || propertyId <= 0) {
      return NextResponse.json({ error: "Invalid property ID." }, { status: 400 });
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    // Allow access if user owns the property or if ownerId is unassigned (legacy/seeded)
    if (property.ownerId && property.ownerId !== userId) {
      return NextResponse.json({ error: "Unauthorized access to property." }, { status: 403 });
    }

    // Fetch associated knowledge base and negotiation matrix if available
    const [kb] = await db
      .select()
      .from(propertyKnowledgeBases)
      .where(eq(propertyKnowledgeBases.propertyId, propertyId))
      .limit(1);

    const [matrix] = await db
      .select()
      .from(negotiationMatrices)
      .where(eq(negotiationMatrices.propertyId, propertyId))
      .limit(1);

    const mediaList = await db
      .select()
      .from(propertyMedia)
      .where(eq(propertyMedia.propertyId, propertyId));

    return NextResponse.json({
      success: true,
      property,
      knowledgeBase: kb || null,
      negotiationMatrix: matrix || null,
      media: mediaList || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch property details.";
    console.error("Error in GET /api/properties/[id]:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const userId = session.user.id;

    const { id } = await params;
    const propertyId = Number(id);
    if (isNaN(propertyId) || propertyId <= 0) {
      return NextResponse.json({ error: "Invalid property ID." }, { status: 400 });
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    // Allow deletion if user owns the property or if ownerId is unassigned (legacy/seeded)
    if (property.ownerId && property.ownerId !== userId) {
      return NextResponse.json({ error: "Unauthorized to delete this property." }, { status: 403 });
    }

    // 1. Delete legacy inquiries which lack ON DELETE CASCADE in PostgreSQL schema
    await db.delete(inquiries).where(eq(inquiries.propertyId, propertyId));

    // 2. Delete the property record (cascades to propertyMedia, propertyKnowledgeBases,
    //    negotiationMatrices, inquiriesAndLeads, viewingAppointments; voiceSessions.propertyId set to null)
    await db.delete(properties).where(eq(properties.id, propertyId));

    // 3. Remove physical upload assets from public/uploads/properties/[id] if present
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "properties", String(propertyId));
      if (fs.existsSync(uploadDir)) {
        await fs.promises.rm(uploadDir, { recursive: true, force: true });
      }
    } catch (fsErr) {
      console.warn("Failed to clean up property upload directory:", fsErr);
      // Non-fatal: DB deletion succeeded
    }

    return NextResponse.json({
      success: true,
      deletedId: propertyId,
      message: "Property listing deleted successfully.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete property listing.";
    console.error("Error in DELETE /api/properties/[id]:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
