"use client";

import type { AuthError } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { usePreferences } from "@/components/settings/PreferencesProvider";
import { sanitizeNickname } from "@/lib/demo/progress";
import type { AppTranslations } from "@/lib/i18n/translations";
import {
  createClient,
  hasBrowserSupabaseConfig,
} from "@/lib/supabase/client";
import { ensureProfile } from "@/lib/supabase/profiles";

export type AuthMode = "sign-in" | "sign-up";

type AuthErrorKey = keyof AppTranslations["errors"];

function authErrorKey(error: AuthError, mode: AuthMode): AuthErrorKey {
  if (
    error.code === "refresh_token_not_found" ||
    error.code === "session_not_found"
  ) {
    return "sessionExpired";
  }

  if (
    error.code === "invalid_credentials" ||
    (mode === "sign-in" && error.status === 400)
  ) {
    return "invalidCredentials";
  }

  return error.status && error.status >= 500
    ? "backendUnavailable"
    : "requestFailed";
}

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { t } = usePreferences();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<AuthErrorKey | null>(null);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const isSignIn = mode === "sign-in";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice("");

    const supabase = createClient();
    if (!supabase) return;

    setPending(true);

    if (isSignIn) {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        setError(authErrorKey(signInError, mode));
        setPending(false);
        return;
      }

      const ensuredProfile = await ensureProfile(supabase, data.user);
      if (ensuredProfile.error) {
        setError("saveFailed");
        setPending(false);
        return;
      }

      router.push("/");
      router.refresh();
      return;
    }

    const cleanNickname = sanitizeNickname(nickname);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: cleanNickname ? { nickname: cleanNickname } : undefined,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(authErrorKey(signUpError, mode));
      setPending(false);
      return;
    }

    if (!data.session) {
      setNotice(t.auth.emailConfirmSent);
      setPending(false);
      return;
    }

    const ensuredProfile = await ensureProfile(
      supabase,
      data.user,
      cleanNickname,
    );
    if (ensuredProfile.error) {
      setError("saveFailed");
      setPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (!hasBrowserSupabaseConfig()) {
    return (
      <section className="rounded-lg border border-arena-border bg-arena-panel p-5">
        <p className="text-sm font-medium text-arena-gold">{t.auth.account}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {isSignIn ? t.auth.signInTitle : t.auth.signUpTitle}
        </h1>
        <p className="mt-3 text-sm text-arena-loss">
          {t.auth.supabaseNotConfigured}
        </p>
        <p className="mt-3 text-sm text-arena-muted">{t.auth.guestNotice}</p>
        <Link
          href="/play"
          className="mt-5 inline-flex rounded-md bg-arena-blue px-4 py-2 font-medium text-white hover:opacity-90"
        >
          {t.auth.playAsGuest}
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-arena-border bg-arena-panel p-5">
      <p className="text-sm font-medium text-arena-gold">{t.auth.account}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">
        {isSignIn ? t.auth.signInTitle : t.auth.signUpTitle}
      </h1>
      <p className="mt-3 text-sm text-arena-muted">{t.auth.guestNotice}</p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
        {!isSignIn && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-arena-muted">{t.auth.nicknameLabel}</span>
            <input
              autoComplete="nickname"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              maxLength={24}
              className="rounded-md border border-arena-border bg-arena-elevated px-3 py-2 outline-none focus:border-arena-blue"
            />
            <span className="text-xs text-arena-muted">
              {t.auth.nicknameHint}
            </span>
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-arena-muted">{t.auth.emailLabel}</span>
          <input
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            className="rounded-md border border-arena-border bg-arena-elevated px-3 py-2 outline-none focus:border-arena-blue"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-arena-muted">{t.auth.passwordLabel}</span>
          <input
            autoComplete={isSignIn ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            className="rounded-md border border-arena-border bg-arena-elevated px-3 py-2 outline-none focus:border-arena-blue"
          />
        </label>

        {error && <p className="text-sm text-arena-loss">{t.errors[error]}</p>}
        {notice && <p className="text-sm text-arena-win">{notice}</p>}

        <button
          disabled={pending}
          className="rounded-md bg-arena-blue px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending
            ? t.auth.working
            : isSignIn
              ? t.auth.signInCta
              : t.auth.signUpCta}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-arena-muted">
        <span>{isSignIn ? t.auth.noAccount : t.auth.haveAccount}</span>
        <Link
          href={isSignIn ? "/auth/sign-up" : "/auth/sign-in"}
          className="font-medium text-arena-text hover:text-arena-gold"
        >
          {isSignIn ? t.auth.signUp : t.auth.signIn}
        </Link>
      </div>
    </section>
  );
}
