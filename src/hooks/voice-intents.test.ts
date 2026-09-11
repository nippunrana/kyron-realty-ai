/**
 * Pins Elena's scripted lines to the screen action they fire. Run with `npm run test:intents`
 * before rewording a line in `src/lib/elena-prompt.ts`: each line is also asserted to still
 * exist in the rendered prompt, so a reworded prompt cannot pass against a stale copy here.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { buildOwnerOnboardingPrompt } from "../lib/elena-prompt.ts";
import { detectAssistantModalIntent, detectUserModalIntent, stripUITags } from "./voice-intents.ts";

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
    "That completes your property profile. I've pulled up your final complete property card on your screen [UI:OPEN_FINAL]. Take a look and hit Deploy when you're ready to launch your 24/7 AI sales agent.",
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
  });

  test("leaves untagged text byte-for-byte alone", () => {
    const text = "Rent is 95,000 , right ?";
    assert.equal(stripUITags(text), text);
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
