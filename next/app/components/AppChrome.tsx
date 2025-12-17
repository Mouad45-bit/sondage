// app/components/AppChrome.tsx

"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BotChatWidget } from "./BotChatWidget";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const hideChat =
    pathname === "/auth/login" ||
    pathname === "/auth/register";

  return (
    <>
      {children}
      {!hideChat && <BotChatWidget />}
    </>
  );
}
