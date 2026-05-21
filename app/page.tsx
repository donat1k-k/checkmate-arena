import Link from "next/link";

export default function HomePage() {
  return (
    <section className="flex flex-col items-center gap-6 py-12 text-center">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Competitive chess arena with{" "}
        <span className="text-arena-gold">AI-powered coaching</span>
      </h1>
      <p className="max-w-xl text-arena-muted">
        Шахматная арена с рейтингом, профилями и AI-разбором после каждой
        партии.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/play"
          className="rounded-md bg-arena-blue px-5 py-2.5 font-medium text-white hover:opacity-90"
        >
          Play Ranked Demo
        </Link>
        <Link
          href="/profile"
          className="rounded-md border border-arena-border bg-arena-panel px-5 py-2.5 font-medium hover:border-arena-gold"
        >
          View Profile
        </Link>
      </div>
      <p className="text-xs text-arena-muted">
        Stage 2 local loop: guest rating, match history, and demo review stay in
        this browser.
      </p>
    </section>
  );
}
