import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useActiveFrequencies() {
  return useQuery({
    queryKey: [api.frequencies.active.path],
    queryFn: async () => {
      const res = await fetch(api.frequencies.active.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch active frequencies");
      return api.frequencies.active.responses[200].parse(await res.json());
    },
    refetchInterval: 10000, // Poll every 10s for active freq list
  });
}
