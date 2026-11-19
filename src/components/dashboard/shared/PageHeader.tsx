import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  // Extra classes for the actions box, e.g. "w-full sm:w-auto" when a page
  // lays out its own rows of controls on phones
  actionsClassName?: string;
}

export default function PageHeader({
  title,
  subtitle,
  children,
  actionsClassName,
}: PageHeaderProps) {
  return (
    // Wraps by available space, not by viewport: the title asks for 20rem, and
    // when that plus the actions doesn't fit (narrow screen, open sidebar) the
    // actions drop to their own row instead of squeezing the title
    <div className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <div className="flex min-w-0 flex-[1_1_20rem] flex-col">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* max-w-full, not shrink-0: on its own row the actions can still
          wrap onto more lines instead of running off the screen */}
      {children && (
        <div
          className={cn(
            "flex max-w-full min-w-0 flex-wrap items-center gap-2",
            actionsClassName,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
