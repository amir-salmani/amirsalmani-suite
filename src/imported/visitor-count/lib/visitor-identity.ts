const STORAGE_KEY = "obsidianui_visitor_id";
let sessionVisitorId: string | undefined;

export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  if (sessionVisitorId) return sessionVisitorId;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && /^[a-zA-Z0-9_-]{1,128}$/.test(stored)) {
      sessionVisitorId = stored;
      return stored;
    }
  } catch {
    // Storage may be unavailable in private or embedded browsing contexts.
  }
  sessionVisitorId = window.crypto.randomUUID();
  try {
    window.localStorage.setItem(STORAGE_KEY, sessionVisitorId);
  } catch {
    // The memory ID remains stable for this page session.
  }
  return sessionVisitorId;
}
