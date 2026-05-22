"use client";

import Link from "next/link";
import { usePreferences } from "@/components/settings/PreferencesProvider";

export default function ProPage() {
  const { t } = usePreferences();

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 border-b border-arena-border pb-7 pt-3 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">
            {t.pro.eyebrow}
          </p>
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
        <div className="rounded-lg border border-arena-amber-border bg-arena-amber-bg p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-arena-muted">
            {t.pro.label}
          </p>
          <p className="mt-2 text-2xl font-semibold">{t.pro.billingComingSoon}</p>
          <p className="mt-2 text-sm text-arena-muted">{t.pro.billingBody}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              disabled
              className="rounded-md bg-arena-blue px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {t.pro.upgradeSoon}
            </button>
            <Link
              href="/play"
              className="rounded-md border border-arena-border bg-arena-panel px-4 py-2 text-sm font-medium hover:border-arena-gold"
            >
              {t.pro.playDemo}
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">
            {t.pro.pricingTitle}
          </p>
          <p className="mt-2 text-sm text-arena-muted">{t.pro.pricingBody}</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {t.pro.tiers.map((tier, index) => (
            <article
              key={tier.name}
              className={
                index === 1
                  ? "rounded-lg border border-arena-amber-border bg-arena-amber-bg p-5"
                  : "rounded-lg border border-arena-border bg-arena-panel p-5"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">{tier.name}</h2>
                  <p className="mt-1 text-sm text-arena-muted">{tier.summary}</p>
                </div>
                <span className="rounded bg-arena-elevated px-2 py-1 text-[10px] font-semibold text-arena-muted">
                  {index === 0 ? t.pro.comingSoon : t.pro.upgradeSoon}
                </span>
              </div>
              <div className="mt-4 grid gap-2">
                {tier.features.map((feature) => (
                  <p
                    key={feature}
                    className="rounded border border-arena-border bg-arena-panel px-3 py-2 text-sm"
                  >
                    {feature}
                  </p>
                ))}
              </div>
              <button
                type="button"
                disabled
                className="mt-4 w-full rounded-md border border-arena-border px-3 py-2 text-sm font-semibold text-arena-muted disabled:cursor-not-allowed"
              >
                {t.pro.upgradeSoon}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-arena-border bg-arena-panel">
        <div className="border-b border-arena-border px-4 py-3">
          <h2 className="text-lg font-semibold">{t.pro.comparisonTitle}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-arena-elevated text-xs uppercase tracking-wide text-arena-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">{t.pro.featureLabel}</th>
                {t.pro.tiers.map((tier) => (
                  <th key={tier.name} className="px-4 py-3 font-semibold">
                    {tier.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-border">
              {t.pro.comparisonRows.map((row) => (
                <tr key={row.feature}>
                  <th className="px-4 py-3 font-medium">{row.feature}</th>
                  <td className="px-4 py-3 text-arena-muted">{row.free}</td>
                  <td className="px-4 py-3 text-arena-text">{row.pro}</td>
                  <td className="px-4 py-3 text-arena-text">{row.ultra}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 border-y border-arena-border py-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">
            {t.pro.storeEyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{t.pro.storeTitle}</h2>
          <p className="mt-2 text-sm text-arena-muted">{t.pro.storeBody}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {t.pro.storeItems.map((item) => (
            <article
              key={item.name}
              className="rounded-lg border border-arena-border bg-arena-panel p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="mt-1 text-xs text-arena-muted">{item.detail}</p>
                </div>
                <span className="rounded bg-arena-elevated px-2 py-1 text-[10px] text-arena-muted">
                  {item.tier}
                </span>
              </div>
              <button
                type="button"
                disabled
                className="mt-3 rounded border border-arena-border px-2.5 py-1 text-xs font-semibold text-arena-muted disabled:cursor-not-allowed"
              >
                {t.pro.storeAction}
              </button>
            </article>
          ))}
        </div>
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
