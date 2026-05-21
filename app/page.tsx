import Link from "next/link";
import ArenaPreviewBoard from "@/components/chess/ArenaPreviewBoard";

const LOOP_STEPS = [
  {
    title: "Play",
    body: "Start ranked demo chess immediately as a local guest.",
  },
  {
    title: "Review",
    body: "Turn the finished match into a short coach report.",
  },
  {
    title: "Progress",
    body: "Carry rating, history, and leaderboard pressure into the next game.",
  },
];

const ARENA_SIGNALS = [
  { label: "Guest start", value: "No auth wall" },
  { label: "Rating loop", value: "+25 on wins" },
  { label: "Coach", value: "Post-game notes" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10 pb-4">
      <section className="relative isolate min-h-[540px] overflow-hidden border-b border-arena-border pb-10 pt-8 sm:min-h-[580px] sm:pt-14">
        <div className="pointer-events-none absolute -right-32 top-32 -z-10 w-[420px] opacity-10 sm:-right-16 sm:top-10 sm:w-[560px] sm:opacity-70 lg:right-0">
          <ArenaPreviewBoard />
        </div>
        <div className="pointer-events-none absolute right-0 top-8 -z-10 hidden w-60 rounded-lg border border-arena-border bg-arena-panel/95 p-4 shadow-2xl shadow-black/30 lg:block">
          <p className="text-xs font-medium text-arena-gold">Coach report ready</p>
          <p className="mt-2 text-lg font-semibold">Convert pressure cleanly</p>
          <p className="mt-2 text-sm text-arena-muted">
            Review the last forcing sequence before the next ranked demo.
          </p>
        </div>
        <div className="pointer-events-none absolute bottom-16 right-5 -z-10 hidden rounded-lg border border-arena-border bg-arena-panel/95 px-4 py-3 shadow-2xl shadow-black/30 md:block">
          <p className="text-xs text-arena-muted">Match result</p>
          <p className="mt-1 font-semibold">
            Win <span className="text-arena-win">+25 rating</span>
          </p>
        </div>

        <div className="flex max-w-2xl flex-col gap-6">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-arena-border bg-arena-panel/90 px-3 py-1 text-arena-gold">
              Competitive chess MVP
            </span>
            <span className="rounded-full border border-arena-border bg-arena-panel/90 px-3 py-1 text-arena-muted">
              Browser-local ranked demo
            </span>
          </div>
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-arena-text sm:text-6xl">
              Checkmate Arena
            </h1>
            <p className="mt-4 max-w-lg text-base text-arena-text sm:text-lg">
              A chess match should leave a trail: rating, profile progress,
              leaderboard pressure, and a compact post-game coach review.
            </p>
            <p className="mt-3 max-w-lg text-sm text-arena-muted">
              Play the current MVP without backend setup. Your guest nickname,
              match history, and local review flow stay in this browser.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/play"
              className="rounded-md bg-arena-blue px-5 py-3 font-medium text-white hover:opacity-90"
            >
              Play Ranked Demo
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-md border border-arena-border bg-arena-panel/90 px-5 py-3 font-medium hover:border-arena-gold"
            >
              See Leaderboard
            </Link>
          </div>
          <dl className="grid max-w-2xl gap-3 sm:grid-cols-3">
            {ARENA_SIGNALS.map((signal) => (
              <div
                key={signal.label}
                className="rounded-md border border-arena-border bg-arena-panel/90 px-4 py-3"
              >
                <dt className="text-xs text-arena-muted">{signal.label}</dt>
                <dd className="mt-1 font-semibold">{signal.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {LOOP_STEPS.map((step, index) => (
          <article
            key={step.title}
            className="rounded-lg border border-arena-border bg-arena-panel p-5"
          >
            <p className="text-sm font-medium text-arena-gold">0{index + 1}</p>
            <h2 className="mt-3 text-xl font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm text-arena-muted">{step.body}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 border-t border-arena-border pt-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div>
          <p className="text-sm font-medium text-arena-gold">Demo-ready loop</p>
          <h2 className="mt-2 text-3xl font-bold">
            The board is only the first screen.
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-arena-muted">
            Stage 2 already keeps the working offline match flow intact. This
            demo layer connects it to progress screens that feel like a real
            competitive service.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Link
            href="/profile"
            className="rounded-lg border border-arena-border bg-arena-panel p-4 hover:border-arena-gold"
          >
            <p className="text-sm text-arena-muted">Profile</p>
            <p className="mt-1 font-semibold">Rating, streak, match history</p>
          </Link>
          <Link
            href="/pro"
            className="rounded-lg border border-arena-border bg-arena-panel p-4 hover:border-arena-gold"
          >
            <p className="text-sm text-arena-muted">Pro concept</p>
            <p className="mt-1 font-semibold">Monetization without checkout</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
