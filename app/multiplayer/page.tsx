"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePreferences } from "@/components/settings/PreferencesProvider";
import { createClient } from "@/lib/supabase/client";
import { createRoom, getRoom } from "@/lib/supabase/multiplayer";
import { loadAccountProfile } from "@/lib/supabase/profiles";
import { loadGuestProfile, createGuestProfile } from "@/lib/demo/progress";
import { translations } from "@/lib/i18n/translations";

export default function MultiplayerPage() {
  const { locale } = usePreferences();
  const t = translations[locale];
  const tm = t.multiplayer;
  const router = useRouter();

  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbMissing, setDbMissing] = useState(false);
  const [supabaseReady, setSupabaseReady] = useState(true);

  const guestIdRef = useRef<string>("");

  useEffect(() => {
    const profile = loadGuestProfile() ?? createGuestProfile("Guest");
    setPlayerName(profile.nickname);
    guestIdRef.current = profile.id;

    const supabase = createClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        loadAccountProfile(supabase, user).then((result) => {
          if (result.profile?.nickname) {
            setPlayerName(result.profile.nickname);
          }
        });
      });
    } else {
      setSupabaseReady(false);
    }
  }, []);

  async function handleCreate() {
    if (!supabaseReady) return;
    setError(null);
    setCreating(true);

    const name = playerName.trim() || "Guest";
    const result = await createRoom({ playerName: name, guestId: guestIdRef.current });

    setCreating(false);
    if (!result.ok) {
      if (result.error === "db_not_configured" || result.error === "table_not_found") {
        setDbMissing(true);
      } else {
        setError(t.errors.requestFailed);
      }
      return;
    }

    router.push(`/room/${result.data.room_code}`);
  }

  async function handleJoin() {
    if (!supabaseReady) return;
    const code = joinCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      setError(tm.invalidCode);
      return;
    }
    setError(null);
    setJoining(true);

    const result = await getRoom(code);
    setJoining(false);

    if (!result.ok) {
      if (result.error === "db_not_configured" || result.error === "table_not_found") {
        setDbMissing(true);
      } else if (result.error === "not_found") {
        setError(tm.roomNotFound);
      } else {
        setError(t.errors.requestFailed);
      }
      return;
    }

    router.push(`/room/${code}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">
          {tm.eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{tm.title}</h1>
        <p className="mt-1 text-sm text-arena-muted">{tm.body}</p>
      </div>

      {/* DB not configured banner */}
      {(!supabaseReady || dbMissing) && (
        <div className="mb-6 rounded border border-yellow-500/40 bg-yellow-500/10 p-4">
          <p className="text-sm font-semibold text-yellow-400">{tm.dbNotConfigured}</p>
          <p className="mt-1 text-xs text-arena-muted">{tm.dbNotConfiguredBody}</p>
          <pre className="mt-2 rounded bg-arena-elevated p-2 font-mono text-[10px] text-arena-muted">
            supabase/migrations/0004_multiplayer_rooms.sql
          </pre>
        </div>
      )}

      {/* Create room */}
      <div className="mb-4 rounded border border-arena-border bg-arena-panel p-5">
        <h2 className="text-sm font-semibold">{tm.createRoomTitle}</h2>
        <p className="mt-0.5 text-xs text-arena-muted">{tm.createRoomBody}</p>

        <div className="mt-3">
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-arena-muted">
            {t.play.nickname}
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={24}
            placeholder={tm.playerNamePlaceholder}
            className="w-full rounded border border-arena-border bg-arena-elevated px-3 py-2 text-sm outline-none focus:border-arena-blue"
          />
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-400">{error}</p>
        )}

        <button
          type="button"
          onClick={handleCreate}
          disabled={creating || !supabaseReady}
          className="mt-3 w-full rounded border border-arena-blue bg-arena-blue/10 px-4 py-2 text-sm font-semibold text-arena-blue hover:bg-arena-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? tm.creating : tm.createRoomBtn}
        </button>
      </div>

      {/* Join by code */}
      <div className="mb-6 rounded border border-arena-border bg-arena-panel p-5">
        <h2 className="text-sm font-semibold">{tm.joinRoomTitle}</h2>

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder={tm.joinRoomPlaceholder}
            className="flex-1 rounded border border-arena-border bg-arena-elevated px-3 py-2 font-mono text-sm uppercase tracking-widest outline-none focus:border-arena-blue"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleJoin();
            }}
          />
          <button
            type="button"
            onClick={handleJoin}
            disabled={joining || !supabaseReady}
            className="rounded border border-arena-border bg-arena-panel px-4 py-2 text-sm font-semibold hover:border-arena-blue disabled:cursor-not-allowed disabled:opacity-50"
          >
            {joining ? tm.joining : tm.joinRoomBtn}
          </button>
        </div>
      </div>

      {/* Proto note + back */}
      <p className="mb-4 text-xs text-arena-muted">{tm.protoNote}</p>

      <Link
        href="/play"
        className="text-xs text-arena-muted underline underline-offset-2 hover:text-arena-text"
      >
        ← {tm.backToPlay}
      </Link>
    </div>
  );
}
