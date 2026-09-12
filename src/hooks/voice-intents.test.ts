/**
 * Pins Elena's scripted lines to the screen action they fire. Run with `npm run test:intents`
 * before rewording a line in `src/lib/elena-prompt.ts`: each line is also asserted to still
 * exist in the rendered prompt, so a reworded prompt cannot pass against a stale copy here.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { buildOwnerOnboardingPrompt } from "../lib/elena-prompt.ts";
import {
  detectAssistantModalIntent,
  detectAssistantSearchIntent,
  detectAssistantCalendarDateIntent,
  detectUserModalIntent,
  detectUserCalendarDateIntent,
  parseOpenPropertyTag,
  parseCalendarSelectDateTag,
  parseBookTourTag,
  parseCallManagerTag,
  resolveDateFromDays,
  stripUITags,
} from "./voice-intents.ts";

const { systemPrompt: promptSource } = buildOwnerOnboardingPrompt({
  ownerName: "Richa Luthra",
  ownerEmail: "owner@example.com",
});

const LINES = {
  openCore:
    "That's all 7 core details. I've pulled up your core specs review card on your screen [UI:OPEN_CORE]. Take a look and tell me if anything needs changing.",
  closeCore: "I've minimized the card [UI:CLOSE].",
  map: "Thanks - I'm checking the map right now for the nearest metro, schools and hospitals. That runs in the background, so let's keep going: a few more details will help our sales AI answer buyer questions.",
  openReview:
    "That's the extra details done. I've pulled up your full property review card on your screen [UI:OPEN_REVIEW]. It has your main details, extra details, and the metro, schools and hospitals near your address. Take a look and tell me if anything needs changing, or if all is done.",
  openPhotos:
    "I've opened your photo upload window on your screen [UI:OPEN_PHOTOS]. Add photos from your computer, or scan the QR code to send them straight from your phone.",
  openFinal:
    "That completes your property profile. I've pulled up your final complete property card on your screen [UI:OPEN_FINAL]. Take a look. If everything looks good, say Deploy or confirm and I'll launch it for you, or hit the button on screen.",
  triggerDeploy: "Got it, deploying your listing right now! [UI:TRIGGER_DEPLOY]",
  reopen: "I've pulled the review card back up on your screen [UI:OPEN_REVIEW].",
  minimize: "Sure, I've minimized the review card for you [UI:CLOSE].",
  strike2: "I need to keep this to your property listing. If we go off topic again I'll have to close this chat.",
  strike3: "Sorry, I can't continue this chat - I'm a property listing agent, so I'll wrap up here. Take care!",
};

/** [line, action fired by its tag, action the spoken-language fallback fires without the tag] */
const SCREEN_LINES: Array<[keyof typeof LINES, string, string]> = [
  ["openCore", "open_core_modal", "open_core_modal"],
  ["closeCore", "close_review_modal", "close_review_modal"],
  ["openReview", "open_review_modal", "open_final_modal"],
  ["openPhotos", "open_upload_modal", "open_upload_modal"],
  ["openFinal", "open_final_modal", "open_final_modal"],
  ["triggerDeploy", "trigger_deploy", "trigger_deploy"],
  ["reopen", "open_review_modal", "open_review_modal"],
  ["minimize", "close_review_modal", "close_review_modal"],
];

describe("scripted lines still exist in the prompt", () => {
  for (const [name, line] of Object.entries(LINES)) {
    test(name, () => assert.ok(promptSource.includes(line), `"${name}" has drifted from the prompt`));
  }
});

