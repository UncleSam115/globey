import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertVisitedCountry } from "@shared/schema";

export function useWorldStats() {
  return useQuery({
    queryKey: [api.world.stats.path],
    queryFn: async () => {
      const res = await fetch(api.world.stats.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.world.stats.responses[200].parse(await res.json());
    },
  });
}

export function useVisitedCountries() {
  return useQuery({
    queryKey: [api.world.visited.list.path],
    queryFn: async () => {
      const res = await fetch(api.world.visited.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch visited countries");
      return api.world.visited.list.responses[200].parse(await res.json());
    },
  });
}

export function useAddVisitedCountry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertVisitedCountry) => {
      const res = await fetch(api.world.visited.add.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add country");
      return api.world.visited.add.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.world.visited.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.world.stats.path] });
      toast({ title: "Success", description: "Country added to your map!" });
    },
  });
}

export function useRemoveVisitedCountry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (countryCode: string) => {
      const url = buildUrl(api.world.visited.delete.path, { countryCode });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to remove country");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.world.visited.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.world.stats.path] });
      toast({ title: "Removed", description: "Country removed from map." });
    },
  });
}
