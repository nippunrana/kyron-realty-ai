import type { UIAction } from "./voice-agent-types";

/**
 * Silent screen-control tags. Elena ends the sentence that announces a card with one of
 * these; the agent's TTS config skips square-bracketed text (`skip_patterns: [4]`), so the
 * tag is never spoken while the transcript still carries it. Tags are the primary control
 * signal - the spoken-language patterns below are the fallback for a turn without one.
 */
const UI_TAG = /\[\s*UI\s*:\s*([A-Z_]+)\s*\]/gi;
const TAG_ACTIONS: Record<string, UIAction> = {
  OPEN_CORE: "open_core_modal",
  OPEN_REVIEW: "open_review_modal",
  OPEN_PHOTOS: "open_upload_modal",
  OPEN_FINAL: "open_final_modal",
  CLOSE: "close_review_modal",
};

export type AssistantIntentSource = "tag" | "regex";

export interface AssistantIntent {
  action: UIAction;
  source: AssistantIntentSource;
}

/** Removes screen-control tags so they never reach the owner's transcript or the extractors. */
export function stripUITags(text: string): string {
  if (!/\[\s*UI\s*:/i.test(text)) return text;
  return text
    .replace(UI_TAG, "")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** The action named by the last recognised tag in the text, or null when there is none. */
function parseUITag(text: string): UIAction | null {
  let action: UIAction | null = null;
  for (const match of text.matchAll(UI_TAG)) {
    const mapped = TAG_ACTIONS[match[1].toUpperCase()];
    if (mapped) action = mapped;
  }
  return action;
}

const USER_OPEN_CORE =
  /(pull|bring|open|show|display|pop).*(core specs|core details|\d+ core)/i;
const USER_OPEN_PHOTOS =
  /(pull|bring|open|show|display|pop).*(photo|photos|image|images|upload window|upload modal)/i;
const USER_CLOSE_PHOTOS =
  /(close|hide|dismiss|minimize|shut).*(photo|photos|image|images|upload)/i;
const USER_OPEN_FINAL =
  /(pull|bring|open|show|display|pop).*(final|deploy|complete property card)/i;
const USER_OPEN =
  /(pull|bring|open|show|display|pop|bring back|pull back|pull it back|bring it back).*(card|modal|pop[- ]?up|review|summary|details|specs)/i;
const USER_CLOSE = /(close|hide|dismiss|minimize|shut).*(card|modal|pop[- ]?up|review|summary)/i;
const USER_APPROVE =
  /(all is done|all done|everything is done|all set|looks good|all looks good|look good|we can proceed|proceed further|let's proceed|let's move on|that's right|confirmed|continue|ready for photos|move on to photos)/i;

const ASSISTANT_OPEN_CORE =
  /(pull|bring|open|show|display).*(core specs|core details|\d+ core).*(screen|for you|back up|take a look|right now)/i;
const ASSISTANT_OPEN_HYPER_LOCAL =
  /(found this neighborhood|neighborhood and transit|hyper[- ]?local|transit information).*(screen|for you|take a look|tell me if this is accurate)/i;
const ASSISTANT_OPEN_PHOTOS =
  /(pull|bring|open|show|display).*(photo|photos|image|images|upload window|upload modal).*(screen|for you|right now)/i;
const ASSISTANT_OPEN_FINAL =
  /(pull|bring|open|show|display).*(final|complete property card|full property review|hit deploy|ready to deploy).*(screen|for you|back up|take a look|right now)/i;
const ASSISTANT_OPEN_GENERIC =
  /(pull|bring|open|show|display).*(card|modal|pop[- ]?up|review|specs).*(screen|for you|back up|take a look|right now)/i;
const ASSISTANT_CLOSE = /(close|closed|hide|dismiss|minimiz).*(card|modal|pop[- ]?up|review)/i;
/**
 * Elena's sign-off on an off-topic call. Deliberately narrow: it needs her stating she
 * cannot continue AND naming her role, so an ordinary sentence about ending or wrapping
 * up cannot hang up a working call. Deliberately never a tag, either - the hang-up is the
 * one action that must stay hard to trigger.
 */
const ASSISTANT_END_CALL =
  /(cannot|can not|can't|won't be able to|unable to)\s+(continue|carry on|keep going with)[\s\S]{0,60}(chat|call|conversation|session)[\s\S]{0,120}(property listing agent|listing agent|listing specialist)/i;

/** Verbal review-card commands from the owner: open wins over close/approve. */
export function detectUserModalIntent(text: string): UIAction | null {
  if (USER_OPEN_CORE.test(text)) return "open_core_modal";
  if (USER_OPEN_PHOTOS.test(text)) return "open_upload_modal";
  if (USER_OPEN_FINAL.test(text)) return "open_final_modal";
  if (USER_OPEN.test(text)) return "open_review_modal";
  if (USER_CLOSE_PHOTOS.test(text)) return "close_upload_modal";
  if (USER_CLOSE.test(text) || USER_APPROVE.test(text)) return "close_review_modal";
  return null;
}

/**
 * The agent's screen action for a text: its `[UI:…]` tag when it carries one, otherwise the
 * spoken-language patterns. Within one text the tag wins, but the same sentence can be
 * delivered first without its tag (filtered during TTS playback), and that delivery is read
 * by the patterns - which is why the prompt bans narrating a close and an open in one turn:
 * the close pattern is matched first and would mask the open.
 */
export function detectAssistantModalIntent(text: string): AssistantIntent | null {
  // Terminal, so it is tested first: a sign-off that also mentions a card must still hang up.
  if (ASSISTANT_END_CALL.test(text)) return { action: "end_call", source: "regex" };
  const tagged = parseUITag(text);
  if (tagged) return { action: tagged, source: "tag" };
  if (ASSISTANT_CLOSE.test(text)) return { action: "close_review_modal", source: "regex" };
  if (ASSISTANT_OPEN_CORE.test(text)) return { action: "open_core_modal", source: "regex" };
  if (ASSISTANT_OPEN_HYPER_LOCAL.test(text)) return { action: "open_hyper_local", source: "regex" };
  if (ASSISTANT_OPEN_PHOTOS.test(text)) return { action: "open_upload_modal", source: "regex" };
  if (ASSISTANT_OPEN_FINAL.test(text)) return { action: "open_final_modal", source: "regex" };
  if (ASSISTANT_OPEN_GENERIC.test(text)) return { action: "open_review_modal", source: "regex" };
  return null;
}
