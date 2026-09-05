import type { VoiceMessage } from "./voice-agent-types";

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

export function mapTranscriptionsToMessages(
  transcriptions: any[],
  isUser: (item: any) => boolean
): VoiceMessage[] {
  return transcriptions
    .filter((item: any) => (item.text || "").trim().length > 0)
    .map((item: any, idx: number) => {
      const fromUser = isUser(item);
      return {
        id: `turn-${item.turn_id ?? idx}-${fromUser ? "user" : "agent"}`,
        role: fromUser ? "user" : "assistant",
        text: (item.text || "").trim(),
        timestamp: formatTimestamp(item._time || undefined),
      };
    });
}
