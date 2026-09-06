import type { UIAction } from "./voice-agent-types";

const USER_OPEN_CORE =
  /(pull|bring|open|show|display|pop).*(core specs|core details|6 core)/i;
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
  /(pull|bring|open|show|display).*(core specs|core details|6 core).*(screen|for you|back up|take a look|right now)/i;
const ASSISTANT_OPEN_PHOTOS =
  /(pull|bring|open|show|display).*(photo|photos|image|images|upload window|upload modal).*(screen|for you|right now)/i;
const ASSISTANT_OPEN_FINAL =
  /(pull|bring|open|show|display).*(final|complete property card|full property review|hit deploy|ready to deploy).*(screen|for you|back up|take a look|right now)/i;
const ASSISTANT_OPEN_GENERIC =
  /(pull|bring|open|show|display).*(card|modal|pop[- ]?up|review|specs).*(screen|for you|back up|take a look|right now)/i;
const ASSISTANT_CLOSE = /(close|closed|hide|dismiss|minimiz).*(card|modal|pop[- ]?up|review)/i;

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

/** The agent narrating that it opened or closed the review card. */
export function detectAssistantModalIntent(text: string): UIAction | null {
  if (ASSISTANT_CLOSE.test(text)) return "close_review_modal";
  if (ASSISTANT_OPEN_CORE.test(text)) return "open_core_modal";
  if (ASSISTANT_OPEN_PHOTOS.test(text)) return "open_upload_modal";
  if (ASSISTANT_OPEN_FINAL.test(text)) return "open_final_modal";
  if (ASSISTANT_OPEN_GENERIC.test(text)) return "open_review_modal";
  return null;
}
