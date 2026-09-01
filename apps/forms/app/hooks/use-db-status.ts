import { agentNativePath, appPath } from "@agent-native/core/client/api-path";
import { useQuery } from "@tanstack/react-query";

interface EnvStatusEntry {
  key: string;
  label: string;
  required: boolean;
  configured: boolean;
}

interface DbHealth {
  ok: boolean;
  local?: boolean;
}

export function useDbStatus() {
  const { data, isLoading } = useQuery<EnvStatusEntry[]>({
    queryKey: ["env-status"],
    queryFn: async () => {
      const res = await fetch(agentNativePath("/_agent-native/env-status"));
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30_000,
  });

  // env-status reports DATABASE_URL through the scoped-secret resolver, which
  // does not see deploy-level env vars. On hosted deploys (Vercel/Neon) the
  // server is already on a remote database, so ask it directly.
  const { data: health, isLoading: isHealthLoading } = useQuery<DbHealth>({
    queryKey: ["db-health"],
    queryFn: async () => {
      const res = await fetch(appPath("/api/db-health"));
      if (!res.ok) return { ok: false };
      return res.json();
    },
    staleTime: 30_000,
  });

  const dbUrlEntry = data?.find((e) => e.key === "DATABASE_URL");
  const configured =
    (dbUrlEntry?.configured ?? false) ||
    (health?.ok === true && health.local === false);

  return {
    configured,
    isLocal: !configured,
    isLoading: isLoading || isHealthLoading,
  };
}