describe("tags are the primary signal", () => {
  for (const [name, tagged] of SCREEN_LINES) {
    test(`${name} fires by tag`, () => {
      assert.deepEqual(detectAssistantModalIntent(LINES[name]), { action: tagged, source: "tag" });
    });
  }

  test("tag spelling is forgiving", () => {
    assert.equal(detectAssistantModalIntent("Here it is [ ui: open_core ].")?.action, "open_core_modal");
  });

  test("CLOSE_CALL tag maps to close_call action", () => {
    assert.equal(
      detectAssistantModalIntent("Congratulations, your 24/7 AI sales agent is now deployed! Goodbye! [UI:CLOSE_CALL]")?.action,
      "close_call"
    );
  });

  test("the last tag in a turn wins", () => {
    assert.equal(
      detectAssistantModalIntent("I've minimized the card [UI:CLOSE]. And here's the photo window [UI:OPEN_PHOTOS].")?.action,
      "open_upload_modal"
    );
  });

  test("an unknown tag falls through to the spoken-language patterns", () => {
    assert.equal(detectAssistantModalIntent("Dancing now [UI:DANCE]."), null);
  });

  test("a tagged close-and-open sentence is not masked by the close pattern", () => {
    const line = "I've closed the review card and opened your photo upload window on your screen [UI:OPEN_PHOTOS].";
    assert.equal(detectAssistantModalIntent(line)?.action, "open_upload_modal");
    // Known limitation of the fallback, and the reason the tags exist:
    assert.equal(detectAssistantModalIntent(stripUITags(line))?.action, "close_review_modal");
  });
});

describe("spoken-language fallback routes the same lines without their tag", () => {
  for (const [name, , fallback] of SCREEN_LINES) {
    test(`${name} falls back by regex`, () => {
      assert.deepEqual(detectAssistantModalIntent(stripUITags(LINES[name])), { action: fallback, source: "regex" });
    });
  }

  test("lines that must not touch the screen", () => {
    assert.equal(detectAssistantModalIntent(LINES.map), null);
    assert.equal(detectAssistantModalIntent(LINES.strike2), null);
    assert.equal(
      detectAssistantModalIntent("Last thing before the review: should buyers reach you at owner@example.com, or a different address?"),
      null
    );
  });

  test("the sign-off hangs up, even with a stray tag, and stays regex-only", () => {
    assert.deepEqual(detectAssistantModalIntent(LINES.strike3), { action: "end_call", source: "regex" });
    assert.equal(detectAssistantModalIntent(`${LINES.strike3} [UI:CLOSE]`)?.action, "end_call");
    assert.equal(detectAssistantModalIntent("Goodbye then [UI:END_CALL]."), null);
  });
});

describe("stripUITags", () => {
  test("removes tags and re-attaches punctuation", () => {
    assert.equal(stripUITags(LINES.openPhotos), "I've opened your photo upload window on your screen. Add photos from your computer, or scan the QR code to send them straight from your phone.");
    assert.equal(stripUITags("Done [UI:CLOSE]"), "Done");
    assert.equal(stripUITags("Your listing is live! Take care![UI:CLOSE_CALL]"), "Your listing is live! Take care!");
  });

  test("leaves untagged text byte-for-byte alone", () => {
    const text = "Rent is 95,000 , right ?";
    assert.equal(stripUITags(text), text);
  });
});

describe("mapTranscriptionsToMessages system cue isolation", () => {
  test("filters out internal [DEPLOY_CONFIRMED] and [DEPLOY_FAILED] cues", async () => {
    const { mapTranscriptionsToMessages } = await import("./voice-transcript.ts");
    const rawItems = [
      {
        turn_id: 1,
        text: "This looks good, deploy it.",
        uid: "user-123",
      },
      {
        turn_id: 2,
        text: "[DEPLOY_CONFIRMED] The listing was successfully published and saved to the database. Deliver your warm, celebratory closing remarks and sign off with [UI:CLOSE_CALL] now.",
        uid: "user-123",
      },
      {
        turn_id: 3,
        text: "Your listing is successfully published and live! Your 24/7 AI voice sales agent is active. Take care![UI:CLOSE_CALL]",
        uid: "agent-999",
      },
      {
        turn_id: 4,
        text: "[DEPLOY_FAILED] Database connection timed out.",
        uid: "user-123",
      },
    ];

    const messages = mapTranscriptionsToMessages(rawItems, (item) => item.uid === "user-123");

    // Must only have 2 messages: user speech and clean assistant speech (both system cues stripped)
    assert.equal(messages.length, 2);
    assert.equal(messages[0].text, "This looks good, deploy it.");
    assert.equal(messages[0].role, "user");
    assert.equal(
      messages[1].text,
      "Your listing is successfully published and live! Your 24/7 AI voice sales agent is active. Take care!"
    );
    assert.equal(messages[1].role, "assistant");
  });
});

