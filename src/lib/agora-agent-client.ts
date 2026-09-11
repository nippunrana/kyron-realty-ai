import {
  generateAgoraRtcToken,
  generateAgoraRtmToken,
  generateAgoraAgentCombinedToken,
  getAgoraAppId,
  getAgoraCredentials,
  buildAgoraCloudAuthHeader,
} from "./agora-token";
export { buildAgoraCloudAuthHeader };
import { db } from "@/db";
import { properties, voiceSessions, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { computeFloorPrice } from "./listing-helpers";
import { DEMO_LISTING, DEMO_LISTING_SLUG } from "./demo-listing";
import { getGeminiApiKey } from "./gemini";
import { buildOwnerOnboardingPrompt } from "./elena-prompt";
import { buildSalesSearchPrompt } from "./sarah-search-prompt";
import { buildPropertyAgentContext } from "./property-agent-context";
import { emptyJourney } from "./sales-journey";
import { fetchAgoraAgentDetails } from "./agora-telemetry";
import type { CallerType } from "@/hooks/voice-agent-types";

export interface StartAgentSessionParams {
  channelName: string;
  propertySlug?: string;
  propertyId?: number;
  userUid?: number;
  agentUid?: number;
  callerType?: CallerType;
  ownerName?: string | null;
  ownerEmail?: string | null;
  userId?: string | null;
}

export interface AgoraAgentSessionResult {
  success: boolean;
  sessionId: string;
  voiceSessionId?: number | null;
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
/**
 * The provider-specific shape of the agent's system prompt. Gemini wants `parts`, OpenAI
 * wants `content`; the join payload and the mid-call prompt swap must agree on which, so
 * both read it from here rather than each spelling it out.
 */
export function buildSystemMessages(systemPrompt: string): Array<Record<string, unknown>> {
  if (getGeminiApiKey()) {
    return [{ role: "user", parts: [{ text: systemPrompt }] }];
  }
  return [{ role: "system", content: systemPrompt }];
}

/**
 * Swaps the system prompt of a call that is already running, so Sarah can pick up a
 * property's knowledge base without the caller losing audio or the session being re-billed.
 *
 * Sends `llm.system_messages` alone: the gateway overwrites `llm.params` wholesale, so
 * including it partially would erase the model name and silently downgrade the brain.
 * Returns false when no live session matches, and throws when the gateway rejects the swap -
 * a silently failed update would leave Sarah confidently discussing the wrong home.
 */
export async function updateAgoraAgentPrompt(
  sessionId: string,
  channelName: string,
  systemPrompt: string
): Promise<boolean> {
  const [row] = await db
    .select({ id: voiceSessions.id })
    .from(voiceSessions)
    .where(
      and(
        eq(voiceSessions.agoraSessionId, sessionId),
        eq(voiceSessions.channelName, channelName),
        eq(voiceSessions.callerType, "sales_agent"),
        eq(voiceSessions.status, "active")
      )
    )
    .limit(1);
  if (!row) return false;

  const appId = getAgoraAppId();
  const authHeader = buildAgoraCloudAuthHeader(channelName);
  if (!appId || !authHeader) {
    throw new Error("Missing Agora Cloud credentials; cannot update the running agent.");
  }

  const updateUrl = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/agents/${sessionId}/update`;
  const response = await fetch(updateUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      properties: {
        llm: {
          system_messages: buildSystemMessages(systemPrompt),
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Agora Conversational AI Gateway update error (${response.status}): ${errorBody || response.statusText}`
    );
  }

  return true;
}

