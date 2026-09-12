import type { UIAction, ParsedSearchTag, ParsedBookTourTag, ParsedCallManagerTag } from "./voice-agent-types";

/**
 * Silent screen-control tags. Elena ends the sentence that announces a card with one of
 * these; the agent's TTS config skips square-bracketed text (`skip_patterns: [4]`), so the
 * tag is never spoken while the transcript still carries it. Tags are the primary control
 * signal - the spoken-language patterns below are the fallback for a turn without one.
 */
const UI_TAG = /\[\s*UI\s*:\s*([A-Z_]+)\s*\]/gi;
const CONTROL_TAG = /\[\s*(UI|SEARCH|SEARCH_RESULT|OPEN_PROPERTY|PROPERTY_OPENED|CALENDAR_SELECT_DATE|CALENDAR_SCHEDULE|BOOK_TOUR|TOUR_BOOKED|CALL_MANAGER|MANAGER_CONNECTED|MANAGER_DISCONNECTED|MANAGER_UNAVAILABLE)\s*:[^\]]+\]/gi;

const TAG_ACTIONS: Record<string, UIAction> = {
  OPEN_CORE: "open_core_modal",
  OPEN_REVIEW: "open_review_modal",
  OPEN_PHOTOS: "open_upload_modal",
  OPEN_FINAL: "open_final_modal",
  OPEN_SEARCH: "open_search_hub",
  OPEN_SEARCH_HUB: "open_search_hub",
  CLOSE_SEARCH: "close_search_hub",
  CLOSE_SEARCH_HUB: "close_search_hub",
  OPEN_CALENDAR: "open_calendar_hub",
  OPEN_CALENDAR_HUB: "open_calendar_hub",
  CLOSE_CALENDAR: "close_calendar_hub",
  CLOSE_CALENDAR_HUB: "close_calendar_hub",
  CLOSE: "close_review_modal",
  CLOSE_CALL: "close_call",
  TRIGGER_DEPLOY: "trigger_deploy",
  DEPLOY: "trigger_deploy",
};

export type AssistantIntentSource = "tag" | "regex";

export interface AssistantIntent {
  action: UIAction;
  source: AssistantIntentSource;
}

export type { ParsedSearchTag };

const SEARCH_TAG = /\[\s*SEARCH\s*:\s*([^\]]+)\]/i;

/** Extracts structured search parameters from silent [SEARCH:city=...,pets=...] tags. */
export function parseSearchTag(text: string): ParsedSearchTag | null {
  const match = text.match(SEARCH_TAG);
  if (!match) return null;
  const rawParams = match[1];
  const result: ParsedSearchTag = {};

  const pairs = rawParams.split(",");
  for (const pair of pairs) {
    const [k, v] = pair.split("=").map((s) => s.trim());
    if (!k || !v) continue;
    const keyLower = k.toLowerCase();
    if (keyLower === "city") {
      result.city = v;
    } else if (keyLower === "pets" || keyLower === "pet") {
      result.pets = v.toLowerCase() === "true" || v.toLowerCase() === "yes";
    } else if (keyLower === "beds" || keyLower === "bedrooms") {
      const b = parseInt(v, 10);
      if (!isNaN(b)) result.bedrooms = b;
    } else if (keyLower === "type" || keyLower === "listingtype") {
      const t = v.toLowerCase();
      if (t === "rent" || t === "sale") result.listingType = t;
    } else if (keyLower === "minprice" || keyLower === "min_price") {
      const p = parseInt(v, 10);
      if (!isNaN(p)) result.minPrice = p;
    } else if (keyLower === "maxprice" || keyLower === "max_price" || keyLower === "price") {
      const p = parseInt(v, 10);
      if (!isNaN(p)) result.maxPrice = p;
    } else if (keyLower === "reset") {
      const r = v.toLowerCase();
      result.reset = r === "all" ? "all" : "filters";
    } else if (keyLower === "query") {
      result.query = v;
    }
  }
  return result;
}

const OPEN_PROPERTY_TAG = /\[\s*OPEN_PROPERTY\s*:\s*([^\]]+)\]/i;

