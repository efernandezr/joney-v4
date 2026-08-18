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
const COLLAPSED_KEY = "artifact-preview-collapsed";
const COLLAPSED_EVENT = "artifact-preview:collapsed-change";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

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
  const [collapsed, setCollapsed] = useState(() =>
    typeof window === "undefined" ? false : readCollapsed(),
  );

  // Multiple useArtifactPreview() instances can be mounted at once (e.g. the
  // Artifacts page holds one for `open` while the panel holds another for
  // `collapsed`); a plain useState here would leave other instances stale
  // when one instance calls collapse()/expand(). Broadcast a same-tab custom
  // event (storage events don't fire in the tab that wrote the key) so every
  // instance re-reads localStorage and stays in sync.
  useEffect(() => {
    const refresh = () => setCollapsed(readCollapsed());
    window.addEventListener(COLLAPSED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(COLLAPSED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  function collapse() {
    try {
      window.localStorage.setItem(COLLAPSED_KEY, "1");
    } catch {
      // ignore storage failures (private mode, quota, etc.)
    }
    window.dispatchEvent(new CustomEvent(COLLAPSED_EVENT));
    setCollapsed(true);
  }

  function expand() {
    try {
      window.localStorage.removeItem(COLLAPSED_KEY);
    } catch {
      // ignore storage failures (private mode, quota, etc.)
    }
    window.dispatchEvent(new CustomEvent(COLLAPSED_EVENT));
    setCollapsed(false);
  }

  async function open(state: ArtifactPreviewState) {
    await setClientAppState("artifact-preview", state, {
      requestSource: TAB_ID,
    });
    queryClient.setQueryData(QUERY_KEY, state);
    expand();
  }

  return {
    preview: query.data ?? null,
    activeThreadId,
    open,
    collapsed,
    collapse,
    expand,
  };
}
