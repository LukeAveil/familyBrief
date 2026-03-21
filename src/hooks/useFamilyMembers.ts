import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FamilyMember } from "@/types";
import {
  errorResponseSchema,
  familyMemberListResponseSchema,
  familyMemberResponseSchema,
} from "@/lib/api/schemas";
import { getAccessToken } from "@/services/authClient";

async function fetchFamilyMembers(): Promise<FamilyMember[]> {
  const token = await getAccessToken();

  const res = await fetch("/api/family-members", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const raw: unknown = await res.json();

  if (res.status === 401) {
    return [];
  }

  if (!res.ok) {
    throw new Error("Failed to load family members");
  }
  return familyMemberListResponseSchema.parse(raw);
}

async function createFamilyMember(input: {
  name: string;
  role: "parent" | "child";
  age?: number;
  color: string;
}): Promise<FamilyMember> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch("/api/family-members", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const raw: unknown = await res.json();

  if (!res.ok) {
    const body = errorResponseSchema.safeParse(raw);
    const message = body.success
      ? body.data.error
      : "Failed to add family member";
    throw new Error(message);
  }

  return familyMemberResponseSchema.parse(raw);
}

export function useFamilyMembers() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<FamilyMember[], Error>({
    queryKey: ["familyMembers"],
    queryFn: fetchFamilyMembers,
  });

  const addMemberMutation = useMutation({
    mutationFn: createFamilyMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["familyMembers"] });
    },
  });

  return {
    members: data ?? [],
    loading: isLoading,
    error,
    refetch,
    addMember: addMemberMutation.mutateAsync,
    adding: addMemberMutation.isPending,
  };
}
