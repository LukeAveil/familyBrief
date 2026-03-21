"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { BriefingListItem } from "@/types";
import { getAccessToken } from "@/services/authClient";
import { getToday, parseIsoDate, pickCurrentBriefing } from "@/lib/briefing";

type BriefingListApiRow = {
  id: string;
  weekStart: string;
  content: string;
  sentAt?: string | null;
  createdAt: string;
};

function mapBriefingListItem(row: BriefingListApiRow): BriefingListItem {
  return {
    id: row.id,
    weekStart: parseIsoDate(row.weekStart),
    content: row.content,
    sentAt: row.sentAt ? new Date(row.sentAt) : undefined,
    createdAt: new Date(row.createdAt),
  };
}

async function fetchBriefings(): Promise<BriefingListItem[]> {
  const token = await getAccessToken();
  const res = await fetch("/api/briefing/list", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.status === 401) {
    return [];
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to load briefings");
  }
  const raw = (await res.json()) as BriefingListApiRow[];
  return raw.map(mapBriefingListItem);
}

export type GenerateBriefingResult = {
  success: boolean;
  briefing: {
    id: string;
    content: string;
    weekStart: Date;
    sentAt: Date;
  };
  emailSent: boolean;
};

type GenerateBriefingApiResponse = {
  success: boolean;
  briefing: {
    id: string;
    content: string;
    weekStart: string;
    sentAt: string;
  };
  emailSent: boolean;
};

export function useBriefings() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<Error | null>(null);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<BriefingListItem[], Error>({
    queryKey: ["briefings"],
    queryFn: fetchBriefings,
  });

  const briefings = data ?? [];

  const currentBriefing = useMemo(() => {
    if (briefings.length === 0) return null;
    if (selectedId) {
      const found = briefings.find((b) => b.id === selectedId);
      if (found) return found;
    }
    return pickCurrentBriefing(briefings, getToday());
  }, [briefings, selectedId]);

  const selectBriefing = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const generateBriefing = useCallback(async (): Promise<GenerateBriefingResult> => {
    setGenerating(true);
    setGenerateError(null);
    const token = await getAccessToken();
    try {
      const res = await fetch("/api/briefing/generate", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
      });
      const body = (await res.json().catch(() => ({}))) as
        | GenerateBriefingApiResponse
        | { error?: string };
      if (!res.ok) {
        throw new Error(
          "error" in body && body.error
            ? body.error
            : "Failed to generate briefing"
        );
      }
      const ok = body as GenerateBriefingApiResponse;
      setGenerateError(null);
      await queryClient.invalidateQueries({ queryKey: ["briefings"] });
      const result: GenerateBriefingResult = {
        success: ok.success,
        emailSent: ok.emailSent,
        briefing: {
          id: ok.briefing.id,
          content: ok.briefing.content,
          weekStart: parseIsoDate(ok.briefing.weekStart),
          sentAt: new Date(ok.briefing.sentAt),
        },
      };
      if (result.briefing?.id) {
        setSelectedId(result.briefing.id);
      }
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setGenerateError(err);
      throw err;
    } finally {
      setGenerating(false);
    }
  }, [queryClient]);

  return {
    briefings,
    loading: isLoading,
    error,
    refetch,
    currentBriefing,
    selectBriefing,
    selectedId,
    generateBriefing,
    generating,
    generateError,
    unauthorized:
      data !== undefined && briefings.length === 0 && !isLoading && !error,
  };
}
