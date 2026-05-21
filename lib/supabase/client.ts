"use client";

import { createBrowserClient } from "@supabase/ssr";

function getBrowserConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return url && anonKey ? { anonKey, url } : null;
}

export function hasBrowserSupabaseConfig(): boolean {
  return getBrowserConfig() !== null;
}

export function createClient() {
  const config = getBrowserConfig();

  return config ? createBrowserClient(config.url, config.anonKey) : null;
}
