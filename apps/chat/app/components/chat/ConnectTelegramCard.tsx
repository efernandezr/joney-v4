import { IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const DISMISSED_KEY = "joney.telegram-card.dismissed";

function readDismissed(): boolean {
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
 *
 * This route is SSR'd, and the server has no localStorage to consult, so the
 * component starts hidden (`dismissed: true`) on both the server render and
 * the first client render, then reveals itself in a post-mount effect if the
 * member has not dismissed it. That keeps server and first-client markup
 * identical (no hydration mismatch) and means a previously dismissed card
 * never flashes back into view — the cost is a one-frame-later appearance
 * for a member seeing the card for the first time, which is the better
 * trade-off for a banner.
 */
export function ConnectTelegramCard() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

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