/**
 * The result number Sarah names in her silent [OPEN_PROPERTY:index=2] tag, or null.
 * Deliberately tag-only, with no spoken-language fallback: opening a listing navigates the
 * caller away from the search hub, so it must never fire off a sentence that merely
 * discusses opening one. She emits the tag only after the caller confirms her read-back.
 */
export function parseOpenPropertyTag(text: string): number | null {
  const match = text.match(OPEN_PROPERTY_TAG);
  if (!match) return null;
  // Forgiving like the [UI:] tags: index=2, result=2 and a bare 2 all name the same card.
  const indexMatch = match[1].match(/(\d+)/);
  if (!indexMatch) return null;
  const index = parseInt(indexMatch[1], 10);
  return index > 0 ? index : null;
}

export interface CalendarDayLookup {
  date: string;
  dayName?: string;
  formattedDate?: string;
  fullDayLabel?: string;
}

/**
 * Resolves a date string or relative speech term ("today", "tomorrow", "Friday", "Sep 13", "2026-09-13")
 * to an exact ISO YYYY-MM-DD date matching one of the loaded calendar days.
 */
export function resolveDateFromDays(query: string, days: CalendarDayLookup[]): string | null {
  if (!query || !days || days.length === 0) return null;
  const q = query.trim().toLowerCase();

  // 1. Exact ISO match (e.g. "2026-09-13")
  const isoMatch = q.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (isoMatch) {
    const found = days.find((d) => d.date === isoMatch[0]);
    if (found) return found.date;
  }
  const exact = days.find((d) => d.date.toLowerCase() === q);
  if (exact) return exact.date;

  // 2. Relative "today" (first day in schedule)
  if (q === "today" || /\btoday\b/i.test(q)) {
    const todayDay = days.find((d) => d.dayName?.toLowerCase() === "today") || days[0];
    return todayDay ? todayDay.date : null;
  }

  // 3. Relative "day after tomorrow" (checked before "tomorrow")
  if (/\bday after tomorrow\b/i.test(q)) {
    if (days.length > 2) return days[2].date;
  }

  // 4. Relative "tomorrow" (second day in schedule)
  if (q === "tomorrow" || /\btomorrow\b/i.test(q)) {
    const tomorrowDay = days.find((d) => d.dayName?.toLowerCase() === "tomorrow") || days[1] || days[0];
    return tomorrowDay ? tomorrowDay.date : null;
  }

  // 5. Day names (e.g. "friday", "fri", "mon", "monday")
  const dayNames = [
    { full: "monday", short: "mon" },
    { full: "tuesday", short: "tue" },
    { full: "wednesday", short: "wed" },
    { full: "thursday", short: "thu" },
    { full: "friday", short: "fri" },
    { full: "saturday", short: "sat" },
    { full: "sunday", short: "sun" },
  ];

  for (const dn of dayNames) {
    const regex = new RegExp(`\\b(${dn.full}|${dn.short})\\b`, "i");
    if (regex.test(q)) {
      const match = days.find(
        (d) =>
          d.dayName?.toLowerCase() === dn.full ||
          d.dayName?.toLowerCase() === dn.short ||
          d.fullDayLabel?.toLowerCase().includes(dn.full) ||
          d.fullDayLabel?.toLowerCase().includes(dn.short)
      );
      if (match) return match.date;
    }
  }

  // 6. Month + Day (e.g. "sep 13", "september 13th", "sep 14")
  const monthDayMatch = q.match(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
  );
  if (monthDayMatch) {
    const monthPrefix = monthDayMatch[1].toLowerCase().slice(0, 3);
    const dayNum = parseInt(monthDayMatch[2], 10);
    const match = days.find((d) => {
      const fd = (d.formattedDate || d.fullDayLabel || "").toLowerCase();
      return fd.includes(monthPrefix) && fd.includes(String(dayNum));
    });
    if (match) return match.date;
  }

  return null;
}

