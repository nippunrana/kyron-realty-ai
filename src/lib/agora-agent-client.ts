import {
  generateAgoraRtcToken,
  generateAgoraRtmToken,
  generateAgoraConvoAiAgentToken,
} from "./agora-token";
import { db } from "@/db";
import { properties, propertyKnowledgeBases, negotiationMatrices, voiceSessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface StartAgentSessionParams {
  channelName: string;
  propertySlug?: string;
  propertyId?: number;
  userUid?: number;
  agentUid?: number;
  callerType?: "buyer_inquiry" | "owner_onboarding";
}

export interface AgoraAgentSessionResult {
  success: boolean;
  sessionId: string;
  channelName: string;
  agentUid: number;
  userUid: number;
  token: string;
  rtmToken: string;
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
    callerType = "buyer_inquiry",
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

  // 2. Generate Real Signed RTC and RTM Tokens for User and Multi-Service Token for Agent
  const userTokenData = generateAgoraRtcToken(channelName, userUid);
  const userRtmTokenData = generateAgoraRtmToken(String(userUid));
  const agentToken = generateAgoraConvoAiAgentToken(channelName, agentUid);

  // 3. Build Agent System Prompt & Real Estate Persona
  const propertyTitle = propertyRecord?.title || "Property";
  const targetPrice = matrixRecord?.targetPrice || propertyRecord?.price || "3,450";
  const floorPrice = matrixRecord?.minFloorPrice || "3,250";

  let greeting = "";
  let systemPrompt = "";

  if (callerType === "owner_onboarding") {
    greeting =
      "Hello! I'm your Kyron Realty onboarding agent. I'll help you set up your listing and configure your 24/7 AI voice sales agent. To get started, is this property for rent or for sale?";

    systemPrompt = `
You are 'Alex', senior property onboarding specialist at Kyron Realty AI.
Your mission is to interview property owners over Agora real-time voice and collect 6 essential attributes to launch their listing:
1. Listing Type (Is it for Rent or for Sale?)
2. Street Address & Location (Street, City, State, Zip)
3. Target Price (Monthly rent or asking price)
4. Bedrooms count
5. Bathrooms count
6. Square footage / Size

VOICE DELIVERY GUIDELINES:
- Speak in natural, concise, spoken sentences (1-2 sentences at a time). Never use markdown bullets, emojis, or robotic lists.
- Proactively ask whether the property is for rent or for sale if not yet answered.
- Guide the owner through remaining details one or two at a time in an encouraging, professional tone.
- Acknowledge provided details warmly before asking for the next.
- Emphasize that Kyron Realty AI will auto-generate their 24/7 Voice Sales Agent and concession guardrails once verified.
    `.trim();
  } else {
    greeting =
      kbRecord?.greetingMessage ||
      `Hello! Thanks for your interest in ${propertyTitle}. Are you looking to move in this month?`;

    const faqsText = (kbRecord?.faqs || [])
      .map((f: any) => `Q: ${f.question}\nA: ${f.answer}`)
      .join("\n\n");

    const concessionRulesText = (matrixRecord?.concessionRules || [])
      .map((r: any) => `- Condition: ${r.condition} -> Concession: ${r.concession}`)
      .join("\n");

    systemPrompt = `
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
  }

  // 4. Register Voice Session in Database
  let voiceSessionId = `agora-sess-${Date.now()}`;
  try {
    const [sess] = await db
      .insert(voiceSessions)
      .values({
        propertyId: propertyRecord?.id || null,
        channelName,
        agoraSessionId: voiceSessionId,
        callerType,
        callerIdentifier: `user-${userUid}`,
        status: "active",
      })
      .returning();

    if (sess?.id) {
      voiceSessionId = `agora-sess-${sess.id}`;
    }
  } catch (dbErr) {
    console.warn("[Agora Voice Session] DB insert warning:", dbErr);
  }

  // 5. Call Agora Conversational AI Cloud Gateway REST API (v2)
  const customerId = process.env.AGORA_CUSTOMER_ID?.trim();
  const customerSecret = process.env.AGORA_CUSTOMER_SECRET?.trim();
  let authHeader = "";

  if (customerId && customerSecret) {
    authHeader = `Basic ${Buffer.from(`${customerId}:${customerSecret}`).toString("base64")}`;
  } else if (apiKey && apiKey.trim() !== "" && apiKey !== "your_agora_conversational_ai_api_key_here") {
    authHeader = apiKey.startsWith("Basic ") || apiKey.startsWith("Bearer ")
      ? apiKey
      : (apiKey.includes(":") ? `Basic ${Buffer.from(apiKey.trim()).toString("base64")}` : `Basic ${apiKey.trim()}`);
  } else {
    throw new Error(
      "Missing Agora Cloud credentials in .env. Please configure AGORA_CUSTOMER_ID & AGORA_CUSTOMER_SECRET (or AGORA_CONVERSATIONAL_AI_API_KEY)."
    );
  }

  // 6. Configure LLM brain (Google Gemini or OpenAI)
  const geminiApiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    ""
  ).trim();
  const openaiApiKey = (process.env.OPENAI_API_KEY || "").trim();

  let llmConfig: any = null;
  if (geminiApiKey) {
    llmConfig = {
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      api_key: geminiApiKey,
      system_messages: [
        {
          role: "system",
          content: systemPrompt,
        },
      ],
      greeting_message: greeting,
      params: {
        model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
        temperature: 0.6,
      },
    };
  } else if (openaiApiKey) {
    llmConfig = {
      url: "https://api.openai.com/v1/chat/completions",
      api_key: openaiApiKey,
      system_messages: [
        {
          role: "system",
          content: systemPrompt,
        },
      ],
      greeting_message: greeting,
      params: {
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.6,
      },
    };
  } else {
    throw new Error(
      "Missing LLM API key in .env. Please configure GEMINI_API_KEY or OPENAI_API_KEY for the Conversational AI Agent."
    );
  }

  // 7. Configure ASR & TTS
  const asrVendor = process.env.AGORA_ASR_VENDOR || "ares";
  const asrConfig: any = {
    language: "en-US",
    vendor: asrVendor,
  };
  if (asrVendor === "deepgram" && process.env.DEEPGRAM_API_KEY) {
    asrConfig.params = {
      api_key: process.env.DEEPGRAM_API_KEY.trim(),
      model: "nova-3",
    };
  }

  let ttsConfig: any = null;
  if (process.env.CARTESIA_API_KEY?.trim()) {
    ttsConfig = {
      vendor: "cartesia",
      params: {
        api_key: process.env.CARTESIA_API_KEY.trim(),
        model_id: "sonic-english",
        voice: {
          mode: "id",
          id: process.env.CARTESIA_VOICE_ID?.trim() || "a0e99841-438c-4a64-b679-ae501e7d6091",
        },
      },
    };
  } else if (process.env.ELEVENLABS_API_KEY?.trim()) {
    ttsConfig = {
      vendor: "elevenlabs",
      params: {
        key: process.env.ELEVENLABS_API_KEY.trim(),
        voice_id: process.env.ELEVENLABS_VOICE_ID?.trim() || "21m00Tcm4TlvDq8ikWAM",
        model_id: "eleven_turbo_v2_5",
      },
    };
  } else if (process.env.MICROSOFT_TTS_KEY?.trim()) {
    ttsConfig = {
      vendor: "microsoft",
      params: {
        key: process.env.MICROSOFT_TTS_KEY.trim(),
        region: process.env.MICROSOFT_TTS_REGION?.trim() || "eastus",
        voice_name: process.env.MICROSOFT_TTS_VOICE?.trim() || "en-US-JennyMultilingualNeural",
      },
    };
  } else if (openaiApiKey) {
    ttsConfig = {
      vendor: "openai",
      params: {
        api_key: openaiApiKey,
        model: "tts-1",
        voice: "alloy",
      },
    };
  } else {
    // Transparent auto-fallback to Agora Managed TTS (No 3rd-party vendor key required)
    console.log(
      "[Agora Gateway] No BYOK TTS key detected in .env. Using Agora Managed TTS (MiniMax speech-2.6-turbo / English_captivating_female1)."
    );
    ttsConfig = {
      credential_mode: "managed",
      vendor: "minimax",
      params: {
        url: "wss://api.minimax.io/ws/v1/t2a_v2",
        model: "speech-2.6-turbo",
        voice_setting: {
          voice_id: "English_captivating_female1",
          speed: 1.0,
        },
        audio_setting: {
          sample_rate: 24000,
        },
      },
    };
  }

  console.log(`[Agora Gateway] Dispatching agent start (v2) to channel: ${channelName}`);

  const joinUrl = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/join`;
  const response = await fetch(joinUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      name: `kyron-realty-${propertyRecord?.slug || "listing"}-${Date.now()}`,
      properties: {
        channel: channelName,
        token: agentToken,
        agent_rtc_uid: String(agentUid),
        remote_rtc_uids: [String(userUid)],
        idle_timeout: 120,
        asr: asrConfig,
        llm: llmConfig,
        tts: ttsConfig,
        vad: {
          mode: "auto",
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
        advanced_features: {
          enable_rtm: true,
        },
        parameters: {
          data_channel: "rtm",
          enable_error_message: true,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let parsedDetail = "";
    try {
      const errJson = JSON.parse(errorBody);
      if (errJson.detail) {
        parsedDetail = errJson.detail;
      }
      if (errJson.reason === "request failed" || errJson.detail === "ErrInternal") {
        parsedDetail += " (Downstream LLM or TTS provider rejected the connection. Check that your GEMINI_API_KEY has active billing/credits and your credentials are valid.)";
      }
    } catch {
      // Non-JSON response
    }

    console.error(`[Agora Gateway Error ${response.status}]:`, parsedDetail || response.statusText);

    // Update voiceSession record to failed
    try {
      await db
        .update(voiceSessions)
        .set({
          status: "failed",
          endedAt: new Date(),
        })
        .where(eq(voiceSessions.agoraSessionId, voiceSessionId));
    } catch (dbErr) {
      console.warn("[Agora Voice Session] DB update to failed warning:", dbErr);
    }

    throw new Error(
      `Agora Conversational AI Gateway error (${response.status}): ${parsedDetail || response.statusText || "Failed to start agent"}`
    );
  }

  const json = await response.json();
  const remoteAgentId = json.agent_id || json.data?.agent_id || voiceSessionId;

  return {
    success: true,
    sessionId: remoteAgentId,
    channelName,
    agentUid,
    userUid,
    token: userTokenData.token,
    rtmToken: userRtmTokenData.token,
    appId,
    greeting,
    message: "Agent session initialized successfully on Agora SD-RTN.",
  };
}

/**
 * Stops an active Agora Conversational AI Agent session (v2 API).
 */
export async function stopAgoraAgentSession(sessionId: string, channelName: string) {
  const appId = process.env.AGORA_APP_ID || process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const customerId = process.env.AGORA_CUSTOMER_ID?.trim();
  const customerSecret = process.env.AGORA_CUSTOMER_SECRET?.trim();
  const apiKey = process.env.AGORA_CONVERSATIONAL_AI_API_KEY || process.env.AGORA_API_KEY;

  let authHeader = "";
  if (customerId && customerSecret) {
    authHeader = `Basic ${Buffer.from(`${customerId}:${customerSecret}`).toString("base64")}`;
  } else if (apiKey && apiKey.trim() !== "") {
    authHeader = apiKey.startsWith("Basic ") || apiKey.startsWith("Bearer ")
      ? apiKey
      : (apiKey.includes(":") ? `Basic ${Buffer.from(apiKey.trim()).toString("base64")}` : `Basic ${apiKey.trim()}`);
  }

  if (appId && authHeader) {
    try {
      const leaveUrl = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/agents/${sessionId}/leave`;
      await fetch(leaveUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ channel: channelName }),
      });
    } catch (e) {
      console.warn("[Agora Gateway] Leave request warning:", e);
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
