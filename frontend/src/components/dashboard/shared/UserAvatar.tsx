import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

// Placeholder until users can upload their own picture
const AVATAR_SRC = "https://github.com/shadcn.png";

// "USER TEST" → "UT", "user" → "US"; falls back to the email
function initials(name?: string | null, email?: string | null) {
  const source = (name || email?.split("@")[0] || "").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase() || "?";
}

/** The logged in user's avatar (picture, or initials while it loads / fails). */
export default function UserAvatar({ className }: { className?: string }) {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <Avatar className={cn("h-9 w-9", className)}>
      <AvatarImage src={AVATAR_SRC} alt={t("dashboard.profileBadge.avatarAlt")} />
      <AvatarFallback className="font-semibold">
        {initials(user?.username, user?.email)}
      </AvatarFallback>
    </Avatar>
  );
}
