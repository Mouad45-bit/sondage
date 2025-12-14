// app/components/AppHeader.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, UserCircle2 } from "lucide-react";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      className={[
        "relative -mx-2 rounded-md px-2 py-1 text-sm transition-colors",
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
    "inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300";

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
            <span className="text-xs font-semibold tracking-wide text-white">NS</span>
          </div>
          <div className="text-sm font-semibold text-zinc-900">NoSQL Polls</div>
        </Link>

        {/* Nav (desktop) */}
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink href="/" label="Dashboard" />
          <NavLink href="/polls" label="Mes sondages" />
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
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

          {/* Mobile: mini switch (ultra simple) */}
          <div className="ml-2 flex items-center rounded-lg bg-zinc-100 p-1 md:hidden">
            <Link
              href="/"
              className={[
                "rounded-md px-2 py-1 text-xs transition-colors",
                isActive(pathname, "/")
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600",
              ].join(" ")}
            >
              Home
            </Link>
            <Link
              href="/polls"
              className={[
                "rounded-md px-2 py-1 text-xs transition-colors",
                isActive(pathname, "/polls")
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600",
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