const CALENDAR_SELECT_DATE_TAG = /\[\s*CALENDAR_SELECT_DATE\s*:\s*([^\]]+)\]/i;

/** Extracts date string or relative term (YYYY-MM-DD, "tomorrow", "Friday") from [CALENDAR_SELECT_DATE:...]. */
export function parseCalendarSelectDateTag(text: string): string | null {
  const match = text.match(CALENDAR_SELECT_DATE_TAG);
  if (!match) return null;
  const raw = match[1].trim();
  const dateMatch = raw.match(/(\d{4}-\d{2}-\d{2})/);
  return dateMatch ? dateMatch[1] : raw;
}

const TARGET_DAYS =
  "(?:today|tomorrow|day after tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\s+\\d{1,2}|\\d{4}-\\d{2}-\\d{2})";

const ASSISTANT_CALENDAR_DATE_SPOKEN_1 = new RegExp(
  `(?:let me\\s+)?(?:switch|switched|switching|change|changed|changing|move|moved|moving|flip|flipping|turn|bring up)\\b[\\s\\S]{0,40}?\\b(?:to|for|on)\\s+(${TARGET_DAYS})`,
  "i"
);

const ASSISTANT_CALENDAR_DATE_SPOKEN_2 = new RegExp(
  `(?:let'?s\\s+)?(?:look at|check|checking|see|open|show|showing)\\b[\\s\\S]{0,30}?\\b(${TARGET_DAYS})`,
  "i"
);

/** Detects spoken assistant date switching phrases like "Let me switch the calendar to tomorrow for you" or "Let's look at Friday." */
export function detectAssistantCalendarDateIntent(text: string): string | null {
  const m1 = text.match(ASSISTANT_CALENDAR_DATE_SPOKEN_1);
  if (m1) return m1[1].trim();
  const m2 = text.match(ASSISTANT_CALENDAR_DATE_SPOKEN_2);
  if (m2) return m2[1].trim();
  return null;
}

const USER_CALENDAR_DATE_SPOKEN_1 =
  /(?:can you\s+)?(?:switch|show|change|open|move|display|look at|check|go to)\b[\s\S]{0,40}?\b(?:calendar|schedule|slots|it)?\b[\s\S]{0,20}?\b(?:to|for|on)\s+(today|tomorrow|day after tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2}|\d{4}-\d{2}-\d{2})/i;

const USER_CALENDAR_DATE_SPOKEN_2 =
  /(?:what about|how about|is|can we do)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;

const USER_CALENDAR_DATE_SPOKEN_3 =
  /(?:switch to|show me|show|open|check|look at)\s+(today|tomorrow|day after tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:'?s\s+(?:calendar|schedule|slots))?/i;

/** Detects user speech asking to view/switch a specific calendar day (e.g. "Can you show it for tomorrow?"). */
export function detectUserCalendarDateIntent(text: string): string | null {
  const m1 = text.match(USER_CALENDAR_DATE_SPOKEN_1);
  if (m1) return m1[1].trim();
  const m3 = text.match(USER_CALENDAR_DATE_SPOKEN_3);
  if (m3) return m3[1].trim();
  const m2 = text.match(USER_CALENDAR_DATE_SPOKEN_2);
  if (m2) return m2[1].trim();
  return null;
}

const BOOK_TOUR_TAG = /\[\s*BOOK_TOUR\s*:\s*([^\]]+)\]/i;

/** Extracts booking parameters from silent [BOOK_TOUR:date=...,time=...,name=...,phone=...] tags. */
export function parseBookTourTag(text: string): ParsedBookTourTag | null {
  const match = text.match(BOOK_TOUR_TAG);
  if (!match) return null;
  const raw = match[1];
  const result: ParsedBookTourTag = {};

  const pairs = raw.split(",");
  for (const pair of pairs) {
    const [k, ...rest] = pair.split("=");
    const v = rest.join("=").trim();
    if (!k || !v) continue;
    const keyLower = k.trim().toLowerCase();
    if (keyLower === "date") result.date = v;
    else if (keyLower === "time") result.time = v;
    else if (keyLower === "name") result.name = v;
    else if (keyLower === "phone") result.phone = v;
    else if (keyLower === "email") result.email = v;
    else if (keyLower === "notes") result.notes = v;
  }
  return result.date && result.time ? result : null;
}

