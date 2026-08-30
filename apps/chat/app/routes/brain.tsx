import { useActionQuery } from "@agent-native/core/client/hooks";
import { useMemo } from "react";

import { BrainEntryCard, type BrainEntry } from "@/components/brain/BrainEntryCard";
import { ProposalsInbox } from "@/components/brain/ProposalsInbox";
import { Skeleton } from "@/components/ui/skeleton";

export function meta() {
  return [{ title: "My Brain" }];
}

const KEPT_SECTIONS: Array<{ type: BrainEntry["type"]; heading: string }> = [
  { type: "preference", heading: "Preferences" },
  { type: "fact", heading: "Facts" },
  { type: "lesson", heading: "Lessons" },
  { type: "note", heading: "Notes" },
];

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2 rounded-md border border-border p-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-40 max-w-full" />
          <Skeleton className="h-3 w-full max-w-full" />
          <Skeleton className="h-3 w-3/4 max-w-full" />
        </div>
      ))}
    </div>
  );
}

export default function BrainRoute() {
  const entriesQuery = useActionQuery("list-brain-entries", {});
  const entries = ((entriesQuery.data as { entries?: BrainEntry[] } | undefined)
    ?.entries ?? []) as BrainEntry[];

  const proposed = useMemo(
    () => entries.filter((entry) => entry.status === "proposed"),
    [entries],
  );
  const kept = useMemo(
    () => entries.filter((entry) => entry.status === "kept"),
    [entries],
  );

  const isEmpty = !entriesQuery.isLoading && entries.length === 0;

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="mb-5 text-xl font-semibold">My Brain</h1>

      {entriesQuery.isLoading ? (
        <LoadingSkeleton />
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="max-w-sm text-sm text-muted-foreground">
            Your brain is empty so far. Chat with your agent — it will
            propose memories worth keeping.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {proposed.length > 0 && <ProposalsInbox entries={proposed} />}

          {KEPT_SECTIONS.map(({ type, heading }) => {
            const sectionEntries = kept.filter((entry) => entry.type === type);
            if (sectionEntries.length === 0) return null;
            return (
              <section key={type} className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">
                  {heading}
                </h2>
                <div className="space-y-2">
                  {sectionEntries.map((entry) => (
                    <BrainEntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
