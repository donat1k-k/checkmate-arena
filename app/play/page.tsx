"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef, useState } from "react";
import type { Color, Square } from "chess.js";
import Board from "@/components/chess/Board";
import MoveList from "@/components/chess/MoveList";
import ArenaAvatar from "@/components/profile/ArenaAvatar";
import { usePreferences } from "@/components/settings/PreferencesProvider";
import { chooseAiMove } from "@/lib/chess/ai";
import { ChessGame, type GameStatus, type PromotionPiece } from "@/lib/chess/engine";
import {
  loadArenaCoinsBalance,
  rewardArenaCoinsForMatch,
} from "@/lib/demo/economy";
import {
  loadProfileCustomization,
  type ProfileCustomization,
} from "@/lib/demo/customization";
import {
  loadProTrialGamesLeft,
  useProTrialForMatch,
} from "@/lib/demo/retention";
import {
  arenaAiOpponentId,
  clearActiveGame,
  createGuestProfile,
  createLocalId,
  getOpponentDisplayName,
  getRatingLevel,
  loadActiveGame,
  loadGuestProfile,
  recordCompletedMatch,
  sanitizeNickname,
  saveActiveGame,
  saveGuestProfile,
  type GuestProfile,
  type AiDifficulty,
  type LocalMatch,
  type PlayerSideChoice,
  type PlayMode,
} from "@/lib/demo/progress";
import type { AppTranslations } from "@/lib/i18n/translations";
import { createClient } from "@/lib/supabase/client";
import {
  recordAccountMatch,
  type CompletedAccountMatch,
} from "@/lib/supabase/matches";
import {
  loadAccountProfile,
  type AccountProfile,
} from "@/lib/supabase/profiles";

const RIVAL_RATING = 1035;
const AI_RATINGS: Record<AiDifficulty, number> = {
  beginner: 760,
  casual: 1040,
  tactical: 1280,
};

function resultText(status: GameStatus, t: AppTranslations): string {
  switch (status.state) {
    case "checkmate":
      return t.match.status.checkmateWinner(t.match.color[status.winner]);
    case "resigned":
      return t.match.status.resignationWinner(t.match.color[status.winner]);
    case "stalemate":
      return t.match.status.stalemate;
    case "draw":
      return status.reason === "insufficient"
        ? t.match.status.insufficient
        : status.reason === "threefold"
          ? t.match.status.threefold
          : t.match.status.fiftyMove;
    default:
      return "";
  }
}

const SELECT_STYLE: React.CSSProperties = {
  backgroundColor: "rgba(245, 158, 11, 0.45)",
};
const CHECK_STYLE: React.CSSProperties = {
  backgroundColor: "rgba(248, 81, 73, 0.55)",
};
const TARGET_STYLE: React.CSSProperties = {
  background:
    "radial-gradient(circle, rgba(245,158,11,0.55) 22%, transparent 24%)",
};

