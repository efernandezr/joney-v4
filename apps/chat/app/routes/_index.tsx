import {
  AgentChatSurface,
  markAgentChatHomeHandoff,
} from "@agent-native/core/client/agent-chat";
import { useActionQuery } from "@agent-native/core/client/hooks";
import { useT } from "@agent-native/core/client/i18n";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { SaveAsSkillButton } from "@/components/chat/SaveAsSkillButton";
import { WelcomeCreateAgent } from "@/components/chat/WelcomeCreateAgent";
import { APP_TITLE } from "@/lib/app-config";
import { TAB_ID } from "@/lib/tab-id";

const SEO_TITLE = `${APP_TITLE} - Open Source AI app starter with actions`;
const SEO_DESCRIPTION =
  "Open Source starter for agent-native apps with durable chat, shared actions, UI state, tools, and a backend your agent can extend.";

export function meta() {
  return [
    { title: SEO_TITLE },
    {
      name: "description",
      content: SEO_DESCRIPTION,
    },
    { property: "og:title", content: SEO_TITLE },
    { property: "og:description", content: SEO_DESCRIPTION },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: SEO_TITLE },
    { name: "twitter:description", content: SEO_DESCRIPTION },
  ];
}

function chatThreadPath(threadId: string | null) {
  return threadId ? `/chat/${encodeURIComponent(threadId)}` : "/";
}

export default function ChatRoute() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const t = useT();
  const threadUrlSync = threadId
    ? {
        routeThreadId: threadId,
        getPath: chatThreadPath,
        navigate,
      }
    : undefined;

  // Kept true for the rest of this session once the member starts the birth
  // ritual, so the chat surface (where the ritual conversation happens)
  // stays visible instead of the gate re-appearing on every render before
  // `get-personal-agent` has refetched as `exists: true`.
  const [ritualStarted, setRitualStarted] = useState(false);
  const personalAgentQuery = useActionQuery("get-personal-agent");
  // Gate on "not confirmed exists" rather than "confirmed exists: false" so a
  // fresh member never sees a flash of the full chat surface while the query
  // is still in flight — the welcome panel mounts immediately and renders
  // its own Skeleton branch until the query resolves.
  const showWelcomeGate =
    !threadId && !ritualStarted && personalAgentQuery.data?.exists !== true;

  useEffect(() => {
    function handleChatRunning(event: Event) {
      const detail = (event as CustomEvent).detail;
      if (detail?.isRunning === true) markAgentChatHomeHandoff("chat");
    }

    window.addEventListener("agentNative.chatRunning", handleChatRunning);
    return () =>
      window.removeEventListener("agentNative.chatRunning", handleChatRunning);
  }, []);

  if (showWelcomeGate) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-background">
        <WelcomeCreateAgent
          data={personalAgentQuery.data}
          isLoading={personalAgentQuery.isLoading}
          onCreateAgent={() => setRitualStarted(true)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <AgentChatSurface
        mode="page"
        chatViewTransition
        className="h-full"
        defaultMode="chat"
        storageKey="chat"
        threadUrlSync={threadUrlSync}
        browserTabId={TAB_ID}
        showHeader={false}
        showTabBar={false}
        dynamicSuggestions={false}
        suggestions={[
          t("chat.suggestionCapabilities"),
          t("chat.suggestionCustomize"),
          t("chat.suggestionActions"),
        ]}
        emptyStateText={t("chat.emptyState")}
        emptyStateDisplay="hidden"
        centerComposerWhenEmpty
        composerLayoutVariant="hero"
        composerPlaceholder={t("chat.composerPlaceholder")}
        // Only on thread routes: the empty home composer has no saved
        // conversation yet, so "save as skill" has nothing to capture.
        composerToolbarSlot={threadId ? <SaveAsSkillButton /> : undefined}
        composerSlot={
          <div className="mx-auto mb-5 max-w-xl px-4 text-center">
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
              {t("chat.heroTitle")}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("chat.heroDescription")}
            </p>
          </div>
        }
      />
    </div>
  );
}
