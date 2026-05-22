"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePreferences } from "@/components/settings/PreferencesProvider";
import { createClient } from "@/lib/supabase/client";

type AuthStatusProps = {
  variant?: "desktop" | "mobileMenu";
};

export default function AuthStatus({ variant = "desktop" }: AuthStatusProps) {
  const router = useRouter();
  const { t } = usePreferences();
  const [user, setUser] = useState<User | null>(null);
  const [pending, setPending] = useState(false);
  const isMobileMenu = variant === "mobileMenu";

  useEffect(() => {
    const supabase = createClient();

    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createClient();
    if (!supabase) return;

    setPending(true);
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
    setPending(false);
  }

  if (!user) {
    return (
      <Link
        href="/auth/sign-in"
        className={
          isMobileMenu
            ? "block rounded-md px-3 py-2 text-sm font-medium hover:bg-arena-elevated"
            : "rounded-md px-3 py-1.5 hover:bg-arena-elevated"
        }
      >
        {t.auth.signIn}
      </Link>
    );
  }

  return (
    <div
      className={
        isMobileMenu
          ? "flex min-w-0 flex-col gap-1"
          : "flex min-w-0 flex-wrap items-center justify-end gap-1"
      }
    >
      <span
        title={user.email ?? t.auth.account}
        className={
          isMobileMenu
            ? "w-full truncate rounded-md border border-arena-border bg-arena-panel px-3 py-2 text-xs text-arena-muted"
            : "max-w-44 truncate rounded-md border border-arena-border bg-arena-panel px-3 py-1.5 text-xs text-arena-muted"
        }
      >
        {t.auth.signedInAs}{" "}
        <span className="text-arena-text">{user.email ?? t.auth.account}</span>
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={signOut}
        className={
          isMobileMenu
            ? "rounded-md px-3 py-2 text-left text-sm hover:bg-arena-elevated disabled:opacity-50"
            : "rounded-md px-3 py-1.5 hover:bg-arena-elevated disabled:opacity-50"
        }
      >
        {t.auth.signOut}
      </button>
    </div>
  );
}