export default function PlayPage() {
  const { locale, t } = usePreferences();
  const gameRef = useRef<ChessGame>(new ChessGame());
  const matchIdRef = useRef(createLocalId("match"));
  const matchCreatedAtRef = useRef(new Date().toISOString());
  const accountSaveStartedRef = useRef(false);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);
  const [mode, setMode] = useState<PlayMode>("local");
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>("beginner");
  const [sideChoice, setSideChoice] = useState<PlayerSideChoice>("white");
  const [playerColor, setPlayerColor] = useState<Color>("w");
  const [aiThinking, setAiThinking] = useState(false);
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(
    null,
  );
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileKind, setProfileKind] = useState<"account" | "guest">("guest");
  const [profile, setProfile] = useState<AccountProfile | GuestProfile | null>(
    null,
  );
  const [profileError, setProfileError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [completedMatch, setCompletedMatch] = useState<
    CompletedAccountMatch | LocalMatch | null
  >(null);
  const [gameRestored, setGameRestored] = useState(false);
  const [arenaCoins, setArenaCoins] = useState(0);
  const [coinReward, setCoinReward] = useState<{
    amount: number;
    balance: number;
  } | null>(null);
  const [trialGamesLeft, setTrialGamesLeft] = useState(3);
  const [customization, setCustomization] = useState<ProfileCustomization>(
    loadProfileCustomization(),
  );

  const game = gameRef.current;
  const status = game.status();
  const gameOver = game.isGameOver();
  const matchStatus =
    status.state === "playing"
      ? status.inCheck
        ? t.match.status.inCheck(t.match.color[status.turn])
        : t.match.status.toMove(t.match.color[status.turn])
      : resultText(status, t);
  const progressColor: Color = mode === "ai" ? playerColor : "w";
  const currentOpponentId =
    mode === "ai" ? arenaAiOpponentId(aiDifficulty) : "local-rival";
  const opponentName = getOpponentDisplayName(currentOpponentId, t.match.opponent);
  const opponentRating =
    mode === "ai" ? AI_RATINGS[aiDifficulty] : RIVAL_RATING;
  const playerCanMove =
    !gameOver &&
    !aiThinking &&
    (mode === "local" || game.turn === playerColor);

  useEffect(() => {
    setArenaCoins(loadArenaCoinsBalance());
    setTrialGamesLeft(loadProTrialGamesLeft());
    setCustomization(loadProfileCustomization());
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const supabase = createClient();

      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const accountProfile = await loadAccountProfile(supabase, user);
          if (!active) return;

          if (accountProfile.profile) {
            setProfileKind("account");
            setProfile(accountProfile.profile);
            setNickname(accountProfile.profile.nickname);
          } else {
            setProfileKind("account");
            setProfileError(true);
          }

          setProfileLoaded(true);
          return;
        }
      }

      const savedProfile = loadGuestProfile();
      if (!active) return;

      setProfileKind("guest");
      setProfile(savedProfile);
      setNickname(savedProfile?.nickname ?? "");
      setProfileLoaded(true);
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  // Restore active game after profile loads (both guest and account).
  useEffect(() => {
    if (!profileLoaded || !profile) return;

    const draft = loadActiveGame();
    if (!draft || draft.profileId !== profile.id) return;

    try {
      const restoredGame = ChessGame.loadFromPgn(draft.pgn);
      if (restoredGame.isGameOver()) {
        clearActiveGame();
        return;
      }
      gameRef.current = restoredGame;
      matchIdRef.current = draft.matchId;
      matchCreatedAtRef.current = draft.createdAt;
      setMode(draft.mode ?? "local");
      setAiDifficulty(draft.aiDifficulty ?? "beginner");
      setSideChoice(draft.sideChoice ?? "white");
      setPlayerColor(draft.playerColor ?? "w");
      setGameRestored(true);
      forceUpdate();
    } catch {
      clearActiveGame();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileLoaded, profile?.id]);

  useEffect(() => {
    if (!profile || !gameOver || completedMatch) return;

    const outcome = game.status();
    if (outcome.state === "playing") return;

    const matchInput = {
      createdAt: matchCreatedAtRef.current,
      finalFen: game.fen,
      outcome,
      sanMoves: game.history().map((move) => move.san),
      playerColor: progressColor,
      opponentNickname: currentOpponentId,
    };

    if (profileKind === "guest") {
      const saved = recordCompletedMatch(profile as GuestProfile, {
        id: matchIdRef.current,
        ...matchInput,
      });

      clearActiveGame();
      setProfile(saved.profile);
      setCompletedMatch(saved.match);
      const reward = rewardArenaCoinsForMatch(saved.match.id);
      const trial = useProTrialForMatch(saved.match.id);
      setArenaCoins(reward.balance);
      setTrialGamesLeft(trial.gamesLeft);
      if (reward.awarded) {
        setCoinReward({ amount: reward.amount, balance: reward.balance });
      }
      return;
    }

    if (accountSaveStartedRef.current) return;
    accountSaveStartedRef.current = true;

    const supabase = createClient();
    if (!supabase) {
      setSaveError(true);
      return;
    }

    let active = true;
    setSavePending(true);

    void recordAccountMatch(supabase, profile as AccountProfile, {
      ...matchInput,
      locale,
    }).then((saved) => {
      if (!active) return;

      if (saved.error || !saved.match) {
        setSaveError(true);
        setSavePending(false);
        return;
      }

      clearActiveGame();
      setProfile(saved.profile);
      setCompletedMatch(saved.match);
      const reward = rewardArenaCoinsForMatch(saved.match.id);
      const trial = useProTrialForMatch(saved.match.id);
      setArenaCoins(reward.balance);
      setTrialGamesLeft(trial.gamesLeft);
      if (reward.awarded) {
        setCoinReward({ amount: reward.amount, balance: reward.balance });
      }
      setSavePending(false);
    }).catch(() => {
      if (!active) return;
      setSaveError(true);
      setSavePending(false);
    });

    return () => {
      active = false;
    };
  }, [
    completedMatch,
    currentOpponentId,
    game,
    gameOver,
    locale,
    profile,
    profileKind,
    progressColor,
  ]);

  useEffect(() => {
    if (
      !profile ||
      mode !== "ai" ||
      gameOver ||
      promotion ||
      game.turn === playerColor ||
      aiTimerRef.current
    ) {
      return;
    }

    setAiThinking(true);
    aiTimerRef.current = setTimeout(() => {
      aiTimerRef.current = null;
      const choice = chooseAiMove(gameRef.current.fen, aiDifficulty);

      if (choice) {
        const result = gameRef.current.move(
          choice.from,
          choice.to,
          choice.promotion,
        );
        if (result.ok) {
          persistActiveGame();
          setSelected(null);
          forceUpdate();
        }
      }

      setAiThinking(false);
    }, 480);

    return () => {
      if (!aiTimerRef.current) return;
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
      setAiThinking(false);
    };
  // `game.turn` changes only when this page forces a board update.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiDifficulty, game.turn, gameOver, mode, playerColor, profile?.id, promotion]);

  function resolvePlayerColor(choice: PlayerSideChoice): Color {
    if (choice === "white") return "w";
    if (choice === "black") return "b";
    return Math.random() >= 0.5 ? "w" : "b";
  }

  function reset(config?: {
    mode?: PlayMode;
    aiDifficulty?: AiDifficulty;
    sideChoice?: PlayerSideChoice;
  }) {
    const nextMode = config?.mode ?? mode;
    const nextDifficulty = config?.aiDifficulty ?? aiDifficulty;
    const nextSideChoice = config?.sideChoice ?? sideChoice;
    const nextColor =
      nextMode === "ai" ? resolvePlayerColor(nextSideChoice) : "w";

    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }

    clearActiveGame();
    gameRef.current = new ChessGame();
    matchIdRef.current = createLocalId("match");
    matchCreatedAtRef.current = new Date().toISOString();
    accountSaveStartedRef.current = false;
    setMode(nextMode);
    setAiDifficulty(nextDifficulty);
    setSideChoice(nextSideChoice);
    setPlayerColor(nextColor);
    setAiThinking(false);
    setSelected(null);
    setPromotion(null);
    setCompletedMatch(null);
    setSaveError(false);
    setSavePending(false);
    setGameRestored(false);
    setCoinReward(null);
    forceUpdate();
  }

  function startGuestProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanNickname = sanitizeNickname(nickname);
    if (!cleanNickname) {
      setNicknameError(t.play.nicknameError);
      return;
    }

    const nextProfile = createGuestProfile(cleanNickname);
    saveGuestProfile(nextProfile);
    setProfile(nextProfile);
    setNickname(cleanNickname);
    setNicknameError("");
  }

  function persistActiveGame() {
    if (!profile) return;
    saveActiveGame({
      pgn: game.pgn,
      matchId: matchIdRef.current,
      createdAt: matchCreatedAtRef.current,
      savedAt: new Date().toISOString(),
      profileId: profile.id,
      mode,
      aiDifficulty,
      playerColor,
      sideChoice,
    });
  }

  /** Apply a move; returns true when the board position changed. */
  function applyMove(from: Square, to: Square): boolean {
    if (!playerCanMove) return false;
    if (game.isPromotion(from, to)) {
      setPromotion({ from, to });
      setSelected(null);
      return false;
    }
    const result = game.move(from, to);
    if (result.ok) {
      persistActiveGame();
      setSelected(null);
      forceUpdate();
      return true;
    }
    return false;
  }

  function handleSquareClick(square: Square) {
    if (!playerCanMove) return;
    if (selected) {
      if (square === selected) {
        setSelected(null);
        return;
      }
      if (game.legalTargets(selected).includes(square)) {
        applyMove(selected, square);
        return;
      }
    }
    // Select the square only if its piece has a legal move.
    setSelected(game.legalTargets(square).length > 0 ? square : null);
  }

  function choosePromotion(piece: PromotionPiece) {
    if (!promotion || !playerCanMove) return;
    const result = game.move(promotion.from, promotion.to, piece);
    setPromotion(null);
    if (result.ok) {
      persistActiveGame();
      forceUpdate();
    }
  }

  function resign() {
    if (gameOver) return;
    if (aiTimerRef.current) {
      clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }
    game.resign(mode === "ai" ? playerColor : game.turn);
    clearActiveGame();
    setAiThinking(false);
    setSelected(null);
    forceUpdate();
  }

  const squareStyles: Record<string, React.CSSProperties> = {};
  const checkedKing = game.checkedKingSquare();
  if (checkedKing) squareStyles[checkedKing] = CHECK_STYLE;
  if (selected) {
    squareStyles[selected] = SELECT_STYLE;
    for (const target of game.legalTargets(selected)) {
      squareStyles[target] = TARGET_STYLE;
    }
  }

  if (!profileLoaded) {
    return <p className="py-10 text-sm text-arena-muted">{t.play.loading}</p>;
  }

  if (profileError) {
    return (
      <section className="rounded-lg border border-arena-border bg-arena-panel p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">{t.auth.account}</p>
        <h1 className="mt-1 text-2xl font-bold">{t.play.accountErrorTitle}</h1>
        <p className="mt-2 max-w-xl text-sm text-arena-muted">
          {t.play.accountErrorBody}
        </p>
        <Link
          href="/profile"
          className="mt-4 inline-flex rounded-md border border-arena-border px-4 py-2 font-medium hover:border-arena-gold"
        >
          {t.common.profile}
        </Link>
      </section>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-arena-border bg-arena-panel text-2xl text-arena-blue">♟</div>
            <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">{t.play.entryEyebrow}</p>
            <h1 className="mt-2 text-2xl font-bold">{t.play.entryTitle}</h1>
            <p className="mt-2 text-sm text-arena-muted">{t.play.entryBody}</p>
          </div>

          <div className="panel">
            <div className="panel-hd">
              <span className="panel-ttl">{t.play.guestProfile}</span>
            </div>
            <div className="p-4">
              <form onSubmit={startGuestProfile} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="text-xs font-medium text-arena-muted uppercase tracking-wide">{t.play.nickname}</span>
                  <input
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    maxLength={24}
                    autoFocus
                    className="rounded-md border border-arena-border bg-arena-elevated px-3 py-2.5 text-sm outline-none focus:border-arena-blue"
                    placeholder="ArenaGuest"
                  />
                </label>
                {nicknameError && <p className="text-xs text-arena-loss">{nicknameError}</p>}
                <button className="w-full rounded-md bg-arena-blue py-2.5 text-sm font-semibold text-white hover:opacity-90">
                  {t.play.enterArena}
                </button>
              </form>
              <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-arena-border">
                <div className="text-center">
                  <div className="font-mono text-base font-bold">1000</div>
                  <div className="text-[10px] text-arena-muted">{t.play.startRating}</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm">{t.match.opponent.localRival}</div>
                  <div className="text-[10px] text-arena-muted">{t.play.opponent}</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm">AI</div>
                  <div className="text-[10px] text-arena-muted">{t.play.review}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 -mt-5 sm:-mt-6 flex flex-col">
      {/* Play layout: mobile stack, desktop workspace */}
      <div
        className="grid flex-1 grid-cols-1 border-t border-arena-border md:min-h-[calc(100vh-52px)] md:grid-cols-[260px_minmax(0,1fr)_280px]"
      >
        {/* ── LEFT SIDEBAR: setup info ── */}
        <div className="order-3 flex min-w-0 flex-col border-t border-arena-border md:order-none md:border-r md:border-t-0">
          <div className="sidebar-sec">
            <div className="sidebar-sec-title">{t.play.modeSelector}</div>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => reset({ mode: "local" })}
                className={
                  mode === "local"
                    ? "rounded border border-arena-amber-border bg-arena-amber-bg px-3 py-2 text-left"
                    : "rounded border border-arena-border bg-arena-panel px-3 py-2 text-left hover:border-arena-blue"
                }
              >
                <span className="block text-xs font-semibold">{t.play.modeLocal}</span>
                <span className="mt-0.5 block text-[10px] text-arena-muted">
                  {t.play.modeLocalBody}
                </span>
              </button>
              <button
                type="button"
                onClick={() => reset({ mode: "ai" })}
                className={
                  mode === "ai"
                    ? "rounded border border-arena-amber-border bg-arena-amber-bg px-3 py-2 text-left"
                    : "rounded border border-arena-border bg-arena-panel px-3 py-2 text-left hover:border-arena-blue"
                }
              >
                <span className="block text-xs font-semibold">{t.play.modeAi}</span>
                <span className="mt-0.5 block text-[10px] text-arena-muted">
                  {t.play.modeAiBody}
                </span>
              </button>
              <Link
                href="/blitz"
                className="rounded border border-arena-border bg-arena-panel px-3 py-2 text-left hover:border-arena-blue block"
              >
                <span className="block text-xs font-semibold">⚡ {t.blitz.title}</span>
                <span className="mt-0.5 block text-[10px] text-arena-muted">
                  {t.blitz.eyebrow}
                </span>
              </Link>
              <Link
                href="/multiplayer"
                className="rounded border border-arena-border bg-arena-panel px-3 py-2 text-left hover:border-arena-blue block"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="block text-xs font-semibold">{t.play.modeFriend}</span>
                    <span className="mt-0.5 block text-[10px] text-arena-muted">
                      {t.play.modeFriendBody}
                    </span>
                  </div>
                  <span className="rounded bg-arena-amber-bg px-1.5 py-0.5 text-[10px] text-arena-blue">
                    {t.play.roomComingSoon}
                  </span>
                </div>
                <span className="mt-2 block w-full rounded border border-arena-blue bg-arena-blue/10 px-2 py-1 text-center text-[10px] font-semibold text-arena-blue">
                  {t.play.createRoom}
                </span>
              </Link>
            </div>
          </div>

          {mode === "ai" && (
            <div className="sidebar-sec">
              <div className="sidebar-sec-title">{t.play.aiSetup}</div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-arena-muted">
                {t.play.difficulty}
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {(["beginner", "casual", "tactical"] as AiDifficulty[]).map(
                  (difficulty) => (
                    <button
                      key={difficulty}
                      type="button"
                      onClick={() => reset({ mode: "ai", aiDifficulty: difficulty })}
                      className={
                        aiDifficulty === difficulty
                          ? "rounded border border-arena-amber-border bg-arena-amber-bg px-2.5 py-1.5 text-left"
                          : "rounded border border-arena-border bg-arena-panel px-2.5 py-1.5 text-left hover:border-arena-blue"
                      }
                    >
                      <span className="block text-xs font-semibold">
                        {t.play.aiDifficulties[difficulty]}
                      </span>
                      <span className="block text-[10px] text-arena-muted">
                        {t.play.aiDifficultyNotes[difficulty]}
                      </span>
                    </button>
                  ),
                )}
                <Link
                  href="/pro"
                  className="rounded border border-arena-border bg-arena-panel px-2.5 py-1.5 text-left hover:border-arena-gold"
                >
                  <span className="block text-xs font-semibold">{t.play.coachPro}</span>
                  <span className="block text-[10px] text-arena-muted">
                    {t.play.coachProLocked}
                  </span>
                </Link>
              </div>
              <p className="mb-1.5 mt-3 text-[10px] font-semibold uppercase tracking-wide text-arena-muted">
                {t.play.side}
              </p>
              <div className="grid grid-cols-3 gap-1">
                {(["white", "black", "random"] as PlayerSideChoice[]).map(
                  (choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => reset({ mode: "ai", sideChoice: choice })}
                      className={
                        sideChoice === choice
                          ? "rounded border border-arena-amber-border bg-arena-amber-bg px-1 py-1 text-[10px] font-semibold"
                          : "rounded border border-arena-border px-1 py-1 text-[10px] text-arena-muted hover:border-arena-blue"
                      }
                    >
                      {t.play.sides[choice]}
                    </button>
                  ),
                )}
              </div>
              <p className="mt-1.5 text-[10px] text-arena-muted">
                {t.play.playerSideResolved(t.match.color[playerColor])}
              </p>
            </div>
          )}

          <div className="sidebar-sec">
            <div className="sidebar-sec-title">{t.play.yourRating}</div>
            <div className="font-mono text-2xl font-bold text-arena-text">{profile.rating}</div>
            <div className="text-xs text-arena-muted mt-1">{getRatingLevel(profile.rating)}</div>
          </div>
          <div className="sidebar-sec">
            <div className="sidebar-sec-title">{t.economy.balance}</div>
            <div className="flex items-baseline gap-2">
              <div className="font-mono text-xl font-bold text-arena-gold">{arenaCoins}</div>
              <div className="text-xs font-semibold text-arena-muted">{t.economy.abbr}</div>
            </div>
            <p className="mt-1 text-[10px] text-arena-muted">{t.economy.internalOnly}</p>
          </div>
          <div className="sidebar-sec">
            <div className="sidebar-sec-title">{t.profile.trialBadge}</div>
            <p className="text-sm font-semibold">
              {trialGamesLeft > 0
                ? t.retention.proTrial(trialGamesLeft)
                : t.retention.trialEnded}
            </p>
            {trialGamesLeft === 0 && (
              <Link href="/pro" className="mt-2 inline-flex text-xs font-semibold text-arena-blue hover:opacity-80">
                {t.retention.upgrade}
              </Link>
            )}
          </div>
          <div className="sidebar-sec">
            <div className="sidebar-sec-title">{t.play.opponent}</div>
            <div className="font-semibold text-sm">{opponentName}</div>
            <div className="font-mono text-xs text-arena-muted mt-0.5">{opponentRating}</div>
          </div>
          <div className="sidebar-sec flex-1">
            <div className="sidebar-sec-title">
              {profileKind === "account" ? t.play.accountRanked : t.play.localRanked}
            </div>
            <p className="text-xs text-arena-muted leading-relaxed">
              {mode === "ai"
                ? t.play.progressVsAi
                : profileKind === "account"
                  ? t.play.accountProgressAsWhite
                  : t.play.progressAsWhite}
            </p>
            <Link
              href="/pro"
              className="mt-3 block rounded border border-arena-border bg-arena-panel px-3 py-2 text-xs hover:border-arena-gold"
            >
              <span className="block font-semibold">{t.play.proTeaserTitle}</span>
              <span className="mt-0.5 block text-[10px] text-arena-muted">
                {t.play.proTeaserBody}
              </span>
            </Link>
          </div>
          {gameRestored && (
            <div className="sidebar-sec bg-arena-amber-bg border-t border-arena-amber-border">
              <p className="text-xs font-medium text-arena-blue">{t.play.gameRestored}</p>
              <p className="text-[10px] text-arena-muted mt-0.5">{t.play.gameRestoredHint}</p>
            </div>
          )}
        </div>

        {/* ── CENTER: board area ── */}
        <div className="order-1 flex min-w-0 flex-col items-center justify-start gap-2 bg-arena-elevated p-3 md:order-none md:justify-center md:p-5">
          {/* Opponent bar */}
          <div className="w-full max-w-[480px] flex items-center gap-3 px-3.5 py-2.5 bg-arena-panel border border-arena-border rounded-lg">
            <div className="h-9 w-9 rounded-full flex items-center justify-center bg-arena-text text-arena-bg text-sm font-bold shrink-0">
              {opponentName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{opponentName}</div>
              <div className="font-mono text-xs text-arena-muted">{opponentRating}</div>
            </div>
          </div>

          {/* Board */}
          <div className="w-full max-w-[480px]">
            <Board
              fen={game.fen}
              orientation={mode === "ai" ? playerColor : "w"}
              squareStyles={squareStyles}
              allowDragging={playerCanMove}
              onSquareClick={handleSquareClick}
              onPieceDrop={applyMove}
            />
          </div>

          {/* Player bar */}
          <div className="w-full max-w-[480px] flex items-center gap-3 px-3.5 py-2.5 bg-arena-panel border border-arena-border rounded-lg">
            <ArenaAvatar avatarId={customization.avatarId} className="h-9 w-9 text-xs" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">
                {profile.nickname}
                <span className="ml-1.5 text-[10px] text-arena-muted font-normal">
                  ({t.common.you})
                </span>
              </div>
              <div className="font-mono text-xs text-arena-muted">{profile.rating}</div>
            </div>
          </div>

          {/* Promotion dialog */}
          {promotion && (
            <div className="w-full max-w-[480px] flex flex-wrap items-center gap-2 rounded-lg border border-arena-border bg-arena-panel px-3 py-2">
              <span className="text-sm text-arena-muted">{t.chess.promoteTo}</span>
              {(["q", "r", "b", "n"] as PromotionPiece[]).map((piece) => (
                <button
                  key={piece}
                  onClick={() => choosePromotion(piece)}
                  className="h-9 w-9 rounded-md bg-arena-elevated font-bold uppercase hover:bg-arena-blue hover:text-white"
                >
                  {piece}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR: status + notation ── */}
        <div className="order-2 flex min-w-0 flex-col border-t border-arena-border md:order-none md:border-l md:border-t-0">
          {/* Status */}
          <div className="sidebar-sec">
            <div className="flex items-center gap-2 mb-2">
              {status.state === "playing" ? (
                <span className="status-dot" />
              ) : null}
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-arena-muted">
                {status.state === "playing" ? t.match.live : t.match.final}
              </span>
            </div>
            <p className={`text-sm font-semibold ${status.state !== "playing" ? "text-arena-gold" : ""}`}>
              {matchStatus}
            </p>
            <p className="text-xs text-arena-muted mt-1">
              {status.state === "playing"
                ? aiThinking
                  ? t.play.aiThinking
                  : t.play.playingHint
                : t.play.finishedHint}
            </p>
          </div>

          {/* Result card */}
          {completedMatch && (
            <div className={`sidebar-sec ${
              completedMatch.result === "win"
                ? "bg-arena-win/5 border-b border-arena-win/20"
                : completedMatch.result === "loss"
                ? "bg-arena-loss/5 border-b border-arena-loss/20"
                : "border-b border-arena-border"
            }`}>
              <div className="sidebar-sec-title">
                {profileKind === "account" ? t.play.savedAccountResult : t.play.savedResult}
              </div>
              <div className="text-xl font-bold">
                {t.match.result[completedMatch.result]}{" "}
                <span className={completedMatch.ratingDelta >= 0 ? "text-arena-win" : "text-arena-loss"}>
                  {completedMatch.ratingDelta > 0 ? "+" : ""}{completedMatch.ratingDelta}
                </span>
              </div>
              <div className="font-mono text-xs text-arena-muted mt-0.5">
                {completedMatch.ratingBefore} → {completedMatch.ratingAfter}
              </div>
              {coinReward && (
                <div className="mt-2 rounded border border-arena-amber-border bg-arena-amber-bg px-2 py-1 text-xs font-semibold text-arena-gold">
                  {t.economy.matchReward(coinReward.amount)} · {coinReward.balance}{" "}
                  {t.economy.abbr}
                </div>
              )}
              <Link
                href={`/review/${completedMatch.id}`}
                className="mt-2.5 block w-full rounded bg-arena-blue px-3 py-2 text-center text-xs font-semibold text-white hover:opacity-90"
              >
                {t.common.openReview}
              </Link>
            </div>
          )}

          {savePending && (
            <div className="sidebar-sec text-xs text-arena-muted">{t.play.savingAccountResult}</div>
          )}
          {saveError && (
            <div className="sidebar-sec text-xs text-arena-loss">{t.errors.saveFailed}</div>
          )}

          {/* Move list */}
          <div className="flex flex-1 flex-col md:overflow-hidden">
            <MoveList moves={game.history()} />
          </div>

          {/* Game controls */}
          <div className="sidebar-sec">
            <div className="flex gap-2">
              <button
                onClick={resign}
                disabled={gameOver}
                className="flex-1 rounded border border-arena-border bg-arena-elevated px-3 py-2 text-xs font-medium hover:border-arena-loss hover:text-arena-loss disabled:opacity-40"
              >
                {t.play.resign}
              </button>
              <button
                onClick={() => reset()}
                disabled={gameOver && !completedMatch && !saveError}
                className="flex-1 rounded bg-arena-blue px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                {t.play.newGame}
              </button>
            </div>
            {completedMatch && (
              <div className="mt-2 flex gap-2">
                <Link href="/profile" className="flex-1 rounded border border-arena-border px-2 py-1.5 text-center text-xs font-medium hover:border-arena-gold">
                  {t.common.profile}
                </Link>
                <Link href="/leaderboard" className="flex-1 rounded border border-arena-border px-2 py-1.5 text-center text-xs font-medium hover:border-arena-gold">
                  {t.common.leaderboard}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
