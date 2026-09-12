import type { VoiceMessage } from "./voice-agent-types";
import { stripUITags } from "./voice-intents.ts";

export const formatTimestamp = (ms?: number) =>
  new Date(ms ?? Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** True when a toolkit transcription item came from the local caller rather than the agent. */
export function isUserTranscriptionItem(item: any, localUids: string[]): boolean {
  const uidStr = String(item.uid ?? "");
  return (
    uidStr === "0" ||
    localUids.includes(uidStr) ||
    item.metadata?.object === "user.transcription" ||
    item.object === "user.transcription"
  );
}

/**
 * Maps toolkit transcription items to chat messages. Screen-control tags are stripped here,
 * so the owner's transcript, the turn extractor's window and end-of-call synthesis all see
 * clean speech; intent detection reads the raw items before this step.
 */
export function mapTranscriptionsToMessages(
  transcriptions: any[],
  isUser: (item: any) => boolean
): VoiceMessage[] {
  return transcriptions
    .map((item: any) => ({ item, text: stripUITags((item.text || "").trim()) }))
    .filter(({ item, text }) => text.length > 0 && !text.startsWith("[") && !(item.text || "").trim().startsWith("["))
    .map(({ item, text }, idx: number) => {
      const fromUser = isUser(item);
      return {
        id: `turn-${item.turn_id ?? idx}-${fromUser ? "user" : "agent"}`,
        role: fromUser ? "user" : "assistant",
        text,
        timestamp: formatTimestamp(item._time || undefined),
        createdAt: typeof item._time === "number" ? item._time : Date.now(),
      };
    });
}
