import {
  readClientAppState,
  setClientAppState,
} from "@agent-native/core/client/application-state";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

import { TAB_ID } from "@/lib/tab-id";

export interface ArtifactPreviewState {
  resourceId: string;
  path: string;
  /** Conversation the preview belongs to; null = Artifacts-page preview. */
  threadId: string | null;
}

const QUERY_KEY = ["app-state", "artifact-preview"];
const ACTIVE_THREAD_STORAGE_KEY = "agent-chat-active-thread:chat";

function readStoredActiveThread(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_THREAD_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * The active conversation id: the /chat/:threadId route param when present,
 * otherwise the framework's persisted active-thread key, refreshed when the
 * framework announces a thread switch via the agent-chat:open-thread event.
 */
export function useActiveChatThreadId(): string | null {
  const { threadId: routeThreadId } = useParams();
  const [storedId, setStoredId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : readStoredActiveThread(),
  );

  useEffect(() => {
    const refresh = () => setStoredId(readStoredActiveThread());
    window.addEventListener("agent-chat:open-thread", refresh);
    window.addEventListener("storage", refresh);
    // Poll as a fallback: the framework writes the key without an event in
    // some flows (e.g. New Chat creating an optimistic thread).
    const timer = window.setInterval(refresh, 1500);
    return () => {
      window.removeEventListener("agent-chat:open-thread", refresh);
      window.removeEventListener("storage", refresh);
      window.clearInterval(timer);
    };
  }, []);

  return routeThreadId ?? storedId;
}

/**
 * The `artifact-preview` app-state key, kept live by useDbSync (app-state
 * sync events invalidate the ["app-state"] query prefix).
 */
export function useArtifactPreview() {
  const queryClient = useQueryClient();
  const activeThreadId = useActiveChatThreadId();
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      readClientAppState<ArtifactPreviewState | null>("artifact-preview"),
  });

  async function open(state: ArtifactPreviewState) {
    await setClientAppState("artifact-preview", state, {
      requestSource: TAB_ID,
    });
    queryClient.setQueryData(QUERY_KEY, state);
  }

  async function close() {
    await setClientAppState("artifact-preview", null, {
      requestSource: TAB_ID,
    });
    queryClient.setQueryData(QUERY_KEY, null);
  }

  return { preview: query.data ?? null, activeThreadId, open, close };
}
