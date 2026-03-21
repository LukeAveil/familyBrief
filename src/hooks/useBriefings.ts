import { useQuery } from "@tanstack/react-query";
import { WeeklyBriefing } from "@/types";
import { getAccessToken } from "@/services/authClient";

async function fetchBriefings(): Promise<WeeklyBriefing[]> {
  const token = await getAccessToken();

  const res = await fetch("/api/briefings", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.status === 401) {
    return [];
  }

  if (!res.ok) {
    throw new Error("Failed to load briefings");
  }
  return res.json();
}

export function useBriefings() {
  const { data, isLoading, error, refetch } = useQuery<WeeklyBriefing[], Error>({
    queryKey: ["briefings"],
    queryFn: fetchBriefings,
  });

  return {
    briefings: data ?? [],
    loading: isLoading,
    error,
    refetch,
    unauthorized: data !== undefined && data.length === 0 && !isLoading && !error,
  };
}
