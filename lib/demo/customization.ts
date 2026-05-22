export const PROFILE_CITIES = [
  "novosibirsk",
  "almaty",
  "moscow",
  "astana",
  "other",
] as const;
export const PROFILE_VISIBILITIES = ["public", "friends", "private"] as const;

export type ProfileCity = (typeof PROFILE_CITIES)[number];
export type ProfileVisibility = (typeof PROFILE_VISIBILITIES)[number];

export type AvatarPreset = {
  id: string;
  mark: string;
  nameKey:
    | "rook"
    | "queen"
    | "knight"
    | "bishop"
    | "fork"
    | "tempo"
    | "file"
    | "crown"
    | "storm"
    | "endgame";
  background: string;
  foreground: string;
};

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "rook-amber",
    mark: "R",
    nameKey: "rook",
    background: "linear-gradient(135deg, #78350f, #f59e0b)",
    foreground: "#fff7ed",
  },
  {
    id: "queen-ivory",
    mark: "Q",
    nameKey: "queen",
    background: "linear-gradient(135deg, #57534e, #f5f5f4)",
    foreground: "#1c1917",
  },
  {
    id: "knight-cobalt",
    mark: "N",
    nameKey: "knight",
    background: "linear-gradient(135deg, #1e3a8a, #38bdf8)",
    foreground: "#eff6ff",
  },
  {
    id: "bishop-emerald",
    mark: "B",
    nameKey: "bishop",
    background: "linear-gradient(135deg, #064e3b, #34d399)",
    foreground: "#ecfdf5",
  },
  {
    id: "fork-crimson",
    mark: "F",
    nameKey: "fork",
    background: "linear-gradient(135deg, #881337, #fb7185)",
    foreground: "#fff1f2",
  },
  {
    id: "tempo-violet",
    mark: "T",
    nameKey: "tempo",
    background: "linear-gradient(135deg, #4c1d95, #c084fc)",
    foreground: "#faf5ff",
  },
  {
    id: "file-steel",
    mark: "64",
    nameKey: "file",
    background: "linear-gradient(135deg, #0f172a, #64748b)",
    foreground: "#f8fafc",
  },
  {
    id: "crown-gold",
    mark: "K",
    nameKey: "crown",
    background: "linear-gradient(135deg, #92400e, #fde047)",
    foreground: "#422006",
  },
  {
    id: "storm-teal",
    mark: "S",
    nameKey: "storm",
    background: "linear-gradient(135deg, #134e4a, #2dd4bf)",
    foreground: "#f0fdfa",
  },
  {
    id: "endgame-charcoal",
    mark: "E",
    nameKey: "endgame",
    background: "linear-gradient(135deg, #171717, #a3a3a3)",
    foreground: "#fafafa",
  },
];

const CUSTOMIZATION_KEY = "checkmate-arena.profile-customization.v1";
const DEFAULT_AVATAR_ID = AVATAR_PRESETS[0].id;

export type ProfileCustomization = {
  avatarId: string;
  city: ProfileCity;
  visibility: ProfileVisibility;
  clanTag: string;
};

const DEFAULT_CUSTOMIZATION: ProfileCustomization = {
  avatarId: DEFAULT_AVATAR_ID,
  city: "other",
  visibility: "public",
  clanTag: "",
};

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

function isCity(value: unknown): value is ProfileCity {
  return PROFILE_CITIES.includes(value as ProfileCity);
}

function isVisibility(value: unknown): value is ProfileVisibility {
  return PROFILE_VISIBILITIES.includes(value as ProfileVisibility);
}

function isAvatarId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    AVATAR_PRESETS.some((avatar) => avatar.id === value)
  );
}

function sanitizeClanTag(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 8)
    .toUpperCase();
}

export function loadProfileCustomization(): ProfileCustomization {
  if (!canUseStorage()) return DEFAULT_CUSTOMIZATION;

  try {
    const raw = window.localStorage.getItem(CUSTOMIZATION_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<ProfileCustomization>) : null;

    return {
      avatarId: isAvatarId(parsed?.avatarId)
        ? parsed.avatarId
        : DEFAULT_CUSTOMIZATION.avatarId,
      city: isCity(parsed?.city) ? parsed.city : DEFAULT_CUSTOMIZATION.city,
      visibility: isVisibility(parsed?.visibility)
        ? parsed.visibility
        : DEFAULT_CUSTOMIZATION.visibility,
      clanTag: sanitizeClanTag(parsed?.clanTag),
    };
  } catch {
    return DEFAULT_CUSTOMIZATION;
  }
}

export function saveProfileCustomization(
  customization: ProfileCustomization,
): ProfileCustomization {
  const next = {
    avatarId: isAvatarId(customization.avatarId)
      ? customization.avatarId
      : DEFAULT_CUSTOMIZATION.avatarId,
    city: isCity(customization.city)
      ? customization.city
      : DEFAULT_CUSTOMIZATION.city,
    visibility: isVisibility(customization.visibility)
      ? customization.visibility
      : DEFAULT_CUSTOMIZATION.visibility,
    clanTag: sanitizeClanTag(customization.clanTag),
  };

  if (canUseStorage()) {
    window.localStorage.setItem(CUSTOMIZATION_KEY, JSON.stringify(next));
  }

  return next;
}

export function getAvatarPreset(avatarId: string): AvatarPreset {
  return (
    AVATAR_PRESETS.find((avatar) => avatar.id === avatarId) ??
    AVATAR_PRESETS[0]
  );
}

export function resetProfileCustomization(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(CUSTOMIZATION_KEY);
}
