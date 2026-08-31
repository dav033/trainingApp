export type OpenTab = { id: string; name: string; externalKey: string };

const STORAGE_KEY = "training-workspace:tabs";
export const PROJECTS_CHANGED_EVENT = "training-workspace:projects-changed";

export function loadOpenTabs(): OpenTab[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}

export function saveOpenTabs(tabs: OpenTab[]) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs)); } catch { /* localStorage unavailable */ }
}
