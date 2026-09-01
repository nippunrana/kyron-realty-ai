import { generateAgoraRtcToken } from "./agora-token";
import { db } from "@/db";
import { properties, propertyKnowledgeBases, negotiationMatrices, voiceSessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface StartAgentSessionParams {
  channelName: string;
  propertySlug?: string;
  propertyId?: number;
  userUid?: number;
  agentUid?: number;
}

export interface AgoraAgentSessionResult {
  success: boolean;
  sessionId: string;
  channelName: string;
  agentUid: number;
  userUid: number;
  token: string;
  greeting: string;
  appId: string;
  message?: string;
}

/**
 * Starts an Agora Conversational AI Voice Agent session for a specific property listing.
 * Strict Mode: Communicates directly with Agora SD-RTN & Cloud Gateway; throws on missing keys or API failures.
 */
export async function startAgoraAgentSession(
  params: StartAgentSessionParams
): Promise<AgoraAgentSessionResult> {
  const {
    channelName,
    propertySlug,
    propertyId,
    userUid = 1001,
    agentUid = 999001,
  } = params;

  const appId = process.env.AGORA_APP_ID || process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const apiKey = process.env.AGORA_CONVERSATIONAL_AI_API_KEY || process.env.AGORA_API_KEY;

  if (!appId || appId.trim() === "" || appId === "your_agora_app_id_here") {
    throw new Error(
      "Missing AGORA_APP_ID in .env. Please configure your Agora App ID from https://console.agora.io/."
    );
  }

  // 1. Fetch property, knowledge base & guardrails
  let propertyRecord: any = null;
  let kbRecord: any = null;
  let matrixRecord: any = null;

  if (propertyId) {
    const [p] = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
    propertyRecord = p;
  } else if (propertySlug) {
    const [p] = await db.select().from(properties).where(eq(properties.slug, propertySlug)).limit(1);
    propertyRecord = p;
  }

  if (propertyRecord) {
    const [kb] = await db
      .select()
      .from(propertyKnowledgeBases)
      .where(eq(propertyKnowledgeBases.propertyId, propertyRecord.id))
      .limit(1);
    kbRecord = kb;

    const [matrix] = await db
      .select()
      .from(negotiationMatrices)
      .where(eq(negotiationMatrices.propertyId, propertyRecord.id))
      .limit(1);
    matrixRecord = matrix;
  }

  // 2. Generate Real Signed RTC Tokens for User and Agent (Throws if AGORA_APP_CERTIFICATE is missing)
  const userTokenData = generateAgoraRtcToken(channelName, userUid);
  const agentTokenData = generateAgoraRtcToken(channelName, agentUid);

  // 3. Build Agent System Prompt & Real Estate Persona
  const propertyTitle = propertyRecord?.title || "Luxury Property";
  const targetPrice = matrixRecord?.targetPrice || propertyRecord?.price || "3,450";
  const floorPrice = matrixRecord?.minFloorPrice || "3,250";
  const greeting =
    kbRecord?.greetingMessage ||
    `Hello! Thanks for your interest in ${propertyTitle}. Are you looking to move in this month?`;

  const faqsText = (kbRecord?.faqs || [])
    .map((f: any) => `Q: ${f.question}\nA: ${f.answer}`)
    .join("\n\n");

  const concessionRulesText = (matrixRecord?.concessionRules || [])
    .map((r: any) => `- Condition: ${r.condition} -> Concession: ${r.concession}`)
    .join("\n");

  const systemPrompt = `
You are 'Sarah', a senior leasing advisor and sales specialist representing: ${propertyTitle}.
Your goal is to converse naturally with prospective buyers/renters over Agora real-time voice, answer questions truthfully using the provided property knowledge base, negotiate within strict owner concession boundaries, and book viewing walkthroughs.

PROPERTY OVERVIEW:
- Address: ${propertyRecord?.address || ""}, ${propertyRecord?.city || ""}, ${propertyRecord?.state || ""}
- Listing Type: ${propertyRecord?.listingType === "rent" ? "Rental" : "For Sale"}
- Asking Price: $${Number(targetPrice).toLocaleString()}${propertyRecord?.listingType === "rent" ? "/month" : ""}
- Specs: ${propertyRecord?.bedrooms || 2} Beds, ${propertyRecord?.bathrooms || 2} Baths, ${propertyRecord?.sqft || 1100} sqft
- Description: ${propertyRecord?.description || ""}

POLICIES & DETAILS:
- Pets: ${kbRecord?.petPolicyDetail || "Allowed with deposit"}
- Parking: ${kbRecord?.parkingDetail || "Assigned stall included"}
- Utilities: ${kbRecord?.utilitiesDetail || "Standard utilities included"}
- Application: ${kbRecord?.applicationProcess || "Standard application with credit verification"}

VERIFIED PROPERTY FAQS:
${faqsText || "No additional custom FAQs."}

NEGOTIATION CONCESSION GUARDRAILS:
- Target Price: $${Number(targetPrice).toLocaleString()}
- Minimum Floor Price: $${Number(floorPrice).toLocaleString()} (ABSOLUTE BOTTOM - NEVER GO BELOW)
- Allowed Concessions:
${concessionRulesText || "- 18-month lease: 5% monthly discount"}

RULES OF ENGAGEMENT:
1. Speak in concise, natural, spoken sentences (1-3 sentences max).
2. Only state facts verified in the knowledge base.
3. Use the Exchange-of-Value principle for negotiations. If a buyer asks for a discount, offer it ONLY in exchange for an 18-month lease or immediate move-in.
4. When the buyer is interested, proactively offer two time slots to book an in-person viewing.
  `.trim();

  // 4. Register Voice Session in Database
  let voiceSessionId = `agora-sess-${Date.now()}`;
  const [sess] = await db
    .insert(voiceSessions)
    .values({
      propertyId: propertyRecord?.id || null,
      channelName,
      agoraSessionId: voiceSessionId,
      callerType: "buyer_inquiry",
      callerIdentifier: `user-${userUid}`,
      status: "active",
    })
    .returning();

  if (sess?.id) {
    voiceSessionId = `agora-sess-${sess.id}`;
  }

  // 5. Call Agora Conversational AI Cloud Gateway REST API
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_agora_conversational_ai_api_key_here") {
    throw new Error(
      "Missing AGORA_CONVERSATIONAL_AI_API_KEY in .env. Please configure your Agora Cloud Gateway API key."
    );
  }

  console.log(`[Agora Gateway] Dispatching agent start to channel: ${channelName}`);
  const authHeader = apiKey.startsWith("Basic ") || apiKey.startsWith("Bearer ")
    ? apiKey
    : (apiKey.includes(":") ? `Basic ${Buffer.from(apiKey).toString("base64")}` : `Basic ${apiKey}`);

  const response = await fetch(
    `https://api.agora.io/v1/projects/${appId}/rtm/conversational-ai/agents`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        name: `Kyron-Realty-${propertyRecord?.slug || "Listing"}`,
        properties: {
          channel: channelName,
          token: agentTokenData.token,
          agent_rtc_uid: String(agentUid),
          remote_rtc_uids: [String(userUid)],
          idle_timeout: 60,
        },
        parameters: {
          vad: {
            mode: "auto",
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
          stt: {
            vendor: "deepgram",
            model: "nova-3",
            language: "en",
          },
          llm: {
            vendor: "openai",
            model: "gpt-4o",
            system_prompt: systemPrompt,
            greeting: greeting,
            temperature: 0.6,
            max_history: 30,
          },
          tts: {
            vendor: "cartesia",
            model: "sonic-english",
            voice_id: "a0e99841-438c-4a64-b679-ae501e7d6091",
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[Agora Gateway Error ${response.status}]:`, errorBody);
    throw new Error(
      `Agora Conversational AI Gateway error (${response.status}): ${errorBody || response.statusText}`
    );
  }

  const json = await response.json();
  const remoteAgentId = json.data?.agent_id || json.agent_id || voiceSessionId;

  return {
    success: true,
    sessionId: remoteAgentId,
    channelName,
    agentUid,
    userUid,
    token: userTokenData.token,
    appId,
    greeting,
    message: "Agent session initialized successfully on Agora SD-RTN.",
  };
}

/**
 * Stops an active Agora Conversational AI Agent session.
 */
export async function stopAgoraAgentSession(sessionId: string, channelName: string) {
  const appId = process.env.AGORA_APP_ID || process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const apiKey = process.env.AGORA_CONVERSATIONAL_AI_API_KEY || process.env.AGORA_API_KEY;

  if (appId && apiKey) {
    try {
      const authHeader = apiKey.startsWith("Basic ") || apiKey.startsWith("Bearer ")
        ? apiKey
        : (apiKey.includes(":") ? `Basic ${Buffer.from(apiKey).toString("base64")}` : `Basic ${apiKey}`);

      await fetch(
        `https://api.agora.io/v1/projects/${appId}/rtm/conversational-ai/agents/${sessionId}/stop`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({ channel: channelName }),
        }
      );
    } catch (e) {
      console.warn("[Agora Gateway] Stop request warning:", e);
    }
  }

  await db
    .update(voiceSessions)
    .set({
      status: "completed",
      endedAt: new Date(),
    })
    .where(eq(voiceSessions.agoraSessionId, sessionId));

  return { success: true, sessionId, channelName };
}