describe("owner commands", () => {
  test("open wins over close and approve", () => {
    assert.equal(detectUserModalIntent("pull up the core specs again"), "open_core_modal");
    assert.equal(detectUserModalIntent("show me the photo upload window"), "open_upload_modal");
    assert.equal(detectUserModalIntent("bring back the review card"), "open_review_modal");
    assert.equal(detectUserModalIntent("close the card, looks good"), "close_review_modal");
  });

  test("plain approval closes", () => {
    assert.equal(detectUserModalIntent("looks good, let's move on"), "close_review_modal");
  });
});

describe("detectAssistantSearchIntent", () => {
  test("detects search parameters from silent [SEARCH:...] tag", () => {
    const res = detectAssistantSearchIntent("Let me check that for you! [SEARCH:city=Faridabad,pets=true,bedrooms=3]");
    assert.deepEqual(res, {
      city: "Faridabad",
      pets: true,
      bedrooms: 3,
    });
  });

  test("detects search parameters from spoken confirmation fallback", () => {
    const res = detectAssistantSearchIntent(
      "Let me check our available flats in Faridabad within that budget for you right now."
    );
    assert.deepEqual(res, {
      city: "Faridabad",
      query: "flat",
    });
  });

  test("detects pet-friendly search from spoken sentence", () => {
    const res = detectAssistantSearchIntent(
      "Let me check our pet-friendly properties in Faridabad for you right now."
    );
    assert.deepEqual(res, {
      city: "Faridabad",
      pets: true,
    });
  });

  test("detects multi-word city from spoken confirmation", () => {
    const res = detectAssistantSearchIntent(
      "Let me check available flats in New Delhi for you right now."
    );
    assert.deepEqual(res, {
      city: "New Delhi",
      query: "flat",
    });
  });

  test("detects refinement tag with pets only (city omitted for sticky context)", () => {
    const res = detectAssistantSearchIntent("Checking pet-friendly options for you! [SEARCH:pets=true]");
    assert.deepEqual(res, {
      pets: true,
    });
  });

  test("detects refinement tag with bedrooms and listingType", () => {
    const res = detectAssistantSearchIntent("Pulling up 2 BHK rentals! [SEARCH:bedrooms=2,type=rent,maxPrice=45000]");
    assert.deepEqual(res, {
      bedrooms: 2,
      listingType: "rent",
      maxPrice: 45000,
    });
  });

  test("detects filter reset tag", () => {
    const res = detectAssistantSearchIntent("Showing all properties in this city! [SEARCH:reset=filters]");
    assert.deepEqual(res, {
      reset: "filters",
    });
  });

  test("returns null for non-search sentences", () => {
    assert.equal(
      detectAssistantSearchIntent(
        "Hi, I can hear you loud and clear! How can I help you find a new home today?"
      ),
      null
    );
    assert.equal(
      detectAssistantSearchIntent(
        "I would love to help you find a flat! Which city are you looking in?"
      ),
      null
    );
  });
});

describe("search hub open and close intents", () => {
  test("user close command routes to close_search_hub", () => {
    assert.equal(detectUserModalIntent("can you please close the search"), "close_search_hub");
    assert.equal(detectUserModalIntent("hide the listings for now"), "close_search_hub");
    assert.equal(detectUserModalIntent("minimize the search results"), "close_search_hub");
  });

  test("user open command routes to open_search_hub", () => {
    assert.equal(detectUserModalIntent("show the search again"), "open_search_hub");
    assert.equal(detectUserModalIntent("bring back the listings"), "open_search_hub");
    assert.equal(detectUserModalIntent("reopen the property search"), "open_search_hub");
  });

  test("assistant CLOSE_SEARCH tag routes to close_search_hub", () => {
    assert.deepEqual(
      detectAssistantModalIntent("I'll close the search for you right now [UI:CLOSE_SEARCH]."),
      { action: "close_search_hub", source: "tag" }
    );
  });

  test("assistant OPEN_SEARCH tag routes to open_search_hub", () => {
    assert.deepEqual(
      detectAssistantModalIntent("Here are the property listings back on your screen [UI:OPEN_SEARCH]."),
      { action: "open_search_hub", source: "tag" }
    );
  });

  test("assistant spoken close fallback routes to close_search_hub", () => {
    assert.deepEqual(
      detectAssistantModalIntent("I've closed the search panel for you."),
      { action: "close_search_hub", source: "regex" }
    );
  });
});

