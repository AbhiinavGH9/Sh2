import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type ProfileResponse, type UpdateProfileRequest } from "@shared/routes";
import { type Profile, type InsertProfile } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function useProfile() {
  return useQuery({
    queryKey: [api.profiles.get.path],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", api.profiles.get.path);
        return api.profiles.get.responses[200].parse(await res.json());
      } catch (err: any) {
        if (err.message.includes("401")) return null;
        throw err;
      }
    }
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      try {
        const res = await apiRequest(api.profiles.update.method, api.profiles.update.path, data);
        return api.profiles.update.responses[200].parse(await res.json());
      } catch (err: any) {
        throw new Error(err.message || "Failed to update profile");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.profiles.get.path] });
      toast({ title: "Success", description: "Profile updated successfully." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { firstName: string; profileImageUrl: string }) => {
      try {
        const res = await apiRequest("PUT", "/api/auth/user", data);
        return await res.json();
      } catch (err: any) {
        throw new Error(err.message || "Failed to update user identity");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Success", description: "Identity updated successfully." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}
