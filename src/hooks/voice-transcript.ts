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

/**
 * Returns the latest assistant utterance when the transcript holds at least one
 * user turn and that utterance differs from the last one extracted; otherwise null.
 */
export function findNewAssistantTurn(transcript: VoiceMessage[], lastExtractedText: string): string | null {
  if (!transcript || transcript.length === 0) return null;
  const hasText = (m: VoiceMessage) => Boolean(m.text && m.text.trim().length > 0);
  if (!transcript.some((m) => m.role === "user" && hasText(m))) return null;
  const assistantMessages = transcript.filter((m) => m.role === "assistant" && hasText(m));
  if (assistantMessages.length === 0) return null;
  const latest = assistantMessages[assistantMessages.length - 1].text.trim();
  return latest === lastExtractedText ? null : latest;
}
