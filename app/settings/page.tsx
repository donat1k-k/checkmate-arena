"use client";

import { usePreferences } from "@/components/settings/PreferencesProvider";
import {
  LOCALES,
  THEMES,
  type ArenaTheme,
  type Locale,
} from "@/lib/i18n/translations";

function optionClass(active: boolean): string {
  return active
    ? "rounded-md bg-arena-blue px-4 py-2 font-medium text-white"
    : "rounded-md border border-arena-border bg-arena-elevated px-4 py-2 font-medium hover:border-arena-gold";
}

export default function SettingsPage() {
  const { locale, setLocale, setTheme, t, theme } = usePreferences();

  return (
    <div className="flex flex-col gap-5">
      <section className="border-b border-arena-border pb-6">
        <p className="text-sm font-medium text-arena-gold">{t.settings.eyebrow}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">
          {t.settings.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-arena-muted">
          {t.settings.body}
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-arena-border bg-arena-panel p-5">
          <h2 className="text-2xl font-semibold">{t.settings.languageTitle}</h2>
          <p className="mt-2 text-sm text-arena-muted">
            {t.settings.languageBody}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
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
        </div>

        <div className="rounded-lg border border-arena-border bg-arena-panel p-5">
          <h2 className="text-2xl font-semibold">{t.settings.themeTitle}</h2>
          <p className="mt-2 text-sm text-arena-muted">{t.settings.themeBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
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
        </div>
      </section>

      <section className="rounded-lg border border-arena-border bg-arena-panel p-4 text-sm text-arena-muted">
        {t.settings.storageNote}
      </section>
    </div>
  );
}
