import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const listeners = new Set<() => void>();

function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // localStorage indisponibil (ex. private mode)
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

let theme: Theme = getInitialTheme();

function applyTheme() {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

applyTheme();

// Stare comună: toate componentele care folosesc useTheme rămân sincronizate
export function setTheme(next: Theme) {
  if (next === theme) return;
  theme = next;
  applyTheme();
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignorăm
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTheme() {
  const current = useSyncExternalStore(subscribe, () => theme);
  const dark = current === "dark";

  return {
    theme: current,
    dark,
    setTheme,
    toggleTheme: () => setTheme(dark ? "light" : "dark"),
  };
}
