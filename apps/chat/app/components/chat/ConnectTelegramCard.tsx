import { IconX } from "@tabler/icons-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "joney.telegram-card.dismissed";

function readDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Compact banner above the chat surface once a member's personal agent
 * exists, pointing them at Dispatch's identities page to link Telegram.
 * Dismissal is a UI-only preference persisted in localStorage; Dispatch's
 * `/dispatch/identities` page owns the actual link-token flow.
 */
export function ConnectTelegramCard() {
  const [dismissed, setDismissed] = useState(readDismissed);

  if (dismissed) return null;

  return (
    <div className="flex items-start gap-3 border-b border-border bg-muted/40 px-4 py-3 sm:px-6">
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold text-foreground">
          Talk to your agent in Telegram
        </h2>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Link your Telegram account and your agent — with everything it
          knows — answers you there too.
        </p>
        <Button asChild size="sm" className="mt-2">
          <a href="/dispatch/identities">Connect Telegram</a>
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0"
        aria-label="Dismiss"
        onClick={() => {
          try {
            window.localStorage.setItem(DISMISSED_KEY, "true");
          } catch {
            // localStorage unavailable (e.g. private mode); dismissal is
            // best-effort UI state, not a durable record.
          }
          setDismissed(true);
        }}
      >
        <IconX className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
