"use client";

import { useCallback, useState } from "react";

/**
 * Copies text to the clipboard and reports `copied` for `resetAfterMs`.
 * A failed copy is logged, never thrown, so a button can call it directly.
 */
export function useCopyToClipboard(resetAfterMs = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), resetAfterMs);
      } catch (err) {
        console.warn("Could not copy:", err);
      }
    },
    [resetAfterMs]
  );

  return { copied, copy };
}
