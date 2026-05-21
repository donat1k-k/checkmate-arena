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
      <head>
        {/* Reads localStorage before React hydrates to prevent theme/lang flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=JSON.parse(localStorage.getItem('checkmate-arena.preferences.v1')||'{}');var e=document.documentElement;if(p.theme==='light')e.dataset.theme='light';if(p.locale==='ru')e.lang='ru';e.classList.add('prefs-loading');}catch(_){}})();`,
          }}
        />
      </head>
      <body className="min-h-dvh">
        <PreferencesProvider>
          <SiteShell>{children}</SiteShell>
        </PreferencesProvider>
      </body>
    </html>
  );
}
