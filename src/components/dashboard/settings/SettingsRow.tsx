import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SettingsRowProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  // id of the control, so the title acts as its label
  htmlFor?: string;
  children: ReactNode;
}

// One setting: icon + title/description on the left, the control on the right
export default function SettingsRow({
  icon: Icon,
  title,
  description,
  htmlFor,
  children,
}: SettingsRowProps) {
  const Title = htmlFor ? "label" : "p";

  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-muted p-2 text-muted-foreground">
          <Icon className="size-4" />
        </div>
        <div>
          <Title htmlFor={htmlFor} className="text-sm font-medium">
            {title}
          </Title>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="pl-11 sm:pl-0">{children}</div>
    </div>
  );
}
