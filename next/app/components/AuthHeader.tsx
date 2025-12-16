// app/components/AuthHeader.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
        "relative mx-1 rounded-lg px-2 py-1 text-sm font-medium transition-colors",
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

export function AuthHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-zinc-50/80 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-3 text-xl font-semibold text-zinc-900 uppercase leading-tight"
        >
          ppoll
        </Link>

        {/* Nav (desktop) */}
        <nav className="hidden items-center gap-6 text-xl uppercase md:flex">
          <NavLink href="/auth/register" label="Register" />
          <NavLink href="/auth/login" label="Login" />
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
        </div>
      </div>
    </header>
  );
}