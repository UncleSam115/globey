import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { Trip, TripMessage, InsertTrip } from "@shared/schema";

// --- Trips ---

export function useTrips() {
  return useQuery({
    queryKey: [api.trips.list.path],
    queryFn: async () => {
      const res = await fetch(api.trips.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch trips");
      return api.trips.list.responses[200].parse(await res.json());
    },
  });
}

export function useTrip(id: number) {
  return useQuery({
    queryKey: [api.trips.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.trips.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch trip");
      return api.trips.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertTrip) => {
      const res = await fetch(api.trips.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create trip");
      return api.trips.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.trips.list.path] });
      toast({ title: "Success", description: "Trip created successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create trip", variant: "destructive" });
    },
  });
}

// --- Messages / AI Chat ---

export function useTripMessages(tripId: number) {
  return useQuery({
    queryKey: [api.trips.messages.list.path, tripId],
    queryFn: async () => {
      const url = buildUrl(api.trips.messages.list.path, { id: tripId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.trips.messages.list.responses[200].parse(await res.json());
    },
    enabled: !!tripId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ tripId, content }: { tripId: number, content: string }) => {
      const url = buildUrl(api.trips.messages.create.path, { id: tripId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send message");
      return api.trips.messages.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: [api.trips.messages.list.path, tripId] });
      queryClient.invalidateQueries({ queryKey: [api.trips.get.path, tripId] }); // Trip might update
    },
  });
}
