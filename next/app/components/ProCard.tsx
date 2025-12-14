// app/components/ProCard.tsx

import { ReactNode } from "react";

type ProCardProps = {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ProCard({ title, subtitle, right, children, className }: ProCardProps) {
  return (
    <section
      className={[
        "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm",
        "dark:border-zinc-800 dark:bg-zinc-950/40",
        className || "",
      ].join(" ")}
    >
      {(title || subtitle || right) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      )}

      <div>{children}</div>
    </section>
  );
}