describe("opening a numbered search result", () => {
  const confirmed = "Opening it for you now! [OPEN_PROPERTY:index=2]";

  test("reads the result number from the tag", () => {
    assert.equal(parseOpenPropertyTag(confirmed), 2);
    assert.equal(parseOpenPropertyTag("Opening that one! [ open_property : index = 10 ]"), 10);
    assert.equal(parseOpenPropertyTag("Opening that one! [OPEN_PROPERTY:2]"), 2);
  });

  test("the confirmation turn before the yes opens nothing", () => {
    const readBack = "Result 2 is Green Valley Residency, a 3 BHK at 45,000 a month. Shall I open it?";
    assert.equal(parseOpenPropertyTag(readBack), null);
    // The read-back must also not be mistaken for a fresh search, which would renumber the cards.
    assert.equal(detectAssistantSearchIntent(readBack), null);
  });

  test("is tag-only: spoken sentences about opening never navigate", () => {
    assert.equal(parseOpenPropertyTag("Let's open that property on your screen."), null);
    assert.equal(parseOpenPropertyTag("Opening it now [OPEN_PROPERTY:]"), null);
    assert.equal(parseOpenPropertyTag("Opening it now [OPEN_PROPERTY:index=0]"), null);
  });

  test("the open tag never reaches the caller's transcript", () => {
    assert.equal(stripUITags(confirmed), "Opening it for you now!");
  });

  test("the result cue never reaches the caller's transcript", () => {
    assert.equal(
      stripUITags("[SEARCH_RESULT:city=Faridabad,count=2,filters=3 BHK homes,results=1:Green Valley|3 BHK;2:Sun Villa|4 BHK]"),
      ""
    );
  });
});

