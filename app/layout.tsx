import type { Metadata } from "next";
import SiteShell from "@/components/layout/SiteShell";
import { PreferencesProvider } from "@/components/settings/PreferencesProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Checkmate Arena",
  description:
    "Competitive chess platform with AI-powered post-game coaching.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="min-h-dvh">
        <PreferencesProvider>
          <SiteShell>{children}</SiteShell>
        </PreferencesProvider>
      </body>
    </html>
  );
}
