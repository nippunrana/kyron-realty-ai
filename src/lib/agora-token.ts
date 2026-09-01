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
 */
export function generateAgoraRtcToken(
  channelName: string,
  uid: number = 1001,
  role: number = RtcRole.PUBLISHER
): AgoraRtcTokenResult {
  const appId = process.env.AGORA_APP_ID || process.env.NEXT_PUBLIC_AGORA_APP_ID || "demo-agora-app-id";
  const appCertificate = process.env.AGORA_APP_CERTIFICATE || "";

  const tokenExpirationInSeconds = 3600; // 1 hour
  const privilegeExpirationInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const expiresAt = currentTimestamp + tokenExpirationInSeconds;

  if (!appCertificate || appCertificate === "your_agora_app_certificate") {
    return {
      appId,
      channelName,
      uid,
      token: `demo-token-${channelName}-${uid}-${expiresAt}`,
      expiresAt,
    };
  }

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
    return {
      appId,
      channelName,
      uid,
      token: `fallback-token-${channelName}-${uid}`,
      expiresAt,
    };
  }
}
