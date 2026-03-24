import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Event, EventCategory } from "@/types";

type CreateEventInput = {
  title: string;
  date: string;
  category: EventCategory;
  time?: string;
  location?: string;
  description?: string;
  familyMemberId?: string | null;
};
import {
  errorResponseSchema,
  eventListResponseSchema,
  eventResponseSchema,
} from "@/lib/api/schemas";
import { getAccessToken } from "@/services/authClient";

async function fetchEvents(start?: string, end?: string): Promise<Event[]> {
  const token = await getAccessToken();
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);

  const res = await fetch(`/api/events?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const raw: unknown = await res.json();

  if (res.status === 401) {
    return [];
  }

  if (!res.ok) {
    const err = errorResponseSchema.safeParse(raw);
    throw new Error(
      err.success ? err.data.error : "Failed to load events"
    );
  }

  return eventListResponseSchema.parse(raw);
}

async function createEvent(event: CreateEventInput): Promise<Event> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const rawFamilyMemberId = event.familyMemberId ?? null;

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

  const raw: unknown = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Please sign in again.");
    }
    const body = errorResponseSchema.safeParse(raw);
    const message = body.success
      ? body.data.error
      : "Failed to add event";
    throw new Error(message);
  }

  return eventResponseSchema.parse(raw);
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

  const raw: unknown = await res.json();

  if (!res.ok) {
    if (res.status === 401) throw new Error("Please sign in again.");
    const body = errorResponseSchema.safeParse(raw);
    const message = body.success
      ? body.data.error
      : "Failed to delete event";
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
      queryClient.invalidateQueries({ queryKey: ["briefings"] });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: removeEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["briefings"] });
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
