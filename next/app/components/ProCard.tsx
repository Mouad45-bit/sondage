// app/components/ProCard.tsx

import { ReactNode } from "react";

type ProCardProps = {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ProCard({
  title,
  subtitle,
  right,
  children,
  className,
}: ProCardProps) {
  return (
    <section
      className={[
        "rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-sm md:px-5 md:py-5",
        className || "",
      ].join(" ")}
    >
      {(title || subtitle || right) && (
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="text-center md:text-left">
            {title && (
              <h1 className="text-xs font-semibold tracking-[0.18em] text-zinc-700 uppercase md:text-sm">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-xs text-zinc-600 md:text-sm">
                {subtitle}
              </p>
            )}
          </div>

          {right ? (
            <div className="flex shrink-0 justify-center md:justify-end">
              {right}
            </div>
          ) : null}
        </div>
      )}

      <div>{children}</div>
    </section>
  );
}