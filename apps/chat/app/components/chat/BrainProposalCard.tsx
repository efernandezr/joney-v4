import {
  registerActionChatRenderer,
  registerToolRenderer,
  type ToolRendererProps,
} from "@agent-native/core/client/agent-chat";
import { useActionMutation } from "@agent-native/core/client/hooks";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { BRAIN_PROPOSAL_RENDERER } from "@/lib/brain-proposal-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface BrainProposalEntry {
  id: string;
  type: "fact" | "preference" | "lesson" | "note";
  title: string;
  body: string;
}

function parseProposalPayload(resultJson: unknown): BrainProposalEntry | null {
  if (!resultJson || typeof resultJson !== "object") return null;
  const entry = (resultJson as { entry?: unknown }).entry;
  if (!entry || typeof entry !== "object") return null;
  const e = entry as Partial<BrainProposalEntry>;
  if (
    typeof e.id !== "string" ||
    !e.id ||
    typeof e.type !== "string" ||
    typeof e.title !== "string" ||
    typeof e.body !== "string"
  ) {
    return null;
  }
  return { id: e.id, type: e.type, title: e.title, body: e.body };
}

/**
 * Transcript card for propose-memory results: a memory the agent inferred
 * from conversation, awaiting the member's review. Never presents the
 * proposal as saved — "Keep" and "Dismiss" both call review-brain-entry,
 * the only path a proposal takes into the digest.
 */
export function BrainProposalCard({ context }: ToolRendererProps) {
  const entry = parseProposalPayload(context.resultJson);
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState<"keep" | "dismiss" | null>(null);

  const review = useActionMutation("review-brain-entry", {
    onSuccess: (_result: unknown, variables: { id: string; decision: "keep" | "dismiss" }) => {
      setDecision(variables.decision);
      void queryClient.invalidateQueries({ queryKey: ["action", "list-brain-entries"] });
    },
  });

  if (!entry) {
    if (!context.isRunning) return null;
    return (
      <div className="space-y-2 rounded-md border border-border p-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-40 max-w-full" />
        <Skeleton className="h-3 w-full max-w-full" />
        <Skeleton className="h-3 w-3/4 max-w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="capitalize">
          {entry.type}
        </Badge>
        {decision && (
          <span className="text-xs text-muted-foreground">
            {decision === "keep" ? "Kept" : "Dismissed"}
          </span>
        )}
      </div>
      <div className="text-sm font-medium">{entry.title}</div>
      <p className="text-sm text-muted-foreground">{entry.body}</p>
      {!decision && (
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
      )}
    </div>
  );
}

// Module-scope registration; re-registration under HMR is benign because the
// registry resolves to the first (identical) match.
registerActionChatRenderer({
  id: "chat.brain-proposal-card",
  renderer: BRAIN_PROPOSAL_RENDERER,
  Component: BrainProposalCard,
});
// The chatUI renderer config only attaches once the tool RESULT arrives, so
// the registration above never renders during the running phase. Matching
// the tool name directly makes the card render while propose-memory
// streams — that's what powers the in-transcript skeleton. (After the
// result, the chatUI registration resolves first — same component either
// way.)
registerToolRenderer({
  id: "chat.brain-proposal-card:propose-memory",
  match: "propose-memory",
  Component: BrainProposalCard,
});
