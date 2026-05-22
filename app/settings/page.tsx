"use client";

import { usePreferences } from "@/components/settings/PreferencesProvider";
import {
  LOCALES,
  THEMES,
  type ArenaTheme,
  type Locale,
} from "@/lib/i18n/translations";

const NAV_ITEMS = [
  { key: "appearance", icon: "◐" },
  { key: "language", icon: "♺" },
  { key: "storage", icon: "◫" },
] as const;

type SettingsSection = (typeof NAV_ITEMS)[number]["key"];

function navItemClass(active: boolean): string {
  return active
    ? "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-semibold text-arena-blue bg-arena-amber-bg"
    : "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-arena-muted hover:bg-arena-elevated hover:text-arena-text";
}

function optionClass(active: boolean): string {
  return active
    ? "rounded-md border border-arena-blue/30 bg-arena-amber-bg px-4 py-2.5 text-sm font-semibold text-arena-blue"
    : "rounded-md border border-arena-border bg-arena-elevated px-4 py-2.5 text-sm font-medium hover:border-arena-blue hover:text-arena-text";
}

export default function SettingsPage() {
  const { locale, setLocale, setTheme, t, theme } = usePreferences();

  return (
    <div className="-mx-4 -mt-5 flex min-h-[80vh] flex-col border-t border-arena-border md:-mt-6 md:flex-row">
      {/* ── Left nav ── */}
      <div className="flex w-full shrink-0 flex-col border-b border-arena-border bg-arena-panel md:w-[220px] md:border-b-0 md:border-r">
        <div className="p-4 border-b border-arena-border">
          <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">{t.settings.eyebrow}</p>
          <h1 className="mt-1 text-lg font-bold">{t.settings.title}</h1>
        </div>
        <nav className="flex flex-wrap gap-0.5 p-2 md:flex-col">
          {/* Account group */}
          <div className="px-3 pt-3 pb-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-arena-muted">App</p>
          </div>
          <a href="#appearance" className={navItemClass(true)}
            style={{ borderLeft: "2px solid var(--color-arena-blue)" }}>
            <span>◐</span>
            {t.settings.themeTitle}
          </a>
          <a href="#language" className={navItemClass(false)}>
            <span>♺</span>
            {t.settings.languageTitle}
          </a>

          <div className="px-3 pt-3 pb-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-arena-muted">Data</p>
          </div>
          <a href="#storage" className={navItemClass(false)}>
            <span>◫</span>
            Storage
          </a>
        </nav>
      </div>

      {/* ── Content area ── */}
      <div className="flex min-w-0 flex-1 flex-col gap-8 p-4 sm:p-6">
        {/* Appearance */}
        <section id="appearance">
          <h2 className="text-xl font-bold mb-1">{t.settings.themeTitle}</h2>
          <p className="text-sm text-arena-muted mb-4">{t.settings.themeBody}</p>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={theme === option}
                onClick={() => setTheme(option as ArenaTheme)}
                className={optionClass(theme === option)}
              >
                {t.settings.themes[option]}
              </button>
            ))}
          </div>
        </section>

        <div className="border-t border-arena-border" />

        {/* Language */}
        <section id="language">
          <h2 className="text-xl font-bold mb-1">{t.settings.languageTitle}</h2>
          <p className="text-sm text-arena-muted mb-4">{t.settings.languageBody}</p>
          <div className="flex flex-wrap gap-2">
            {LOCALES.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={locale === option}
                onClick={() => setLocale(option as Locale)}
                className={optionClass(locale === option)}
              >
                {t.settings.languages[option]}
              </button>
            ))}
          </div>
        </section>

        <div className="border-t border-arena-border" />

        {/* Storage */}
        <section id="storage">
          <h2 className="text-xl font-bold mb-1">Storage</h2>
          <p className="text-sm text-arena-muted">{t.settings.storageNote}</p>
        </section>
      </div>
    </div>
  );
}
