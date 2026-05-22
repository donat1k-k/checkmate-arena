"use client";

import { useEffect, useState } from "react";
import ArenaAvatar from "@/components/profile/ArenaAvatar";
import { usePreferences } from "@/components/settings/PreferencesProvider";
import {
  AVATAR_PRESETS,
  PROFILE_CITIES,
  PROFILE_VISIBILITIES,
  loadProfileCustomization,
  resetProfileCustomization,
  saveProfileCustomization,
  type ProfileCustomization,
} from "@/lib/demo/customization";
import { resetArenaEconomy } from "@/lib/demo/economy";
import { resetRetentionState } from "@/lib/demo/retention";
import { resetBlitzStats } from "@/lib/demo/blitz";
import {
  LOCALES,
  THEMES,
  type ArenaTheme,
  type Locale,
} from "@/lib/i18n/translations";

function navItemClass(active: boolean): string {
  return active
    ? "flex items-center gap-2.5 rounded-md bg-arena-amber-bg px-3 py-2 text-sm font-semibold text-arena-blue"
    : "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-arena-muted hover:bg-arena-elevated hover:text-arena-text";
}

function optionClass(active: boolean): string {
  return active
    ? "rounded-md border border-arena-blue/30 bg-arena-amber-bg px-4 py-2.5 text-sm font-semibold text-arena-blue"
    : "rounded-md border border-arena-border bg-arena-elevated px-4 py-2.5 text-sm font-medium hover:border-arena-blue hover:text-arena-text";
}

export default function SettingsPage() {
  const { locale, setLocale, setTheme, t, theme } = usePreferences();
  const [customization, setCustomization] = useState<ProfileCustomization>(
    loadProfileCustomization(),
  );
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    setCustomization(loadProfileCustomization());
  }, []);

  function patchCustomization(patch: Partial<ProfileCustomization>) {
    setResetDone(false);
    setCustomization((current) =>
      saveProfileCustomization({ ...current, ...patch }),
    );
  }

  function resetLocalProductData() {
    if (!window.confirm(t.settings.resetConfirm)) return;
    resetArenaEconomy();
    resetRetentionState();
    resetBlitzStats();
    resetProfileCustomization();
    setCustomization(loadProfileCustomization());
    setResetDone(true);
  }

  return (
    <div className="-mx-4 -mt-5 flex min-h-[80vh] flex-col border-t border-arena-border md:-mt-6 md:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-arena-border bg-arena-panel md:w-[220px] md:border-b-0 md:border-r">
        <div className="border-b border-arena-border p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">
            {t.settings.eyebrow}
          </p>
          <h1 className="mt-1 text-lg font-bold">{t.settings.title}</h1>
          <p className="mt-2 text-xs text-arena-muted">{t.settings.body}</p>
        </div>
        <nav className="flex flex-wrap gap-0.5 p-2 md:flex-col">
          <p className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-wider text-arena-muted">
            App
          </p>
          <a
            href="#appearance"
            className={navItemClass(true)}
            style={{ borderLeft: "2px solid var(--color-arena-blue)" }}
          >
            <span>TH</span>
            {t.settings.themeTitle}
          </a>
          <a href="#language" className={navItemClass(false)}>
            <span>RU</span>
            {t.settings.languageTitle}
          </a>
          <p className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-wider text-arena-muted">
            {t.settings.identityTitle}
          </p>
          <a href="#avatar" className={navItemClass(false)}>
            <span>ID</span>
            {t.settings.avatarTitle}
          </a>
          <a href="#city" className={navItemClass(false)}>
            <span>CT</span>
            {t.settings.cityTitle}
          </a>
          <p className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-wider text-arena-muted">
            {t.settings.dataTitle}
          </p>
          <a href="#storage" className={navItemClass(false)}>
            <span>DB</span>
            {t.settings.resetTitle}
          </a>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-7 p-4 sm:p-6">
        <section id="appearance">
          <h2 className="mb-1 text-xl font-bold">{t.settings.themeTitle}</h2>
          <p className="mb-4 text-sm text-arena-muted">{t.settings.themeBody}</p>
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

        <section id="language" className="border-t border-arena-border pt-7">
          <h2 className="mb-1 text-xl font-bold">{t.settings.languageTitle}</h2>
          <p className="mb-4 text-sm text-arena-muted">
            {t.settings.languageBody}
          </p>
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

        <section id="avatar" className="border-t border-arena-border pt-7">
          <h2 className="mb-1 text-xl font-bold">{t.settings.avatarTitle}</h2>
          <p className="mb-4 text-sm text-arena-muted">{t.settings.avatarBody}</p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {AVATAR_PRESETS.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                aria-pressed={customization.avatarId === avatar.id}
                onClick={() => patchCustomization({ avatarId: avatar.id })}
                className={
                  customization.avatarId === avatar.id
                    ? "flex min-w-0 items-center gap-3 rounded-md border border-arena-amber-border bg-arena-amber-bg p-3 text-left"
                    : "flex min-w-0 items-center gap-3 rounded-md border border-arena-border bg-arena-panel p-3 text-left hover:border-arena-blue"
                }
              >
                <ArenaAvatar avatarId={avatar.id} className="h-11 w-11 text-sm" />
                <span className="min-w-0 text-sm font-semibold">
                  {t.avatars[avatar.nameKey]}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section id="city" className="grid gap-6 border-t border-arena-border pt-7 lg:grid-cols-2">
          <div>
            <h2 className="mb-1 text-xl font-bold">{t.settings.cityTitle}</h2>
            <p className="mb-4 text-sm text-arena-muted">{t.settings.cityBody}</p>
            <div className="flex flex-wrap gap-2">
              {PROFILE_CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  aria-pressed={customization.city === city}
                  onClick={() => patchCustomization({ city })}
                  className={optionClass(customization.city === city)}
                >
                  {t.settings.cities[city]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-1 text-xl font-bold">
              {t.settings.visibilityTitle}
            </h2>
            <p className="mb-4 text-sm text-arena-muted">
              {t.settings.visibilityBody}
            </p>
            <div className="flex flex-wrap gap-2">
              {PROFILE_VISIBILITIES.map((visibility) => (
                <button
                  key={visibility}
                  type="button"
                  aria-pressed={customization.visibility === visibility}
                  onClick={() => patchCustomization({ visibility })}
                  className={optionClass(customization.visibility === visibility)}
                >
                  {t.settings.visibilities[visibility]}
                  {visibility === "friends" && (
                    <span className="ml-2 text-[10px] text-arena-muted">
                      {t.settings.visibilities.friendsSoon}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="storage" className="border-t border-arena-border pt-7">
          <h2 className="mb-1 text-xl font-bold">{t.settings.resetTitle}</h2>
          <p className="max-w-2xl text-sm text-arena-muted">{t.settings.resetBody}</p>
          <p className="mt-2 text-xs text-arena-muted">{t.settings.storageNote}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={resetLocalProductData}
              className="rounded-md border border-arena-loss/40 bg-arena-loss/10 px-4 py-2 text-sm font-semibold text-arena-loss hover:border-arena-loss"
            >
              {t.settings.resetButton}
            </button>
            {resetDone && (
              <span className="text-sm font-semibold text-arena-win">
                {t.settings.resetDone}
              </span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
