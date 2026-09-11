import { NextRequest, NextResponse } from "next/server";
import {
  generateWhisperTwiML,
  handleWhisperInput,
  updateManagerCallSession,
} from "@/lib/agora-telephony";
import { BASE_PATH } from "@/lib/base-path";
import { db } from "@/db";
import { properties, voiceSessions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { updateAgoraAgentPrompt } from "@/lib/agora-agent-client";
import { buildObserverPrompt } from "@/lib/sarah-property-prompt";

export async function POST(req: NextRequest) {
  return handleWebhook(req);
}

export async function GET(req: NextRequest) {
  return handleWebhook(req);
}

async function handleWebhook(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const action = url.searchParams.get("action") || "whisper";
    const channelName = url.searchParams.get("channelName") || "";
    const propertyId = parseInt(url.searchParams.get("propertyId") || "0", 10);
    const prospectName = url.searchParams.get("prospectName") || "a prospective tenant";

    // 1. Initial Whisper IVR
    if (action === "whisper") {
      const proto = req.headers.get("x-forwarded-proto") || "https";
      const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
      const hostUrl = process.env.NEXTAUTH_URL || `${proto}://${host}`;
      const cleanHost = hostUrl.replace(/\/+$/, "");

      let propertyTitle = "the property";
      if (propertyId > 0) {
        const [prop] = await db
          .select({ title: properties.title })
          .from(properties)
          .where(eq(properties.id, propertyId))
          .limit(1);
        if (prop?.title) propertyTitle = prop.title;
      }

      const gatherActionUrl = `${cleanHost}${BASE_PATH}/api/agora/telephony/webhook?action=gather&propertyId=${propertyId}&channelName=${encodeURIComponent(channelName)}&prospectName=${encodeURIComponent(prospectName)}`;
      const twiml = generateWhisperTwiML(propertyTitle, prospectName, gatherActionUrl);

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // 2. Manager Keypad Decision (DTMF Gather)
    if (action === "gather") {
      let digits = url.searchParams.get("Digits") || "";
      try {
        const formData = await req.formData();
        const formDigits = formData.get("Digits");
        if (formDigits) digits = formDigits.toString();
      } catch {
        // query param fallback
      }

      const { twiml, bridged } = await handleWhisperInput(digits, channelName, propertyId);

      // If bridged, transition Sarah's prompt to Passive Observer Mode
      if (bridged && channelName) {
        try {
          const [voiceSession] = await db
            .select({ agoraSessionId: voiceSessions.agoraSessionId })
            .from(voiceSessions)
            .where(
              and(
                eq(voiceSessions.channelName, channelName),
                eq(voiceSessions.status, "active"),
                eq(voiceSessions.callerType, "sales_agent")
              )
            )
            .limit(1);

          if (voiceSession?.agoraSessionId) {
            const [prop] = await db
              .select()
              .from(properties)
              .where(eq(properties.id, propertyId))
              .limit(1);

            if (prop) {
              const observerPrompt = buildObserverPrompt({
                propertyTitle: prop.title,
                prospectName,
                facts: {
                  title: prop.title,
                  address: [prop.address, prop.city, prop.state].filter(Boolean).join(", "),
                  listingType: prop.listingType,
                  price: Number(prop.price) || 0,
                  bedrooms: prop.bedrooms,
                  bathrooms: prop.bathrooms,
                  sqft: prop.sqft,
                  description: prop.description,
                  salesPitch: prop.knowledgeBase?.synthesizedSalesPitch || null,
                  petPolicy: prop.knowledgeBase?.petPolicyDetail || null,
                  parking: prop.knowledgeBase?.parkingDetail || null,
                  utilities: prop.knowledgeBase?.utilitiesDetail || null,
                  applicationProcess: prop.knowledgeBase?.applicationProcess || null,
                  contactEmail: prop.knowledgeBase?.contactEmail || null,
                  faqs: (prop.knowledgeBase?.faqs || []).map((f) => ({ question: f.question, answer: f.answer })),
                  objectionPlaybook: [],
                  nearby: [],
                  neighbourhoodVibe: null,
                  concessionRules: [],
                  allowNegotiation: false,
                },
              });

              await updateAgoraAgentPrompt(
                voiceSession.agoraSessionId,
                channelName,
                observerPrompt.systemPrompt
              );
            }
          }
        } catch (promptErr) {
          console.warn("[Agora Telephony] Observer prompt swap warning:", promptErr);
        }
      }

      return new NextResponse(twiml, {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // 3. Call Status Callback
    if (action === "status") {
      let callStatus = "completed";
      try {
        const formData = await req.formData();
        callStatus = formData.get("CallStatus")?.toString() || callStatus;
      } catch {
        // ignore
      }

      if (callStatus === "no-answer" || callStatus === "busy" || callStatus === "failed") {
        updateManagerCallSession(channelName, "no_answer");
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("[Agora Telephony Webhook] Error:", err);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>An error occurred.</Say><Hangup/></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  }
}
