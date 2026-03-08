import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type Group, type CreateGroupRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function useGroups() {
  return useQuery({
    queryKey: [api.groups.list.path],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", api.groups.list.path);
        return api.groups.list.responses[200].parse(await res.json());
      } catch (err: any) {
        throw new Error(err.message || "Failed to fetch groups");
      }
    },
    refetchInterval: 5000,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateGroupRequest) => {
      try {
        const res = await apiRequest(api.groups.create.method, api.groups.create.path, data);
        return api.groups.create.responses[201].parse(await res.json());
      } catch (err: any) {
        throw new Error(err.message || "Failed to create group");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
      toast({ title: "Group Created", description: "Your secure channel is ready." });
    },
    onError: (err: any) => {
      toast({ title: "Creation Failed", description: err.message, variant: "destructive" });
    }
  });
} export function useDeleteGroup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (groupId: number) => {
      try {
        const res = await apiRequest("DELETE", `/api/groups/${groupId}`);
        if (!res.ok) {
          const errorPayload = await res.json().catch(() => ({}));
          throw new Error(errorPayload.message || "Failed to delete group");
        }
      } catch (err: any) {
        throw new Error(err.message || "Failed to delete group");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
      toast({ title: "Signal Terminated", description: "Channel has been permanently deleted." });
    },
    onError: (err) => {
      toast({ title: "Deletion Failed", description: err.message, variant: "destructive" });
    }
  });
}
