/**
 * Tiny external store counting in-flight artifact saves, published by the
 * transcript file card while its action streams and consumed by the
 * Artifacts gallery to show a "generating" skeleton card. Both live in the
 * same React tree (the agent sidebar wraps the page), so a module-level
 * counter is enough — no server round trip, no polling.
 */
import { useSyncExternalStore } from "react";

let pendingCount = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function beginPendingArtifact(): () => void {
  pendingCount += 1;
  emit();
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    pendingCount -= 1;
    emit();
  };
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): number {
  return pendingCount;
}

export function usePendingArtifacts(): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => 0);
}
