import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anchor Pro — Production Planning & Service Operation Tool",
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
        <link href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Barlow+Condensed:wght@400;500;600;700&family=Barlow+Semi+Condensed:wght@400;500;600&display=swap" rel="stylesheet" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2383E2" />
        <link rel="apple-touch-icon" href="/AnchorPro_logo.png" />
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
        {/* Register service worker and handle updates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    reg.addEventListener('updatefound', function() {
                      var newWorker = reg.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', function() {
                          // When new SW activates, it claims the page and triggers controllerchange
                        });
                      }
                    });
                  }).catch(function(err) {});

                  var refreshing = false;
                  navigator.serviceWorker.addEventListener('controllerchange', function() {
                    if (!refreshing) {
                      refreshing = true;
                      window.location.reload();
                    }
                  });
                });
              }
            `,
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
