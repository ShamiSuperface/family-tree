"use client";

const THEMES = ["light", "dark", "colorful"] as const;
type Theme = (typeof THEMES)[number];
const STORAGE_KEY = "family-tree-theme";

function getCurrentTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "dark" || attr === "colorful" ? attr : "light";
}

function applyTheme(theme: Theme) {
  if (theme === "light") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable (private browsing etc.) — theme just won't persist.
  }
}

export default function ThemeToggle() {
  const cycleTheme = () => {
    const current = getCurrentTheme();
    const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    applyTheme(next);
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title="החלפת ערכת נושא (בהיר / כהה / צבעוני)"
      className="rounded-lg border-2 border-amber-500 bg-[var(--surface)] px-2.5 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-50 sm:px-4 sm:py-2"
    >
      🎨 <span className="hidden sm:inline">ערכת נושא</span>
    </button>
  );
}
