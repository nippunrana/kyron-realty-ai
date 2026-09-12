import { NextRequest, NextResponse } from "next/server";
import { updateManagerCallSession, addManagerTranscript } from "@/lib/agora-telephony";
import { db } from "@/db";
import { properties, voiceSessions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { updateAgoraAgentPrompt, sendAgoraAgentInstruction } from "@/lib/agora-agent-client";
import { buildObserverPrompt } from "@/lib/sarah-property-prompt";
import { buildPropertyAgentContext } from "@/lib/property-agent-context";
import { emptyJourney } from "@/lib/sales-journey";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, channelName, propertyId } = body || {};

    if (!channelName || typeof channelName !== "string") {
      return NextResponse.json({ error: "channelName is required." }, { status: 400 });
    }

    if (event === "manager_speech") {
      const text = (body?.text || "").trim();
      if (!text) {
        return NextResponse.json({ ok: true, skipped: "empty" });
      }

      // Record transcript item for frontend retrieval
      const item = addManagerTranscript(channelName, text);

      // Relay to running Agora Conversational AI Agent via /think REST API
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
          await sendAgoraAgentInstruction(
            voiceSession.agoraSessionId,
            channelName,
            `Property Manager: ${text}`
          );
        }
      } catch (thinkErr) {
        console.warn("[Bridge Event] Think relay warning:", thinkErr);
      }

      return NextResponse.json({ ok: true, event: "manager_speech", item });
    }

    if (event === "connected") {
      updateManagerCallSession(channelName, "connected");

      // Transition Sarah's prompt to Passive Observer Mode
      if (propertyId) {
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
                prospectName: "the prospect",
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
          console.warn("[Bridge Event] Observer prompt swap warning:", promptErr);
        }
      }

      return NextResponse.json({ ok: true, event: "connected" });
    }

    if (event === "disconnected") {
      updateManagerCallSession(channelName, "completed");

      // Revert Sarah's prompt back to active Property Sales Mode
      if (propertyId) {
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
              .select({ slug: properties.slug })
              .from(properties)
              .where(eq(properties.id, propertyId))
              .limit(1);

            if (prop?.slug) {
              const context = await buildPropertyAgentContext(prop.slug, emptyJourney(), "handover");
              if (context) {
                await updateAgoraAgentPrompt(
                  voiceSession.agoraSessionId,
                  channelName,
                  context.systemPrompt
                );
              }
            }
          }
        } catch (revertErr) {
          console.warn("[Bridge Event] Revert prompt swap warning:", revertErr);
        }
      }

      return NextResponse.json({ ok: true, event: "disconnected" });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[Telephony Bridge Event API] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process bridge event." },
      { status: 500 }
    );
  }
}
