import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Event } from "@/types";
import { getAccessToken } from "@/services/authClient";

async function fetchEvents(start?: string, end?: string): Promise<Event[]> {
  const token = await getAccessToken();
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);

  const res = await fetch(`/api/events?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.status === 401) {
    return [];
  }

  if (!res.ok) {
    throw new Error("Failed to load events");
  }

  return res.json();
}

async function createEvent(event: Partial<Event>): Promise<Event> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const rawFamilyMemberId =
    (event as any).familyMemberId ?? event.familyMemberId ?? null;

  const payload = {
    title: event.title,
    date: event.date,
    time: event.time,
    location: event.location,
    category: event.category ?? "other",
    family_member_id: rawFamilyMemberId || null,
    description: event.description,
  };

  const res = await fetch("/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.error ?? "Failed to add event";
    throw new Error(message);
  }

  return res.json();
}

async function removeEvent(id: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`/api/events?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.error ?? "Failed to delete event";
    throw new Error(message);
  }
}

export function useEvents(start?: string, end?: string) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<Event[], Error>({
    queryKey: ["events", { start, end }],
    queryFn: () => fetchEvents(start, end),
  });

  const addEventMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: removeEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  return {
    events: data ?? [],
    loading: isLoading,
    error,
    refetch,
    unauthorized: false,
    addEvent: addEventMutation.mutateAsync,
    deleteEvent: deleteEventMutation.mutateAsync,
    adding: addEventMutation.isPending,
    deleting: deleteEventMutation.isPending,
  };
}
