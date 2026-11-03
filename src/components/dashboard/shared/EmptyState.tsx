import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  message: string;
}

/** Placeholder for cards without data, instead of an empty chart. */
export default function EmptyState({ icon: Icon, message }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
        <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="max-w-64 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
