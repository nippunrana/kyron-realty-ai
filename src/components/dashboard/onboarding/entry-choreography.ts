"use client";

import gsap from "gsap";
import { prefersReducedMotion } from "./spec-reveal";

/**
 * The studio's entry choreography, on its own axis from the `onboardingStage` machine
 * (core / additional_specs / photos / final_review), which tracks how far the interview
 * has got rather than how the screen is laid out.
 *
 *   intro   - a small centred card over the dimmed studio: Elena, the owner, and Start.
 *   focused - mic granted; the card has grown into a full-width chat for Elena's opener.
 *   split   - the first extraction landed; the card flies left and the inspector arrives.
 *
 * The conversational panel holds the live Agora RTC client, so it must stay mounted
 * through all three stages - only the wrapper classes below change.
 *
 * This is a hand-rolled FLIP. GSAP's Flip plugin was measured against it and performs
 * identically, so this is not a workaround for a plugin defect - it simply measures both
 * rects itself and pins the card to explicit geometry for the flight, which keeps the
 * whole transition inspectable without depending on how a plugin resolves the `m-auto`
 * centring. Either approach is defensible; this one is what is verified.
 */
export type EntryStage = "intro" | "focused" | "split";

/** Marks the elements the choreography measures. */
export const FLIP_ATTR = "data-entry-flip";

export const PANEL_STAGE_CLASSES: Record<EntryStage, string> = {
  /**
   * Centring is the same full-screen flex container every other modal in this studio uses
   * (`ReviewSpecsModal`, `ImageUploadModal`), and the card inside is an ordinary flow
   * child. Two earlier schemes failed:
   *
   * `inset-0` + `m-auto` + a content-driven height is over-constrained, and it made the
   * card's height depend on its content while the panel root's `h-full` made the content
   * depend on the card's height. Chrome and Edge break that circle by treating the
   * percentage as `auto`; Safari resolves it to 0 and the card collapsed to a 2px line -
   * its borders - with the persona block squeezed to its 41px of padding. Real Safari
   * only: Playwright's WebKit resolves it the way Chrome does and never reproduced it.
   *
   * Centring with `-translate-x-1/2` instead put a transform on the class, which compounds
   * with the inline transform the flight writes rather than being overridden by it -
   * measured, the card set off from the wrong position and swung 128px off the left edge.
   * Nothing in these class strings may carry a transform.
   */
  intro: "fixed inset-0 z-50 flex items-center justify-center p-4",
  focused: "fixed inset-0 z-50 flex items-center justify-center p-4",
  split: "lg:col-span-5 flex flex-col h-full min-h-0 overflow-hidden",
};

/** Sizing for the panel root - the card itself, and the element the flight animates. */
export const PANEL_CARD_CLASSES: Record<EntryStage, string> = {
  intro: "w-full max-w-sm h-auto max-h-full",
  focused: "w-full max-w-3xl h-[min(84vh,42rem)] max-h-full",
  split: "w-full h-full",
};

export const INSPECTOR_STAGE_CLASSES =
  "lg:col-span-7 flex flex-col h-full min-h-0 overflow-hidden";

export interface EntryLayoutSnapshot {
  panel: DOMRect;
}

/**
 * The tracked wrapper is a full-screen centring container at `intro` and `focused`, so the
 * thing that actually moves is the card inside it.
 */
const cardEl = () =>
  document.querySelector<HTMLElement>(`[${FLIP_ATTR}="panel"]`)
    ?.firstElementChild as HTMLElement | null ?? null;

/**
 * Records the card's geometry. Must run *before* React commits the stage change, so
 * callers capture here and replay from a layout effect.
 */
export function captureEntryLayout(): EntryLayoutSnapshot | null {
  const card = cardEl();
  if (!card) return null;
  return { panel: card.getBoundingClientRect() };
}

/**
 * The panel swaps its whole interior in the same commit that resizes it - the idle
 * persona card gives way to the live dialogue the instant `startCall` flips
 * `isCallActive`. Morphing the card while its contents hard-cut looks broken, so the new
 * interior fades up into the resizing shell. Only the sections fade; the card itself
 * keeps its background and border throughout.
 */
function fadePanelInterior() {
  const inner = cardEl();
  if (!inner) return;
  gsap.fromTo(
    Array.from(inner.children),
    { autoAlpha: 0 },
    { autoAlpha: 1, duration: 0.4, delay: 0.12, ease: "power2.out", clearProps: "all" }
  );
}

/**
 * Flies the card from its recorded geometry into the one React just committed.
 *
 * The card is pinned to fixed, explicit geometry for the tween: `m-auto` centring makes
 * the resting position depend on the width being animated, so leaving it in charge would
 * have the card chase its own target. Position rides on x/y transforms; only width and
 * height touch layout. Taking it out of flow costs nothing - the grid's twelve tracks are
 * content-independent, so the inspector does not shift while the card is in the air.
 */
export function playEntryLayout(
  snapshot: EntryLayoutSnapshot | null,
  stage: EntryStage
) {
  const panel = cardEl();
  if (!panel || !snapshot) return;

  const from = snapshot.panel;
  const to = panel.getBoundingClientRect();
  if (!from.width || !to.width) return;

  if (prefersReducedMotion()) {
    revealInspector(true);
    return;
  }

  // Only the grow into `focused` swaps the interior (idle card -> live dialogue). Fading
  // it again on the way to `split` would blink a transcript the owner is already reading.
  if (stage === "focused") fadePanelInterior();

  // The scheme resets go in first and on their own: passing `inset` in the same gsap.set
  // as `left`/`top` clobbers them - `inset` is a shorthand and GSAP does not guarantee it
  // is written before the longhands. Measured, the card started every flight at x=32
  // instead of its recorded position and sailed off the left edge.
  panel.style.position = "fixed";
  panel.style.margin = "0";
  panel.style.right = "auto";
  panel.style.bottom = "auto";
  panel.style.zIndex = "50";

  gsap.set(panel, {
    left: from.left,
    top: from.top,
    width: from.width,
    height: from.height,
    x: 0,
    y: 0,
  });

  gsap.to(panel, {
    x: to.left - from.left,
    y: to.top - from.top,
    width: to.width,
    height: to.height,
    duration: stage === "split" ? 0.75 : 0.6,
    ease: "power3.inOut",
    overwrite: "auto",
    clearProps:
      "position,margin,right,bottom,left,top,width,height,zIndex,transform",
  });

  revealInspector(false);
}

/** The inspector is new to the DOM at `split`; it eases in behind the travelling card. */
function revealInspector(immediate: boolean) {
  const inspector = document.querySelector<HTMLElement>(
    `[${FLIP_ATTR}="inspector"]`
  );
  if (!inspector) return;

  if (immediate) {
    gsap.set(inspector, { clearProps: "all" });
    return;
  }

  gsap.fromTo(
    inspector,
    { autoAlpha: 0, xPercent: 4, scale: 0.97 },
    {
      autoAlpha: 1,
      xPercent: 0,
      scale: 1,
      duration: 0.55,
      delay: 0.25,
      ease: "power3.out",
      overwrite: "auto",
      clearProps: "all",
    }
  );
}

/** The dimmed studio behind the intro card, lifted once the split layout takes over. */
export function fadeBackdrop(backdrop: HTMLElement | null, visible: boolean) {
  if (!backdrop) return;
  gsap.to(backdrop, {
    autoAlpha: visible ? 1 : 0,
    duration: prefersReducedMotion() ? 0 : visible ? 0.35 : 0.5,
    ease: "power2.inOut",
  });
}