const CALL_MANAGER_TAG = /\[\s*CALL_MANAGER\s*:\s*([^\]]+)\]/i;

/** Extracts call manager parameters from silent [CALL_MANAGER:property_id=...,prospect_name=...] tags. */
export function parseCallManagerTag(text: string): ParsedCallManagerTag | null {
  const match = text.match(CALL_MANAGER_TAG);
  if (!match) return null;
  const raw = match[1];
  const result: ParsedCallManagerTag = {};

  const pairs = raw.split(",");
  for (const pair of pairs) {
    const [k, ...rest] = pair.split("=");
    const v = rest.join("=").trim();
    if (!k || !v) continue;
    const keyLower = k.trim().toLowerCase();
    if (keyLower === "property_id" || keyLower === "propertyid") {
      const pid = parseInt(v, 10);
      if (!isNaN(pid)) result.propertyId = pid;
    } else if (keyLower === "prospect_name" || keyLower === "name") {
      result.prospectName = v;
    } else if (keyLower === "notes") {
      result.notes = v;
    }
  }
  return result;
}

const ASSISTANT_SEARCH_SPOKEN =
  /(?:let me check|let me search|checking|searching|looking for|looking up|pulling up|finding|find you)\b[\s\S]{1,80}?\b(?:in|around|near)\s+(?:the\s+)?([a-zA-Z\s]+?)(?:\s+(?:within|for|with|under|budget|right now|immediately)|[.,!?;]|$)/i;

/**
 * Detects assistant search intent either from silent [SEARCH:city=...] tags (primary)
 * or spoken natural language confirmation (fallback).
 * Supports contextual refinement tags where city is omitted.
 */
export function detectAssistantSearchIntent(text: string): ParsedSearchTag | null {
  const tagged = parseSearchTag(text);
  if (tagged) {
    const hasCriteria =
      Boolean(tagged.city) ||
      tagged.pets !== undefined ||
      tagged.bedrooms !== undefined ||
      Boolean(tagged.listingType) ||
      tagged.minPrice !== undefined ||
      tagged.maxPrice !== undefined ||
      Boolean(tagged.reset) ||
      Boolean(tagged.query);
    if (hasCriteria) return tagged;
  }

  const match = text.match(ASSISTANT_SEARCH_SPOKEN);
  if (match) {
    const rawCity = match[1]?.trim();
    if (rawCity && rawCity.length > 2) {
      const city = rawCity
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
      const lower = text.toLowerCase();
      const pets = /\b(pet|pets|dog|dogs|cat|cats|pet-friendly)\b/i.test(lower);
      const bedMatch = lower.match(/(\d+)\s*(bhk|bed|bedroom)/i);
      const bedrooms = bedMatch ? parseInt(bedMatch[1], 10) : undefined;
      const isFlat = /\b(flat|flats|apartment|apartments)\b/i.test(lower);

      const result: ParsedSearchTag = { city };
      if (pets) result.pets = true;
      if (bedrooms) result.bedrooms = bedrooms;
      if (isFlat) result.query = "flat";
      return result;
    }
  }

  return null;
}

