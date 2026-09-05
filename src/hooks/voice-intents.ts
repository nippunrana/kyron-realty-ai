import type { UIAction } from "./voice-agent-types";

const USER_OPEN =
  /(pull|bring|open|show|display|pop|bring back|pull back|pull it back|bring it back).*(card|modal|pop[- ]?up|review|summary|details|specs)/i;
const USER_CLOSE = /(close|hide|dismiss|minimize|shut).*(card|modal|pop[- ]?up|review|summary)/i;
const USER_APPROVE =
  /(looks good|all looks good|look good|we can proceed|proceed further|let's proceed|let's move on|that's right|confirmed|continue)/i;
const ASSISTANT_OPEN = /(pull|bring|open|show|display).*(card|modal|pop[- ]?up|review).*(screen|for you|back up|take a look)/i;
const ASSISTANT_CLOSE = /(close|hide|dismiss|minimiz).*(card|modal|pop[- ]?up|review)/i;

/** Verbal review-card commands from the owner: open wins over close/approve. */
export function detectUserModalIntent(text: string): UIAction | null {
  if (USER_OPEN.test(text)) return "open_review_modal";
  if (USER_CLOSE.test(text) || USER_APPROVE.test(text)) return "close_review_modal";
  return null;
}

/** The agent narrating that it opened or closed the review card. */
export function detectAssistantModalIntent(text: string): UIAction | null {
  if (ASSISTANT_OPEN.test(text)) return "open_review_modal";
  if (ASSISTANT_CLOSE.test(text)) return "close_review_modal";
  return null;
}
