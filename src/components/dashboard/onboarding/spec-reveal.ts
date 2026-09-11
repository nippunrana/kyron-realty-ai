"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { RefObject } from "react";

gsap.registerPlugin(useGSAP);

/**
 * The reveal beat for the Live Property Inspector: when Elena extracts a spec mid-call,
 * the affected row lights up so the owner sees the AI landed something. Kept imperative
 * (no React state, no class toggling) so a second batch arriving mid-flash restarts the
 * highlight cleanly instead of being swallowed by an already-running CSS keyframe.
 */

/** Both shadows must have the same layer count so GSAP can interpolate between them. */
const GLOW_ON = "0 0 0 3px rgba(37, 99, 235, 0.38), 0 8px 22px -8px rgba(37, 99, 235, 0.55)";
const GLOW_OFF = "0 0 0 0px rgba(37, 99, 235, 0), 0 0px 0px 0px rgba(37, 99, 235, 0)";

const STAGGER = 0.07;

export interface SnapshotDiff {
  /** Keys present now that were absent last render. */
  added: string[];
  /** Keys whose rendered value changed. */
  changed: string[];
}

/**
 * Diffs a keyed snapshot of rendered values against the previous render and updates the ref.
 * Returns null on the first run so mounting - or remounting mid-session - never replays
 * every value that was already on screen.
 */
export function diffSnapshot(
  ref: RefObject<Record<string, string> | null>,
  next: Record<string, string>
): SnapshotDiff | null {
  const prev = ref.current;
  ref.current = next;
  if (!prev) return null;

  const added: string[] = [];
  const changed: string[] = [];
  for (const key of Object.keys(next)) {
    if (!(key in prev)) added.push(key);
    else if (prev[key] !== next[key]) changed.push(key);
  }
  return { added, changed };
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Resolves data-attribute targets inside a scope, skipping keys with no rendered node. */
export function queryByKey(
  scope: HTMLElement | null,
  attribute: string,
  keys: string[]
): HTMLElement[] {
  if (!scope) return [];
  return keys
    .map((key) => scope.querySelector<HTMLElement>(`[${attribute}="${CSS.escape(key)}"]`))
    .filter((el): el is HTMLElement => el !== null);
}

/**
 * A blue ring that swells and fades. Layers over any background, so gradient rows work too.
 * The inline box-shadow is cleared from `onComplete` rather than via the tween's own
 * `clearProps`: a yoyo tween re-renders its from-value after clearProps has run, which
 * left a transparent inline shadow permanently overriding the row's Tailwind one.
 */
export function flashRows(targets: HTMLElement[]) {
  if (!targets.length) return;
  gsap
    .timeline({ onComplete: () => gsap.set(targets, { clearProps: "boxShadow" }) })
    .fromTo(
      targets,
      { boxShadow: GLOW_OFF },
      {
        boxShadow: GLOW_ON,
        duration: 0.3,
        ease: "power2.out",
        stagger: STAGGER,
        overwrite: "auto",
      }
    )
    .to(
      targets,
      { boxShadow: GLOW_OFF, duration: 0.45, ease: "power2.in", stagger: STAGGER },
      ">0.25"
    );
}

/** Entrance for a spec card that did not exist a moment ago. */
export function revealCards(targets: HTMLElement[]) {
  if (!targets.length) return;
  gsap.from(targets, {
    autoAlpha: 0,
    y: 10,
    scale: 0.96,
    duration: 0.42,
    ease: "back.out(1.6)",
    stagger: STAGGER,
    overwrite: "auto",
    clearProps: "all",
  });
}

/** The checkmark landing on a newly verified row. */
export function popIcons(targets: HTMLElement[]) {
  if (!targets.length) return;
  gsap.from(targets, {
    scale: 0.3,
    autoAlpha: 0,
    duration: 0.45,
    ease: "back.out(2.4)",
    stagger: STAGGER,
    overwrite: "auto",
    clearProps: "all",
  });
}

/** A freshly written value starts blue and settles into its own colour. */
export function tintValues(targets: HTMLElement[]) {
  if (!targets.length) return;
  gsap.from(targets, {
    color: "#2563eb",
    duration: 0.85,
    ease: "power2.in",
    stagger: STAGGER,
    overwrite: "auto",
    clearProps: "color",
  });
}

/**
 * Safely scrolls an internal container to bring a target element into view without
 * causing viewport-level window scroll shifts.
 */
export function scrollContainerToElement(
  container: HTMLElement | null,
  target: HTMLElement | null,
  behavior: ScrollBehavior = "smooth"
) {
  if (!container || !target) return;
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  const isAbove = targetRect.top < containerRect.top;
  const isBelow = targetRect.bottom > containerRect.bottom;

  if (isAbove || isBelow) {
    const delta = targetRect.top - containerRect.top;
    const newScrollTop = Math.max(0, container.scrollTop + delta - 24);
    container.scrollTo({ top: newScrollTop, behavior });
  }
}

export { useGSAP };
