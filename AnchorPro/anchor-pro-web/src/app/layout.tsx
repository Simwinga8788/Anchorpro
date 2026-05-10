import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anchor Pro — Operations Platform",
  description: "Production & Service Operations Management System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AnchorPro",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#2383E2",
    "msapplication-tap-highlight": "no",
  },
};

import { AuthProvider } from "@/lib/AuthContext";
import { DictionaryProvider } from "@/lib/DictionaryContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { NotificationsProvider } from "@/lib/NotificationsContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2383E2" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AnchorPro" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Prevent dark/light flash — apply stored theme before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('anchor-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
        {/* Register service worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});})}`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <DictionaryProvider>
              <NotificationsProvider>
                {children}
              </NotificationsProvider>
            </DictionaryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