describe("calendar hub open, close, and booking intents", () => {
  test("assistant OPEN_CALENDAR tag routes to open_calendar_hub", () => {
    assert.deepEqual(
      detectAssistantModalIntent("I'm pulling up the touring calendar on your screen [UI:OPEN_CALENDAR]."),
      { action: "open_calendar_hub", source: "tag" }
    );
  });

  test("assistant CLOSE_CALENDAR tag routes to close_calendar_hub", () => {
    assert.deepEqual(
      detectAssistantModalIntent("I've closed the touring calendar [UI:CLOSE_CALENDAR]."),
      { action: "close_calendar_hub", source: "tag" }
    );
  });

  test("parseCalendarSelectDateTag extracts YYYY-MM-DD", () => {
    assert.equal(
      parseCalendarSelectDateTag("Let's look at Friday! [CALENDAR_SELECT_DATE:2026-09-18]"),
      "2026-09-18"
    );
  });

  test("parseCalendarSelectDateTag extracts relative terms like tomorrow", () => {
    assert.equal(
      parseCalendarSelectDateTag("Let me switch that [CALENDAR_SELECT_DATE:tomorrow]"),
      "tomorrow"
    );
  });

  test("resolveDateFromDays correctly maps relative terms and day names", () => {
    const mockDays = [
      { date: "2026-09-12", dayName: "Today", formattedDate: "Sep 12", fullDayLabel: "Today, Sat, Sep 12" },
      { date: "2026-09-13", dayName: "Tomorrow", formattedDate: "Sep 13", fullDayLabel: "Tomorrow, Sun, Sep 13" },
      { date: "2026-09-14", dayName: "Mon", formattedDate: "Sep 14", fullDayLabel: "Mon, Sep 14" },
      { date: "2026-09-15", dayName: "Tue", formattedDate: "Sep 15", fullDayLabel: "Tue, Sep 15" },
      { date: "2026-09-16", dayName: "Wed", formattedDate: "Sep 16", fullDayLabel: "Wed, Sep 16" },
      { date: "2026-09-17", dayName: "Thu", formattedDate: "Sep 17", fullDayLabel: "Thu, Sep 17" },
      { date: "2026-09-18", dayName: "Fri", formattedDate: "Sep 18", fullDayLabel: "Fri, Sep 18" },
    ];

    assert.equal(resolveDateFromDays("today", mockDays), "2026-09-12");
    assert.equal(resolveDateFromDays("tomorrow", mockDays), "2026-09-13");
    assert.equal(resolveDateFromDays("day after tomorrow", mockDays), "2026-09-14");
    assert.equal(resolveDateFromDays("monday", mockDays), "2026-09-14");
    assert.equal(resolveDateFromDays("friday", mockDays), "2026-09-18");
    assert.equal(resolveDateFromDays("Sep 13", mockDays), "2026-09-13");
    assert.equal(resolveDateFromDays("2026-09-15", mockDays), "2026-09-15");
    assert.equal(resolveDateFromDays("unknown", mockDays), null);
  });

  test("detectAssistantCalendarDateIntent captures spoken date change phrases", () => {
    assert.equal(
      detectAssistantCalendarDateIntent("Let me switch the calendar to tomorrow for you."),
      "tomorrow"
    );
    assert.equal(
      detectAssistantCalendarDateIntent("Let's look at Friday."),
      "Friday"
    );
  });

  test("detectUserCalendarDateIntent captures user speech requests", () => {
    assert.equal(
      detectUserCalendarDateIntent("The calendar is showing for today. Can you show it for tomorrow?"),
      "tomorrow"
    );
    assert.equal(
      detectUserCalendarDateIntent("Can you show tomorrow?"),
      "tomorrow"
    );
    assert.equal(
      detectUserCalendarDateIntent("Switch to Friday"),
      "Friday"
    );
  });

  test("parseBookTourTag extracts booking parameters", () => {
    const tag = "Reserving that slot! [BOOK_TOUR:date=2026-09-18,time=15:00,name=Alex Kumar,phone=9876543210,email=alex@example.com]";
    const parsed = parseBookTourTag(tag);
    assert.deepEqual(parsed, {
      date: "2026-09-18",
      time: "15:00",
      name: "Alex Kumar",
      phone: "9876543210",
      email: "alex@example.com",
    });
  });

  test("calendar control tags never reach caller transcript", () => {
    assert.equal(
      stripUITags("I've pulled up the schedule [UI:OPEN_CALENDAR]"),
      "I've pulled up the schedule"
    );
    assert.equal(
      stripUITags("Checking Friday [CALENDAR_SELECT_DATE:2026-09-18]"),
      "Checking Friday"
    );
    assert.equal(
      stripUITags("Booking now [BOOK_TOUR:date=2026-09-18,time=15:00,name=Alex,phone=123]"),
      "Booking now"
    );
    assert.equal(
      stripUITags("[TOUR_BOOKED:date=2026-09-18,time=15:00,name=Alex]"),
      ""
    );
    assert.equal(
      stripUITags("[CALENDAR_SCHEDULE:today=2026-09-12,title=Mohan Tower,days=Today:2026-09-12|Tomorrow:2026-09-13]"),
      ""
    );
  });
});

describe("three-way manager call intent and tags", () => {
  test("parseCallManagerTag extracts propertyId and prospectName", () => {
    const tag = "Let me check with the manager [CALL_MANAGER:property_id=105,prospect_name=Rahul Sharma]";
    const parsed = parseCallManagerTag(tag);
    assert.deepEqual(parsed, {
      propertyId: 105,
      prospectName: "Rahul Sharma",
    });
  });

  test("CALL_MANAGER tag is stripped from transcript so the caller never sees it", () => {
    assert.equal(
      stripUITags("Let me check if the property manager is available [CALL_MANAGER:property_id=105,prospect_name=Rahul]"),
      "Let me check if the property manager is available"
    );
    assert.equal(
      stripUITags("[MANAGER_CONNECTED:name=Mr. Sharma]"),
      ""
    );
    assert.equal(
      stripUITags("[MANAGER_UNAVAILABLE:reason=busy]"),
      ""
    );
  });
});

