import {
  readClientAppState,
  setClientAppState,
} from "@agent-native/core/client/application-state";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { TAB_ID } from "@/lib/tab-id";

export interface ArtifactPreviewState {
  resourceId: string;
  path: string;
}

const QUERY_KEY = ["app-state", "artifact-preview"];

/**
 * The `artifact-preview` app-state key, kept live by useDbSync: any app-state
 * sync event invalidates the ["app-state"] query key prefix, so agent writes
 * (via the preview-artifact action) land here without polling.
 */
export function useArtifactPreview() {
  const queryClient = useQueryClient();
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

  return { preview: query.data ?? null, open, close };
}
