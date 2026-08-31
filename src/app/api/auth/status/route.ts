import { NextResponse } from "next/server";

export async function GET() {
  const googleId = (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "").trim();
  const googleSecret = (process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "").trim();
  const isGoogleConfigured = Boolean(googleId && googleSecret);

  return NextResponse.json({
    googleConfigured: isGoogleConfigured,
    providers: {
      google: isGoogleConfigured,
      credentials: true,
    },
  });
}