export async function startAgoraAgentSession(
  params: StartAgentSessionParams
): Promise<AgoraAgentSessionResult> {
  const {
    channelName,
    propertySlug,
    propertyId,
    userUid = Math.floor(100000 + Math.random() * 800000),
    agentUid = Math.floor(900000 + Math.random() * 99999),
    callerType = "buyer_inquiry",
    ownerName,
    ownerEmail,
    userId,
  } = params;

  // Validated once here; the token builders below re-read the same credentials.
  const { appId } = getAgoraCredentials();

  // 1. Fetch property (with its consolidated knowledge base & guardrails)
  let propertyRecord: any = null;
  let ownerUserRecord: any = null;

  if (propertyId) {
    const [p] = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
    propertyRecord = p;
  } else if (propertySlug) {
    const [p] = await db.select().from(properties).where(eq(properties.slug, propertySlug)).limit(1);
    propertyRecord = p;
  }

  const kbRecord = propertyRecord?.knowledgeBase || null;
  const matrixRecord = propertyRecord?.negotiationRules || null;

  if (propertyRecord?.ownerId) {
    const [owner] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, propertyRecord.ownerId))
      .limit(1)
      .catch((err) => {
        console.warn("[Agora Voice Agent] Could not fetch owner user record:", err);
        return [null];
      });
    ownerUserRecord = owner;
  }

  // 2. Generate Real Signed RTC and RTM Tokens for User, and ConvoAI Combined Token for Agent
  const userTokenData = generateAgoraRtcToken(channelName, userUid);
  const userRtmTokenData = generateAgoraRtmToken(String(userUid));
  const agentTokenData = generateAgoraAgentCombinedToken(channelName, agentUid);
  const agentToken = agentTokenData.token;

  // 3. Build Agent System Prompt & Real Estate Persona
  // The homepage demo has no DB row; it is the only case that may use non-DB facts.
  const demo = !propertyRecord && propertySlug === DEMO_LISTING_SLUG ? DEMO_LISTING : null;
  const propertyTitle = propertyRecord?.title || demo?.title || "this listing";
  const targetPrice = Number(matrixRecord?.targetPrice || propertyRecord?.price || demo?.price || 0) || 0;
  const floorPrice =
    Number(matrixRecord?.minFloorPrice) || demo?.minFloorPrice || computeFloorPrice(targetPrice);

  let greeting = "";
  let systemPrompt = "";

  if (callerType === "owner_onboarding") {
    ({ greeting, systemPrompt } = buildOwnerOnboardingPrompt({ ownerName, ownerEmail }));
  } else if (callerType === "sales_agent") {
    // Starting the call already on a listing page opens straight in that home's prompt, with
    // an empty journey: nothing has been said yet, so every requirement is a question to ask.
    const coldContext = propertyRecord
      ? await buildPropertyAgentContext(propertyRecord.slug, emptyJourney(), "cold")
      : null;
    ({ greeting, systemPrompt } = coldContext || buildSalesSearchPrompt());
  } else {
    greeting =
      kbRecord?.greetingMessage ||
      `Hello! Thanks for your interest in ${propertyTitle}. Are you looking to move in this month?`;

    // A synthesized agent script stored on the knowledge base takes precedence over the assembled prompt.
    if (kbRecord?.eaScript && typeof kbRecord.eaScript === "string" && kbRecord.eaScript.trim().length > 80) {
      systemPrompt = kbRecord.eaScript.trim();
    } else {
      const faqsText = (kbRecord?.faqs || [])
        .map((f: any) => `Q: ${f.question}\nA: ${f.answer}`)
        .join("\n\n");

      const concessionRules: Array<{ condition: string; concession: string }> =
        matrixRecord?.concessionRules?.length ? matrixRecord.concessionRules : demo ? [...demo.concessionRules] : [];
      const concessionRulesText = concessionRules
        .map((r) => `- Condition: ${r.condition} -> Concession: ${r.concession}`)
        .join("\n");

      const contactEmail = ownerUserRecord?.email || "";
      const listing = propertyRecord || demo;
      const NOT_SPECIFIED = "Not specified in the verified listing";
      const spec = (value: unknown, suffix = "") =>
        value === null || value === undefined || value === "" ? NOT_SPECIFIED : `${value}${suffix}`;
      const detail = (value?: string | null) => (value && value.trim() ? value : NOT_SPECIFIED);
      const fullAddress = [listing?.address, listing?.city, listing?.state].filter(Boolean).join(", ");
      const isRental = listing?.listingType === "rent";
      const priceLine =
        targetPrice > 0 ? `₹${targetPrice.toLocaleString("en-IN")}${isRental ? "/month" : ""}` : `${NOT_SPECIFIED} - never quote a price`;

      systemPrompt = `
You are 'Sarah', a senior leasing advisor and sales specialist representing: ${propertyTitle}.
Your goal is to converse naturally with prospective buyers/renters over Agora real-time voice, answer questions truthfully using the provided property knowledge base, negotiate within strict owner concession boundaries, and book viewing walkthroughs.

PROPERTY OVERVIEW:
- Address: ${fullAddress || NOT_SPECIFIED}
- Listing Type: ${listing?.listingType ? (isRental ? "Rental" : "For Sale") : NOT_SPECIFIED}
- Asking Price: ${priceLine}
- Specs: ${spec(listing?.bedrooms, " Beds")}, ${spec(listing?.bathrooms, " Baths")}, ${spec(listing?.sqft, " sqft")}
- Description: ${detail(listing?.description)}

POLICIES & DETAILS:
- Pets: ${detail(kbRecord?.petPolicyDetail || demo?.petPolicyDetail)}
- Parking: ${detail(kbRecord?.parkingDetail || demo?.parkingDetail)}
- Utilities: ${detail(kbRecord?.utilitiesDetail)}
- Application: ${detail(kbRecord?.applicationProcess)}
${contactEmail ? `- Listing Contact Email: ${contactEmail}` : ""}

VERIFIED PROPERTY FAQS:
${faqsText || "No additional custom FAQs."}

NEGOTIATION CONCESSION GUARDRAILS:
${
  targetPrice > 0
    ? `- Target Price: ₹${targetPrice.toLocaleString("en-IN")}
- Minimum Floor Price: ₹${Number(floorPrice).toLocaleString("en-IN")} (ABSOLUTE BOTTOM - NEVER GO BELOW)
- Allowed Concessions:
${concessionRulesText || "- None authorized. Do not offer any discount; refer pricing questions to the licensed broker."}`
    : "- Pricing is not verified. Do not quote or negotiate a price; refer pricing questions to the licensed broker."
}

RULES OF ENGAGEMENT:
1. Speak in concise, natural, spoken sentences (1-3 sentences max).
2. Only state facts verified in the knowledge base. Whenever a detail above reads "${NOT_SPECIFIED}", say you do not have it verified and offer to have the licensed broker follow up; never guess or invent a policy, spec, or price.
3. Use the Exchange-of-Value principle for negotiations. If a buyer asks for a discount, offer it ONLY in exchange for a listed concession condition.
4. When the buyer is interested, proactively offer two time slots to book an in-person viewing.
${contactEmail ? `5. If asked for direct owner or leasing office contact, provide the verified contact email: ${contactEmail}.` : ""}
    `.trim();
    }
  }

  // 4. Call Agora Conversational AI Cloud Gateway REST API (v2)
  const authHeader = buildAgoraCloudAuthHeader(channelName, agentUid);
  if (!authHeader) {
    throw new Error(
      "Missing Agora credentials in .env. Please configure AGORA_APP_ID and AGORA_APP_CERTIFICATE (or AGORA_CUSTOMER_ID & AGORA_CUSTOMER_SECRET)."
    );
  }

  // 5. Configure LLM brain (Google Gemini or OpenAI)
  const geminiApiKey = getGeminiApiKey();
  const openaiApiKey = (process.env.OPENAI_API_KEY || "").trim();

  let llmConfig: any = null;
  if (geminiApiKey) {
    const geminiModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    llmConfig = {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse&key=${geminiApiKey}`,
      system_messages: buildSystemMessages(systemPrompt),
      greeting_message: greeting,
      params: {
        model: geminiModel,
      },
      style: "gemini",
      ignore_empty: true,
    };
  } else if (openaiApiKey) {
    llmConfig = {
      url: "https://api.openai.com/v1/chat/completions",
      api_key: openaiApiKey,
      system_messages: buildSystemMessages(systemPrompt),
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

  // 6. Register Voice Session in Database, now that credentials are known to exist
  //    (agoraSessionId is filled with the remote agent id after join)
  let voiceSessionRowId: number | null = null;
  try {
    const callerIdentifier = userId || (ownerEmail ? `user-${ownerEmail}` : `user-${userUid}`);
    const [sess] = await db
      .insert(voiceSessions)
      .values({
        propertyId: propertyRecord?.id || null,
        channelName,
        callerType,
        callerIdentifier,
        status: "active",
      })
      .returning({ id: voiceSessions.id });
    voiceSessionRowId = sess?.id ?? null;
  } catch (dbErr) {
    console.warn("[Agora Voice Session] DB insert warning:", dbErr);
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
      skip_patterns: [4],
    };
  } else if (process.env.ELEVENLABS_API_KEY?.trim()) {
    ttsConfig = {
      vendor: "elevenlabs",
      params: {
        key: process.env.ELEVENLABS_API_KEY.trim(),
        voice_id: process.env.ELEVENLABS_VOICE_ID?.trim() || "21m00Tcm4TlvDq8ikWAM",
        model_id: "eleven_turbo_v2_5",
      },
      skip_patterns: [4],
    };
  } else if (process.env.MICROSOFT_TTS_KEY?.trim()) {
    ttsConfig = {
      vendor: "microsoft",
      params: {
        key: process.env.MICROSOFT_TTS_KEY.trim(),
        region: process.env.MICROSOFT_TTS_REGION?.trim() || "eastus",
        voice_name: process.env.MICROSOFT_TTS_VOICE?.trim() || "en-US-JennyMultilingualNeural",
      },
      skip_patterns: [4],
    };
  } else if (openaiApiKey) {
    ttsConfig = {
      vendor: "openai",
      params: {
        api_key: openaiApiKey,
        model: "tts-1",
        voice: "alloy",
      },
      skip_patterns: [4],
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
      skip_patterns: [4],
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
        // Barge-in gating. A cough or a filler word is ~100-350ms of voice energy and used to
        // stop the agent mid-sentence. speaking_interrupt_duration_ms is the only knob that
        // applies solely while the agent is talking, so raising it suppresses those without
        // making the caller hold a long syllable to start a turn once the agent is idle.
        turn_detection: {
          mode: "default",
          config: {
            start_of_speech: {
              mode: "vad",
              vad_config: {
                interrupt_duration_ms: 160,
                speaking_interrupt_duration_ms: callerType === "sales_agent" ? 650 : 800,
                prefix_padding_ms: 300,
              },
            },
            end_of_speech: {
              mode: "vad",
              vad_config: {
                silence_duration_ms: 1000,
              },
            },
          },
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
      parsedDetail = [errJson.detail, errJson.reason, errJson.message].filter(Boolean).join(" - ");
    } catch {
      parsedDetail = errorBody;
    }

    console.error(`[Agora Gateway Error ${response.status}]:`, parsedDetail || response.statusText);

    // Update voiceSession record to failed
    if (voiceSessionRowId !== null) {
      try {
        await db
          .update(voiceSessions)
          .set({ status: "failed", endedAt: new Date() })
          .where(eq(voiceSessions.id, voiceSessionRowId));
      } catch (dbErr) {
        console.warn("[Agora Voice Session] DB update to failed warning:", dbErr);
      }
    }

    throw new Error(
      `Agora Conversational AI Gateway error (${response.status}): ${parsedDetail || response.statusText || "Failed to start agent"}`
    );
  }

  const json = await response.json();
  const remoteAgentId: string = json.agent_id || json.data?.agent_id || `agora-sess-${voiceSessionRowId ?? Date.now()}`;

  // Store the id the client will hand back to /session/stop, so the row can be closed and the stop call verified
  if (voiceSessionRowId !== null) {
    try {
      await db
        .update(voiceSessions)
        .set({ agoraSessionId: remoteAgentId })
        .where(eq(voiceSessions.id, voiceSessionRowId));
    } catch (dbErr) {
      console.warn("[Agora Voice Session] DB agent id update warning:", dbErr);
    }
  }

  return {
    success: true,
    sessionId: remoteAgentId,
    voiceSessionId: voiceSessionRowId,
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
 * Returns null when no session with this id exists on this channel, so callers
 * cannot stop arbitrary agents by guessing ids.
 */
export async function stopAgoraAgentSession(sessionId: string, channelName: string) {
  const [row] = await db
    .select({ id: voiceSessions.id, startedAt: voiceSessions.startedAt })
    .from(voiceSessions)
    .where(and(eq(voiceSessions.agoraSessionId, sessionId), eq(voiceSessions.channelName, channelName)))
    .limit(1);
  if (!row) return null;

  const appId = getAgoraAppId();
  const authHeader = buildAgoraCloudAuthHeader(channelName);

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

  let endedAt = new Date();
  let durationSeconds = row.startedAt
    ? Math.max(0, Math.round((endedAt.getTime() - new Date(row.startedAt).getTime()) / 1000))
    : 0;

  // Query Agora Cloud Gateway for ground-truth duration
  if (appId && authHeader && sessionId) {
    try {
      const agentDetails = await fetchAgoraAgentDetails(sessionId, channelName);
      if (agentDetails?.durationSeconds && agentDetails.durationSeconds > 0) {
        durationSeconds = agentDetails.durationSeconds;
        if (agentDetails.stop_ts) {
          endedAt = new Date(agentDetails.stop_ts * 1000);
        }
      }
    } catch (e) {
      console.warn("[Agora Gateway] Telemetry fetch warning on stop:", e);
    }
  }

  await db
    .update(voiceSessions)
    .set({ status: "completed", endedAt, durationSeconds })
    .where(eq(voiceSessions.id, row.id));

  return { success: true, sessionId, channelName, durationSeconds };
}
