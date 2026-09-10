import { db } from "@/db";
import { voiceSessions } from "@/db/schema";
import { and, eq, isNotNull, isNull, or } from "drizzle-orm";
import { getAgoraAppId } from "@/lib/agora-token";

export interface AgoraAgentDetails {
  agent_id: string;
  name?: string;
  start_ts?: number;
  stop_ts?: number;
  status?: string;
  durationSeconds?: number;
}

/**
 * Authorization header for the Agora Conversational AI REST API:
 * Basic customer credentials when present, otherwise the conversational AI API key.
 */
export function buildAgoraCloudAuthHeader(): string {
  const customerId = process.env.AGORA_CUSTOMER_ID?.trim();
  const customerSecret = process.env.AGORA_CUSTOMER_SECRET?.trim();
  if (customerId && customerSecret) {
    return `Basic ${Buffer.from(`${customerId}:${customerSecret}`).toString("base64")}`;
  }

  const apiKey = (process.env.AGORA_CONVERSATIONAL_AI_API_KEY || process.env.AGORA_API_KEY || "").trim();
  if (!apiKey || apiKey === "your_agora_conversational_ai_api_key_here") return "";
  if (apiKey.startsWith("Basic ") || apiKey.startsWith("Bearer ")) return apiKey;
  return apiKey.includes(":") ? `Basic ${Buffer.from(apiKey).toString("base64")}` : `Basic ${apiKey}`;
}

/**
 * Queries Agora's Cloud Gateway for exact start_ts and stop_ts of a given Conversational AI agent instance.
 */
export async function fetchAgoraAgentDetails(agentId: string): Promise<AgoraAgentDetails | null> {
  const appId = getAgoraAppId();
  const authHeader = buildAgoraCloudAuthHeader();

  if (!appId || !authHeader || !agentId) {
    return null;
  }

  try {
    const url = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/agents/${agentId}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      // Short cache or no-store to avoid stale agent status
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[Agora Telemetry] Agent query returned status ${res.status} for ${agentId}`);
      return null;
    }

    const data = await res.json();
    let durationSeconds = 0;
    if (data.start_ts && data.stop_ts && data.stop_ts >= data.start_ts) {
      durationSeconds = data.stop_ts - data.start_ts;
    }

    return {
      agent_id: data.agent_id || agentId,
      name: data.name,
      start_ts: data.start_ts,
      stop_ts: data.stop_ts,
      status: data.status,
      durationSeconds,
    };
  } catch (err) {
    console.error(`[Agora Telemetry] Error querying agent ${agentId}:`, err);
    return null;
  }
}

/**
 * Synchronizes an individual database voice session with Agora's ground-truth duration.
 */
export async function syncSessionFromAgora(sessionId: number, agoraSessionId: string): Promise<number> {
  const details = await fetchAgoraAgentDetails(agoraSessionId);
  if (!details || details.durationSeconds === undefined || details.durationSeconds <= 0) {
    return 0;
  }

  try {
    const updateData: { durationSeconds: number; endedAt?: Date } = {
      durationSeconds: details.durationSeconds,
    };
    if (details.stop_ts) {
      updateData.endedAt = new Date(details.stop_ts * 1000);
    }

    await db
      .update(voiceSessions)
      .set(updateData)
      .where(eq(voiceSessions.id, sessionId));

    return details.durationSeconds;
  } catch (err) {
    console.error(`[Agora Telemetry] Failed to update session ${sessionId} with Agora duration:`, err);
    return 0;
  }
}

/**
 * Backfills all voice sessions in the database that currently have 0s duration
 * but have a valid Agora agent session ID recorded.
 */
export async function backfillUnsyncedSessions(): Promise<number> {
  try {
    const unsynced = await db
      .select({
        id: voiceSessions.id,
        agoraSessionId: voiceSessions.agoraSessionId,
      })
      .from(voiceSessions)
      .where(
        and(
          or(eq(voiceSessions.durationSeconds, 0), isNull(voiceSessions.durationSeconds)),
          isNotNull(voiceSessions.agoraSessionId)
        )
      )
      .limit(30);

    const targetSessions = unsynced.filter(
      (s) => s.agoraSessionId && s.agoraSessionId.trim() !== ""
    );

    if (targetSessions.length === 0) return 0;

    let updatedCount = 0;
    for (const session of targetSessions) {
      if (!session.agoraSessionId) continue;
      const duration = await syncSessionFromAgora(session.id, session.agoraSessionId);
      if (duration > 0) {
        updatedCount++;
      }
    }

    return updatedCount;
  } catch (err) {
    console.error("[Agora Telemetry] Error backfilling unsynced sessions:", err);
    return 0;
  }
}
