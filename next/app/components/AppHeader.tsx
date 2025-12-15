// app/components/AppHeader.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, UserCircle2 } from "lucide-react";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      className={[
        "relative -mx-2 rounded-lg px-2 py-1 text-sm font-medium transition-colors",
        active ? "text-zinc-900" : "text-zinc-600 hover:text-zinc-900",
      ].join(" ")}
    >
      {label}
      <span
        className={[
          "pointer-events-none absolute left-2 right-2 -bottom-2 h-[2px] rounded-full transition-opacity",
          active ? "bg-zinc-900 opacity-100" : "bg-zinc-200 opacity-0",
        ].join(" ")}
      />
    </Link>
  );
}

export function AppHeader() {
  const pathname = usePathname();

  const iconBtn =
    "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-800";

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-zinc-50/80 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 text-xl font-semibold text-zinc-900 uppercase leading-tight">
        ppoll
        </Link>

        {/* Nav (desktop) */}
        <nav className="hidden items-center gap-6 text-xl uppercase md:flex">
          <NavLink href="/" label="All polls" />
          <NavLink href="/polls" label="My polls" />
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className={iconBtn}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Link>

          <Link
            href="/profile"
            className={iconBtn}
            aria-label="Profil"
            title="Profil"
          >
            <UserCircle2 className="h-5 w-5" />
          </Link>

          {/* Mobile: mini switch */}
          <div className="ml-1 flex items-center rounded-xl border border-zinc-200 bg-white p-1 shadow-sm md:hidden">
            <Link
              href="/"
              className={[
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                isActive(pathname, "/")
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:text-zinc-900",
              ].join(" ")}
            >
              Home
            </Link>
            <Link
              href="/polls"
              className={[
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                isActive(pathname, "/polls")
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:text-zinc-900",
              ].join(" ")}
            >
              Polls
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}