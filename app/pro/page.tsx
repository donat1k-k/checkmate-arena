import Link from "next/link";

const PRO_FEATURES = [
  "Advanced coach depth and longer review trails",
  "Detailed statistics for progress and season goals",
  "Premium profile presentation and board themes",
  "Private clubs, tournament access, and report export",
];

const DEMO_BOUNDARIES = [
  "No checkout is wired in this local MVP.",
  "The current review stays heuristic and browser-local.",
  "Account sync and premium entitlements arrive after backend work.",
];

export default function ProPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 border-b border-arena-border pb-8 pt-3 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <p className="text-sm font-medium text-arena-gold">Monetization concept</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Upgrade to Pro
          </h1>
          <p className="mt-4 max-w-2xl text-base text-arena-text">
            Pro is the premium lane for players who want deeper coaching,
            stronger progress tools, and a profile that feels tournament-ready.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-arena-muted">
            This screen is static in Stage 2.5. It demonstrates the product
            direction without starting payments, auth, or backend entitlements.
          </p>
        </div>
        <div className="rounded-lg border border-arena-border bg-arena-panel p-5">
          <p className="text-sm text-arena-muted">Checkmate Arena Pro</p>
          <p className="mt-2 text-3xl font-semibold">Coming soon</p>
          <p className="mt-2 text-sm text-arena-muted">
            Premium analysis and presentation for repeat ranked players.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              disabled
              className="rounded-md bg-arena-gold px-4 py-2 font-medium text-arena-bg disabled:cursor-not-allowed disabled:opacity-70"
            >
              Checkout coming soon
            </button>
            <Link
              href="/play"
              className="rounded-md border border-arena-border px-4 py-2 font-medium hover:border-arena-gold"
            >
              Play demo
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {PRO_FEATURES.map((feature) => (
          <article
            key={feature}
            className="rounded-lg border border-arena-border bg-arena-panel p-5"
          >
            <p className="text-sm font-medium text-arena-gold">Pro feature</p>
            <p className="mt-2 text-lg font-semibold">{feature}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 rounded-lg border border-arena-border bg-arena-panel p-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-medium text-arena-gold">Demo boundary</p>
          <h2 className="mt-2 text-2xl font-semibold">What stays honest now</h2>
        </div>
        <div className="grid gap-2">
          {DEMO_BOUNDARIES.map((boundary) => (
            <p
              key={boundary}
              className="rounded-md bg-arena-elevated px-4 py-3 text-sm text-arena-muted"
            >
              {boundary}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
