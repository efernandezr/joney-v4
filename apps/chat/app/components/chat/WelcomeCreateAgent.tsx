import { sendToAgentChat } from "@agent-native/core/client/agent-chat";
import { useActionQuery } from "@agent-native/core/client/hooks";
import { IconUserBolt } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const RITUAL_MESSAGE = "[joney-ritual] I want to create my personal agent.";

interface WelcomeCreateAgentProps {
  /** Notified after the ritual message is sent, so a host route can flip
   * into the chat surface for the rest of the birth-ritual conversation. */
  onCreateAgent?: () => void;
}

/**
 * First-run gate: members without a personal agent see this instead of the
 * chat surface. The single action kicks off the birth ritual by sending the
 * `[joney-ritual]` marker message, which the system prompt (see Task 5)
 * picks up to walk the member through naming and shaping their agent.
 */
export function WelcomeCreateAgent({ onCreateAgent }: WelcomeCreateAgentProps = {}) {
  const personalAgentQuery = useActionQuery("get-personal-agent");

  if (personalAgentQuery.isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <Skeleton className="mx-auto h-7 w-40" />
          <div className="space-y-2">
            <Skeleton className="mx-auto h-3 w-full" />
            <Skeleton className="mx-auto h-3 w-5/6" />
          </div>
          <Skeleton className="mx-auto h-9 w-36" />
        </div>
      </div>
    );
  }

  if (personalAgentQuery.data?.exists) return null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center px-4 text-center">
      <div className="w-full max-w-sm space-y-4">
        <IconUserBolt
          className="mx-auto size-8 text-muted-foreground"
          aria-hidden="true"
        />
        <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
          Meet your agent
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Before anything else, create your personal agent. Give it a name, tell it
          what you work on, and shape how it talks to you. It&apos;s yours: what it
          learns stays private to you.
        </p>
        <Button
          type="button"
          onClick={() => {
            sendToAgentChat({ message: RITUAL_MESSAGE, submit: true });
            onCreateAgent?.();
          }}
        >
          Create your agent
        </Button>
      </div>
    </div>
  );
}
