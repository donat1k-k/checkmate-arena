"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  isArenaTheme,
  isLocale,
  translations,
  type AppTranslations,
  type ArenaTheme,
  type Locale,
} from "@/lib/i18n/translations";

const PREFERENCES_KEY = "checkmate-arena.preferences.v1";

type Preferences = {
  locale: Locale;
  theme: ArenaTheme;
};

type PreferencesContextValue = Preferences & {
  t: AppTranslations;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ArenaTheme) => void;
};

const DEFAULT_PREFERENCES: Preferences = {
  locale: "en",
  theme: "dark",
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function loadPreferences(): Preferences {
  try {
    const stored = window.localStorage.getItem(PREFERENCES_KEY);
    const parsed = stored ? (JSON.parse(stored) as Partial<Preferences>) : null;

    return {
      locale: isLocale(parsed?.locale) ? parsed.locale : DEFAULT_PREFERENCES.locale,
      theme: isArenaTheme(parsed?.theme) ? parsed.theme : DEFAULT_PREFERENCES.theme,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_PREFERENCES.locale);
  const [theme, setTheme] = useState<ArenaTheme>(DEFAULT_PREFERENCES.theme);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = loadPreferences();
    setLocale(saved.locale);
    setTheme(saved.theme);
    setLoaded(true);
    document.documentElement.classList.remove("prefs-loading");
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.theme = theme;

    if (!loaded) return;

    window.localStorage.setItem(
      PREFERENCES_KEY,
      JSON.stringify({ locale, theme }),
    );
  }, [loaded, locale, theme]);

  const value = useMemo(
    () => ({
      locale,
      theme,
      t: translations[locale],
      setLocale,
      setTheme,
    }),
    [locale, theme],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const value = useContext(PreferencesContext);

  if (!value) {
    throw new Error("usePreferences must be used inside PreferencesProvider.");
  }

  return value;
}
