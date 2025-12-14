// app/components/AppHeader.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, UserCircle2 } from "lucide-react";

function isActive(pathname: string, href: string) {
  // "/" doit matcher uniquement "/"
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppHeader() {
  const pathname = usePathname();

  const linkBase =
    "text-sm font-medium transition-colors hover:text-zinc-900";
  const linkActive = "text-zinc-900";
  const linkInactive = "text-zinc-600";

  const iconBtn =
    "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-300";

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
            <span className="text-sm font-semibold text-zinc-900">NS</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-zinc-900">NoSQL Polls</div>
            <div className="text-xs text-zinc-500">Sondages & votes</div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className={[
              linkBase,
              isActive(pathname, "/") ? linkActive : linkInactive,
            ].join(" ")}
          >
            Dashboard
          </Link>

          <Link
            href="/polls"
            className={[
              linkBase,
              isActive(pathname, "/polls") ? linkActive : linkInactive,
            ].join(" ")}
          >
            Sondages
            <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">
              mes sondages
            </span>
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Mobile quick links (optionnel) */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/"
              className={[
                "rounded-xl px-3 py-2 text-sm",
                isActive(pathname, "/") ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700",
              ].join(" ")}
            >
              Home
            </Link>
            <Link
              href="/polls"
              className={[
                "rounded-xl px-3 py-2 text-sm",
                isActive(pathname, "/polls")
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-700",
              ].join(" ")}
            >
              Polls
            </Link>
          </div>

          <Link href="/notifications" className={iconBtn} aria-label="Notifications">
            <Bell className="h-5 w-5 text-zinc-700" />
          </Link>

          <Link href="/profile" className={iconBtn} aria-label="Profil">
            <UserCircle2 className="h-5 w-5 text-zinc-700" />
          </Link>
        </div>
      </div>
    </header>
  );
}
