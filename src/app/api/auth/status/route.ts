import { NextResponse } from "next/server";
import { getGoogleOAuthConfig } from "@/lib/google-oauth";

export async function GET() {
  const { isConfigured } = getGoogleOAuthConfig();

  return NextResponse.json({
    googleConfigured: isConfigured,
    providers: {
      google: isConfigured,
      credentials: true,
    },
  });
}
