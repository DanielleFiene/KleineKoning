"use client";

import { useEffect } from "react";

/**
 * On chunk load failure (e.g. ERR_CACHE_READ_FAILURE after a new deploy),
 * reload the page once so the user gets the latest assets.
 */
export function ChunkLoadRecovery() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const msg = event.message ?? "";
      const name = (event.error as Error | undefined)?.name ?? "";
      const isChunkError =
        name === "ChunkLoadError" ||
        msg.includes("ChunkLoadError") ||
        msg.includes("Loading chunk") ||
        msg.includes("Loading CSS chunk");

      if (isChunkError) {
        const key = "chunk-reload";
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          window.location.reload();
        } else {
          sessionStorage.removeItem(key);
        }
      }
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  return null;
}
