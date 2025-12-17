// app/layout.tsx

import "./globals.css";
import { AppHeader } from "./components/AppHeader";
import { AppChrome } from "./components/AppChrome";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Stack+Sans+Text:wght@200..700&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="bg-zinc-50 text-zinc-900">
        <AppChrome>
          <AppHeader />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </AppChrome>
      </body>
    </html>
  );
}
