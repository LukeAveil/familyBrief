import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FamilyMember } from "@/types";
import { getAccessToken } from "@/services/authClient";

async function fetchFamilyMembers(): Promise<FamilyMember[]> {
  const token = await getAccessToken();

  const res = await fetch("/api/family-members", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.status === 401) {
    return [];
  }

  if (!res.ok) {
    throw new Error("Failed to load family members");
  }
  return res.json();
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

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.error ?? "Failed to add family member";
    throw new Error(message);
  }

  return res.json();
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
