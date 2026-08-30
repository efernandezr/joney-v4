import { useActionMutation } from "@agent-native/core/client/hooks";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BrainEntry } from "@/components/brain/BrainEntryCard";

/**
 * Proposed memories awaiting the member's review. Keep (primary) promotes
 * the entry to kept; Dismiss (ghost) deletes it. Both call
 * review-brain-entry — the only path a proposal takes into the digest —
 * and invalidate list-brain-entries on settle.
 */
export function ProposalsInbox({ entries }: { entries: BrainEntry[] }) {
  const queryClient = useQueryClient();

  const review = useActionMutation("review-brain-entry", {
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["action", "list-brain-entries"] });
    },
    onError: () => toast.error("Couldn't update that memory — try again."),
  });

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        Proposed memories
      </h2>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            data-testid="brain-entry-card"
            className="space-y-2 rounded-md border border-border p-3"
          >
            <Badge variant="secondary" className="capitalize">
              {entry.type}
            </Badge>
            <div className="text-sm font-medium">{entry.title}</div>
            <p className="text-sm text-muted-foreground">{entry.body}</p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                className="gap-1.5 text-xs"
                disabled={review.isPending}
                onClick={() => review.mutate({ id: entry.id, decision: "keep" })}
              >
                <IconCheck className="size-3.5" aria-hidden="true" />
                Keep
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
                disabled={review.isPending}
                onClick={() => review.mutate({ id: entry.id, decision: "dismiss" })}
              >
                <IconX className="size-3.5" aria-hidden="true" />
                Dismiss
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
