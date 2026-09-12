/**
 * Kyron Realty AI — Agora Real-Time Telephony Bridge
 * Connects Twilio PSTN outbound dialing (+91 Indian numbers) with Agora SD-RTN channels.
 * Facilitates 3-way conference bridging between prospect and property manager.
 */
import { db } from "@/db";
import { properties, inquiriesAndLeads, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BASE_PATH } from "@/lib/base-path";
import { generateAgoraRtcToken } from "@/lib/agora-token";

export const MANAGER_RTC_UID = 888; // Reserved RTC UID for the dialed property manager

export interface ManagerTranscriptItem {
  id: string;
  text: string;
  timestamp: string;
}

export interface ManagerCallSession {
  callSid: string;
  propertyId: number;
  channelName: string;
  prospectName?: string;
  managerPhone: string;
  propertyTitle: string;
  status: "dialing" | "whispering" | "connected" | "declined" | "no_answer" | "failed" | "completed";
  createdAt: number;
  transcripts?: ManagerTranscriptItem[];
}

// In-memory registry for active outbound screening calls (TTL 30 mins)
const activeCalls = new Map<string, ManagerCallSession>();

/** Clean up sessions older than 30 minutes */
function pruneStaleCalls() {
  const now = Date.now();
  for (const [key, session] of activeCalls.entries()) {
    if (now - session.createdAt > 30 * 60 * 1000) {
      activeCalls.delete(key);
    }
  }
}

/** Formats an Indian or international phone number into standard E.164 (+91...) */
export function formatE164Phone(rawPhone: string): string {
  const cleaned = rawPhone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  // If 10 digits, assume standard Indian mobile number
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  // If 12 digits starting with 91
  if (/^91\d{10}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
}

export interface DialManagerParams {
  propertyId: number;
  channelName: string;
  prospectName?: string;
  hostUrl: string;
}

export interface DialManagerResult {
  success: boolean;
  status: "dialing" | "simulated" | "no_phone" | "error";
  callSid?: string;
  propertyTitle?: string;
  error?: string;
}

/**
 * Initiates an outbound whisper IVR call to the property manager.
 * If credentials are missing, gracefully falls back to simulation mode.
 */
export async function dialPropertyManager(
  params: DialManagerParams
): Promise<DialManagerResult> {
  pruneStaleCalls();

  const { propertyId, channelName, prospectName, hostUrl } = params;

  // 1. Fetch property details and manager contact
  const [property] = await db
    .select({
      id: properties.id,
      title: properties.title,
      managerPhone: properties.managerPhone,
      knowledgeBase: properties.knowledgeBase,
      ownerId: properties.ownerId,
    })
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1);

  if (!property) {
    return { success: false, status: "error", error: "Property not found." };
  }

  // Check property manager phone, then KB contactPhone, then owner user phone
  let targetPhone = property.managerPhone || property.knowledgeBase?.contactPhone || null;
  if (!targetPhone && property.ownerId) {
    const [owner] = await db
      .select({ phone: users.phone })
      .from(users)
      .where(eq(users.id, property.ownerId))
      .limit(1);
    targetPhone = owner?.phone || null;
  }

  if (!targetPhone || !targetPhone.trim()) {
    return {
      success: false,
      status: "no_phone",
      error: "No verified property manager phone number on file for this listing.",
    };
  }

  const formattedPhone = formatE164Phone(targetPhone);
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim() || process.env.TWILIO_CALLER_ID?.trim();

  // If live Twilio credentials are not configured, run in sandbox simulation mode
  if (!accountSid || !authToken || !fromNumber) {
    const simSid = `SIM_CALL_${Date.now()}`;
    activeCalls.set(channelName, {
      callSid: simSid,
      propertyId,
      channelName,
      prospectName,
      managerPhone: formattedPhone,
      propertyTitle: property.title,
      status: "dialing",
      createdAt: Date.now(),
    });

    return {
      success: true,
      status: "simulated",
      callSid: simSid,
      propertyTitle: property.title,
    };
  }

  // 2. Dispatch Twilio Voice Outbound Call via standard REST API
  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    let cleanHost = hostUrl.replace(/\/+$/, "");
    if (BASE_PATH && cleanHost.endsWith(BASE_PATH)) {
      cleanHost = cleanHost.slice(0, -BASE_PATH.length);
    }
    const gatherActionUrl = `${cleanHost}${BASE_PATH}/api/agora/telephony/webhook?action=gather&propertyId=${propertyId}&channelName=${encodeURIComponent(channelName)}&prospectName=${encodeURIComponent(prospectName || "a prospect")}`;
    const statusWebhook = `${cleanHost}${BASE_PATH}/api/agora/telephony/webhook?action=status&channelName=${encodeURIComponent(channelName)}&propertyId=${propertyId}`;

    const bodyParams = new URLSearchParams({
      To: formattedPhone,
      From: fromNumber,
      Twiml: generateWhisperTwiML(property.title, prospectName || "a prospect", gatherActionUrl),
    });

    // Twilio blocks StatusCallback to localhost; only set if it's a public URL
    if (cleanHost.startsWith("https://") && !cleanHost.includes("localhost")) {
      bodyParams.set("StatusCallback", statusWebhook);
      bodyParams.set("StatusCallbackMethod", "POST");
    }

    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Agora Telephony] Twilio Call Error:", response.status, errorText);
      return {
        success: false,
        status: "error",
        error: `Twilio call failure (${response.status}): ${errorText}`,
      };
    }

    const data = await response.json();
    const callSid = data.sid as string;

    activeCalls.set(channelName, {
      callSid,
      propertyId,
      channelName,
      prospectName,
      managerPhone: formattedPhone,
      propertyTitle: property.title,
      status: "dialing",
      createdAt: Date.now(),
    });

    return {
      success: true,
      status: "dialing",
      callSid,
      propertyTitle: property.title,
    };
  } catch (err: any) {
    console.error("[Agora Telephony] Dial exception:", err);
    return {
      success: false,
      status: "error",
      error: err.message || "Failed to initiate outbound telephony call.",
    };
  }
}

