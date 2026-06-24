/**
 * UI state for the app shell — sidebar drawer (mobile) and collapse
 * (desktop). The collapse preference persists across sessions, per
 * sidebar UX best practice; the mobile drawer is always closed on load.
 */
import { create } from "zustand";

const COLLAPSE_KEY = "oratoria.sidebar.collapsed";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

interface UiState {
  mobileNavOpen: boolean;
  collapsed: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleCollapsed: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  mobileNavOpen: false,
  collapsed: readCollapsed(),
  openMobileNav: () => set({ mobileNavOpen: true }),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  toggleCollapsed: () => {
    const next = !get().collapsed;
    try {
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
    set({ collapsed: next });
  },
}));
