"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePreferences } from "@/components/settings/PreferencesProvider";
import {
  ARENA_STORE_ITEMS,
  loadArenaCoinsBalance,
  loadOwnedStoreItems,
  purchaseArenaStoreItem,
} from "@/lib/demo/economy";
import { loadProTrialGamesLeft } from "@/lib/demo/retention";

export default function ProPage() {
  const { t } = usePreferences();
  const [arenaCoins, setArenaCoins] = useState(0);
  const [ownedItemIds, setOwnedItemIds] = useState<string[]>([]);
  const [storeNotice, setStoreNotice] = useState("");
  const [trialGamesLeft, setTrialGamesLeft] = useState(3);

  useEffect(() => {
    setArenaCoins(loadArenaCoinsBalance());
    setOwnedItemIds(loadOwnedStoreItems());
    setTrialGamesLeft(loadProTrialGamesLeft());
  }, []);

  function buyItem(itemId: string) {
    const purchase = purchaseArenaStoreItem(itemId);
    setArenaCoins(purchase.balance);
    setOwnedItemIds(purchase.ownedItemIds);
    if (purchase.status === "purchased") {
      setStoreNotice(t.economy.store.purchased);
    }
    if (purchase.status === "insufficient") {
      setStoreNotice(t.economy.store.insufficient);
    }
  }

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

      <section className="grid gap-4 rounded-lg border border-arena-amber-border bg-arena-amber-bg p-5 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">
            {t.profile.trialBadge}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{t.pro.trialTitle}</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-lg font-semibold">
              {trialGamesLeft > 0
                ? t.retention.proTrial(trialGamesLeft)
                : t.retention.trialEnded}
            </p>
            <p className="mt-1 text-sm text-arena-muted">{t.retention.trialBody}</p>
          </div>
          <Link
            href="/play"
            className="rounded-md bg-arena-blue px-4 py-2 text-center text-sm font-semibold text-white hover:opacity-90"
          >
            {t.common.playAgain}
          </Link>
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
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-arena-border bg-arena-panel px-3 py-2">
            <p className="text-xs text-arena-muted">{t.economy.store.coinNotice}</p>
            <p className="font-mono text-sm font-bold text-arena-gold">
              {arenaCoins} {t.economy.abbr}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
          {ARENA_STORE_ITEMS.map((item) => {
            const copy = t.economy.store.items[
              item.id as keyof typeof t.economy.store.items
            ];
            const owned = ownedItemIds.includes(item.id);
            return (
            <article
              key={item.id}
              className="rounded-lg border border-arena-border bg-arena-panel p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-arena-muted">
                    {t.economy.store.categories[item.category]}
                  </p>
                  <p className="mt-1 font-semibold">{copy.name}</p>
                  <p className="mt-1 text-xs text-arena-muted">{copy.detail}</p>
                </div>
                <span className="rounded bg-arena-elevated px-2 py-1 text-[10px] text-arena-muted">
                  {item.access === "coins"
                    ? `${item.cost} ${t.economy.abbr}`
                    : item.access === "pro"
                      ? t.economy.store.lockedPro
                      : t.economy.store.lockedUltra}
                </span>
              </div>
              <button
                type="button"
                disabled={owned || item.access !== "coins"}
                onClick={() => buyItem(item.id)}
                className="mt-3 rounded border border-arena-border px-2.5 py-1 text-xs font-semibold text-arena-muted hover:border-arena-blue hover:text-arena-text disabled:cursor-not-allowed disabled:hover:border-arena-border disabled:hover:text-arena-muted"
              >
                {owned
                  ? t.economy.store.owned
                  : item.access === "coins" && item.cost !== undefined
                    ? t.economy.store.buy(item.cost)
                    : item.access === "pro"
                      ? t.economy.store.lockedPro
                      : t.economy.store.lockedUltra}
              </button>
            </article>
            );
          })}
          </div>
          {storeNotice && (
            <p className="mt-3 text-sm font-semibold text-arena-blue">{storeNotice}</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-arena-border bg-arena-panel p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-arena-muted">
          {t.pro.nextTitle}
        </p>
        <p className="mt-2 max-w-2xl text-sm text-arena-muted">{t.pro.nextBody}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {t.pro.features.map((feature) => (
            <p key={feature} className="rounded-md border border-arena-border bg-arena-elevated px-3 py-2 text-sm">
              {feature}
            </p>
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
