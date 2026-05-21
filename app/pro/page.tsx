"use client";

import Link from "next/link";
import { usePreferences } from "@/components/settings/PreferencesProvider";

export default function ProPage() {
  const { t } = usePreferences();

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 border-b border-arena-border pb-8 pt-3 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <p className="text-sm font-medium text-arena-gold">{t.pro.eyebrow}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            {t.pro.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-arena-text">
            {t.pro.intro}
          </p>
          <p className="mt-3 max-w-2xl text-sm text-arena-muted">
            {t.pro.boundary}
          </p>
        </div>
        <div className="rounded-lg border border-arena-border bg-arena-panel p-5">
          <p className="text-sm text-arena-muted">{t.pro.label}</p>
          <p className="mt-2 text-3xl font-semibold">{t.pro.comingSoon}</p>
          <p className="mt-2 text-sm text-arena-muted">
            {t.pro.cardBody}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              disabled
              className="rounded-md bg-arena-gold px-4 py-2 font-medium text-arena-bg disabled:cursor-not-allowed disabled:opacity-70"
            >
              {t.pro.checkout}
            </button>
            <Link
              href="/play"
              className="rounded-md border border-arena-border px-4 py-2 font-medium hover:border-arena-gold"
            >
              {t.pro.playDemo}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {t.pro.features.map((feature) => (
          <article
            key={feature}
            className="rounded-lg border border-arena-border bg-arena-panel p-5"
          >
            <p className="text-sm font-medium text-arena-gold">{t.pro.featureLabel}</p>
            <p className="mt-2 text-lg font-semibold">{feature}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 rounded-lg border border-arena-border bg-arena-panel p-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-medium text-arena-gold">{t.pro.demoBoundary}</p>
          <h2 className="mt-2 text-2xl font-semibold">{t.pro.honestTitle}</h2>
        </div>
        <div className="grid gap-2">
          {t.pro.boundaries.map((boundary) => (
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