/** Returns the active session associated with an Agora channel */
export function getManagerCallSession(channelName: string): ManagerCallSession | null {
  return activeCalls.get(channelName) || null;
}

/** Updates the status of an ongoing call session */
export function updateManagerCallSession(
  channelName: string,
  status: ManagerCallSession["status"]
) {
  const session = activeCalls.get(channelName);
  if (session) {
    session.status = status;
    activeCalls.set(channelName, session);
  }
}

export function addManagerTranscript(channelName: string, text: string): ManagerTranscriptItem | null {
  const session = activeCalls.get(channelName);
  if (!session) return null;

  if (!session.transcripts) {
    session.transcripts = [];
  }

  const item: ManagerTranscriptItem = {
    id: `mgr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text: text.trim(),
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  session.transcripts.push(item);
  if (session.transcripts.length > 50) {
    session.transcripts.shift();
  }
  return item;
}


/** Escapes special characters for safe XML/TwiML attribute and text inclusion */
export function escapeXml(unsafe: string): string {
  return (unsafe || "").replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

/**
 * Generates TwiML for the private screening whisper.
 */
export function generateWhisperTwiML(
  propertyTitle: string,
  prospectName: string,
  gatherActionUrl?: string
): string {
  const caller = escapeXml(
    prospectName && prospectName !== "a prospect" ? prospectName : "a prospective tenant"
  );
  const title = escapeXml(propertyTitle);
  const actionAttr = gatherActionUrl
    ? ` action="${escapeXml(gatherActionUrl)}" method="POST"`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" timeout="10"${actionAttr}>
    <Say voice="Polly.Aditi">Hello, this is Kyron Realty AI. A verified prospect, ${caller}, is currently on our website exploring ${title} and would like to speak with you directly. Press 1 on your keypad to join the live call now, or press 2 if you are currently occupied.</Say>
  </Gather>
  <Say voice="Polly.Aditi">We did not receive any input. We will log this inquiry for your follow-up. Goodbye.</Say>
  <Hangup/>
</Response>`;
}

/**
 * Handles the manager's DTMF input and produces TwiML to either bridge the call or hang up gracefully.
 */
export async function handleWhisperInput(
  digits: string,
  channelName: string,
  propertyId: number,
  hostUrl?: string
): Promise<{ twiml: string; bridged: boolean }> {
  const session = activeCalls.get(channelName);

  if (digits === "1") {
    // Manager agreed to join!
    if (session) {
      session.status = "connected";
    }

    // Generate RTC token for the manager's audio participant (UID 888)
    const tokenResult = generateAgoraRtcToken(channelName, MANAGER_RTC_UID);

    // Log the 3-way conference event in inquiries_and_leads
    try {
      await db.insert(inquiriesAndLeads).values({
        propertyId,
        name: session?.prospectName || "Website Prospect",
        intent: "rent",
        leadStatus: "three_way_call_connected",
        notes: `Successfully connected live 3-way call between prospect and property manager for ${session?.propertyTitle || "Property"}.`,
      });
    } catch (dbErr) {
      console.warn("[Agora Telephony] DB lead logging warning:", dbErr);
    }

    // Clean host URL for WebSocket connection
    let cleanHost = (
      hostUrl ||
      process.env.TWILIO_WEBHOOK_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      "https://egnitech.com"
    ).replace(/\/+$/, "");
    cleanHost = cleanHost.replace(/^https?:\/\//, "");
    if (BASE_PATH && cleanHost.endsWith(BASE_PATH)) {
      cleanHost = cleanHost.slice(0, -BASE_PATH.length);
    }

    const wsUrl = `wss://${cleanHost}${BASE_PATH}/telephony-bridge/stream`;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">Connecting you to the live call now. Please go ahead.</Say>
  <Connect>
    <Stream url="${escapeXml(wsUrl)}">
      <Parameter name="channelName" value="${escapeXml(channelName)}" />
      <Parameter name="propertyId" value="${propertyId}" />
      <Parameter name="prospectName" value="${escapeXml(session?.prospectName || "a prospect")}" />
      <Parameter name="token" value="${escapeXml(tokenResult.token)}" />
    </Stream>
  </Connect>
</Response>`;

    return { twiml, bridged: true };
  }

  // Manager declined or pressed 2
  if (session) {
    session.status = "declined";
  }

  try {
    await db.insert(inquiriesAndLeads).values({
      propertyId,
      name: session?.prospectName || "Website Prospect",
      intent: "rent",
      leadStatus: "manager_unavailable",
      notes: `Outbound call placed for ${session?.propertyTitle || "Property"} but manager declined or was busy. Automated callback offered.`,
    });
  } catch (dbErr) {
    console.warn("[Agora Telephony] DB decline log warning:", dbErr);
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">Understood. We will have the prospect schedule a tour on your calendar. Thank you.</Say>
  <Hangup/>
</Response>`;

  return { twiml, bridged: false };
}
