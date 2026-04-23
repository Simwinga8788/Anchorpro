import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anchor Pro — Operations Platform",
  description: "Production & Service Operations Management System",
};

import { AuthProvider } from "@/lib/AuthContext";
import { DictionaryProvider } from "@/lib/DictionaryContext";

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
      </head>
        <AuthProvider>
          <DictionaryProvider>
            {children}
          </DictionaryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
