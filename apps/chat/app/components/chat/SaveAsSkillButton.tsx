import { sendToAgentChat } from "@agent-native/core/client/agent-chat";
import { IconBookmarkPlus } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

const SAVE_AS_SKILL_MESSAGE =
  "Use turn-into-skill to capture this conversation's workflow as a reusable personal skill. Name it in plain language and confirm the name with me first.";

/**
 * Per-thread control that hands the current conversation to the agent's
 * `turn-into-skill` flow. This is an agent action (it does the real work via
 * chat), not a local/deterministic one, so it carries no "local" label and
 * intentionally avoids sparkle iconography.
 */
export function SaveAsSkillButton() {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => {
        sendToAgentChat({ message: SAVE_AS_SKILL_MESSAGE, submit: true });
      }}
    >
      <IconBookmarkPlus className="size-4" aria-hidden="true" />
      Save as skill
    </Button>
  );
}