/** Removes screen-control and search tags so they never reach the owner's transcript or extractors. */
export function stripUITags(text: string): string {
  if (!/\[\s*(UI|SEARCH|SEARCH_RESULT|OPEN_PROPERTY|PROPERTY_OPENED|CALENDAR_SELECT_DATE|CALENDAR_SCHEDULE|BOOK_TOUR|TOUR_BOOKED|CALL_MANAGER|MANAGER_CONNECTED|MANAGER_DISCONNECTED|MANAGER_UNAVAILABLE)\s*:/i.test(text)) return text;
  return text
    .replace(CONTROL_TAG, "")
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

const USER_OPEN_SEARCH =
  /(pull|bring|open|show|display|reopen|pull back|bring back).*(search|listings|properties|search bar|search hub|search panel|search results)/i;
const USER_CLOSE_SEARCH =
  /(close|hide|dismiss|minimize|shut).*(search|listings|properties|search bar|search hub|search panel|search results)/i;
const USER_OPEN_CALENDAR =
  /(pull|bring|open|show|display|reopen|look at|check).*(calendar|schedule|tour slots|viewing slots|timing|available times|availability)/i;
const USER_CLOSE_CALENDAR =
  /(close|hide|dismiss|minimize|shut).*(calendar|schedule|tour slots|viewing slots)/i;
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

const ASSISTANT_OPEN_SEARCH =
  /(pull|bring|open|show|display|reopen|pull back|bring back).*(search|listings|properties|search bar|search hub|search panel|search results).*(screen|for you|back up|take a look|right now)/i;
const ASSISTANT_CLOSE_SEARCH =
  /(close|closed|hide|dismiss|minimiz|shut).*(search|listings|properties|search bar|search hub|search panel|search results)/i;
const ASSISTANT_OPEN_CALENDAR =
  /(pull|bring|open|show|display|reopen).*(calendar|schedule|tour slots|viewing slots|availability).*(screen|for you|take a look|right now)/i;
const ASSISTANT_CLOSE_CALENDAR =
  /(close|closed|hide|dismiss|minimiz|shut).*(calendar|schedule|tour slots|viewing slots)/i;
const ASSISTANT_OPEN_CORE =
  /(pull|bring|open|show|display).*(core specs|core details|\d+ core).*(screen|for you|back up|take a look|right now)/i;
const ASSISTANT_OPEN_HYPER_LOCAL =
  /(found this neighborhood|neighborhood and transit|hyper[- ]?local|transit information).*(screen|for you|take a look|tell me if this is accurate)/i;
const ASSISTANT_OPEN_PHOTOS =
  /(pull|bring|open|show|display).*(photo|photos|image|images|upload window|upload modal).*(screen|for you|right now)/i;
const ASSISTANT_OPEN_FINAL =
  /(pull|bring|open|show|display).*(final|complete property card|full property review|hit deploy|ready to deploy).*(screen|for you|back up|take a look|right now)/i;
const ASSISTANT_TRIGGER_DEPLOY =
  /(deploying|publishing|launching).*(listing|agent|property|right now|for you)/i;
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
  if (USER_OPEN_SEARCH.test(text)) return "open_search_hub";
  if (USER_CLOSE_SEARCH.test(text)) return "close_search_hub";
  if (USER_OPEN_CALENDAR.test(text)) return "open_calendar_hub";
  if (USER_CLOSE_CALENDAR.test(text)) return "close_calendar_hub";
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
  if (ASSISTANT_CLOSE_CALENDAR.test(text)) return { action: "close_calendar_hub", source: "regex" };
  if (ASSISTANT_OPEN_CALENDAR.test(text)) return { action: "open_calendar_hub", source: "regex" };
  if (ASSISTANT_CLOSE_SEARCH.test(text)) return { action: "close_search_hub", source: "regex" };
  if (ASSISTANT_OPEN_SEARCH.test(text)) return { action: "open_search_hub", source: "regex" };
  if (ASSISTANT_CLOSE.test(text)) return { action: "close_review_modal", source: "regex" };
  if (ASSISTANT_TRIGGER_DEPLOY.test(text)) return { action: "trigger_deploy", source: "regex" };
  if (ASSISTANT_OPEN_CORE.test(text)) return { action: "open_core_modal", source: "regex" };
  if (ASSISTANT_OPEN_HYPER_LOCAL.test(text)) return { action: "open_hyper_local", source: "regex" };
  if (ASSISTANT_OPEN_PHOTOS.test(text)) return { action: "open_upload_modal", source: "regex" };
  if (ASSISTANT_OPEN_FINAL.test(text)) return { action: "open_final_modal", source: "regex" };
  if (ASSISTANT_OPEN_GENERIC.test(text)) return { action: "open_review_modal", source: "regex" };
  return null;
}
