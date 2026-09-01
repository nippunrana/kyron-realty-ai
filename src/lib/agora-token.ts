import agoraToken from "agora-token";

// Handle CommonJS / ESM interop for agora-token
const agoraModule = (agoraToken as any)?.default || agoraToken;
const RtcTokenBuilder = agoraModule.RtcTokenBuilder;
const RtcRole = agoraModule.RtcRole || { PUBLISHER: 1, SUBSCRIBER: 2 };

export interface AgoraRtcTokenResult {
  appId: string;
  channelName: string;
  uid: number;
  token: string;
  expiresAt: number;
}

/**
 * Generates a signed Agora RTC token for client audio/video streaming.
 * Strict mode: Throws immediately if Agora credentials are missing or invalid.
 */
export function generateAgoraRtcToken(
  channelName: string,
  uid: number = 1001,
  role: number = RtcRole.PUBLISHER
): AgoraRtcTokenResult {
  const appId = process.env.AGORA_APP_ID || process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || appId.trim() === "" || appId === "your_agora_app_id_here") {
    throw new Error(
      "Missing AGORA_APP_ID in .env. Please set a valid Agora App ID from https://console.agora.io/."
    );
  }

  if (!appCertificate || appCertificate.trim() === "" || appCertificate === "your_agora_app_certificate_here") {
    throw new Error(
      "Missing AGORA_APP_CERTIFICATE in .env. Please set a valid Agora App Certificate from https://console.agora.io/."
    );
  }

  const tokenExpirationInSeconds = 3600; // 1 hour
  const privilegeExpirationInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const expiresAt = currentTimestamp + tokenExpirationInSeconds;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      tokenExpirationInSeconds,
      privilegeExpirationInSeconds
    );

    return {
      appId,
      channelName,
      uid,
      token,
      expiresAt,
    };
  } catch (err: any) {
    console.error("[Agora] Token generation error:", err);
    throw new Error(`Failed to generate Agora RTC token: ${err.message || err}`);
  }
}
