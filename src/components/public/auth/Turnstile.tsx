import { useImperativeHandle, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Turnstile as CloudflareTurnstile,
  type TurnstileInstance,
} from "@marsidev/react-turnstile";
import { useTheme } from "@/hooks/useTheme";

// Cloudflare Turnstile widget (captcha) on login / signup.
// The token is single-use: reset the widget after every failed submit.
// The domain challenges.cloudflare.com must be allowed in the CSP
// (script-src + frame-src in netlify.toml).

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();

export interface TurnstileHandle {
  reset: () => void;
}

interface TurnstileProps {
  // token when the check passes, null when it expires or fails
  onToken: (token: string | null) => void;
  ref?: React.Ref<TurnstileHandle>;
}

export function Turnstile({ onToken, ref }: TurnstileProps) {
  const widgetRef = useRef<TurnstileInstance>(undefined);
  const { dark } = useTheme();
  const { i18n } = useTranslation();

  useImperativeHandle(ref, () => ({
    reset: () => {
      onToken(null);
      widgetRef.current?.reset();
    },
  }));

  if (!SITE_KEY) {
    console.error("VITE_TURNSTILE_SITE_KEY is not set");
    return null;
  }

  const theme = dark ? "dark" : "light";

  return (
    <CloudflareTurnstile
      // remount on theme / language change, so the widget follows the app
      key={`${theme}-${i18n.language}`}
      ref={widgetRef}
      siteKey={SITE_KEY}
      options={{ theme, language: i18n.language, size: "flexible" }}
      onSuccess={(token) => onToken(token)}
      onExpire={() => onToken(null)}
      onError={() => onToken(null)}
      className="min-h-16.25 w-full"
    />
  );
}
