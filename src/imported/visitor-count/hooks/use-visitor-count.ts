"use client";

import { useEffect, useState } from "react";
import { getOrCreateVisitorId } from "@/lib/visitor-identity";

export function useVisitorCount() {
  const [state, setState] = useState({ count: 0, loading: true, error: null as string | null });

  useEffect(() => {
    const controller = new AbortController();
    async function trackVisit() {
      try {
        const response = await fetch("/api/visitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fingerprint: getOrCreateVisitorId() }),
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || !data.success || !Number.isSafeInteger(data.uniqueVisitors) || data.uniqueVisitors < 0) {
          throw new Error("Visitor count is temporarily unavailable");
        }
        if (!controller.signal.aborted) {
          setState({ count: data.uniqueVisitors, loading: false, error: null });
        }
      } catch {
        if (!controller.signal.aborted) {
          setState({ count: 0, loading: false, error: "Visitor count is temporarily unavailable" });
        }
      }
    }
    void trackVisit();
    return () => controller.abort();
  }, []);

  return state;
}
