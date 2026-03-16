import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { TripLocation } from "@shared/schema";

export function useTripLocations(tripId: number | undefined) {
  return useQuery<TripLocation[]>({
    queryKey: ["/api/trips", tripId, "locations"],
    queryFn: async () => {
      if (!tripId) return [];
      const res = await fetch(`/api/trips/${tripId}/locations`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch locations");
      return res.json();
    },
    enabled: !!tripId,
  });
}

export function useAddTripLocation(tripId: number | undefined) {
  return useMutation({
    mutationFn: async (data: {
      type: "airport" | "hotel" | "activity";
      name: string;
      lat: string;
      lng: string;
      address?: string;
      source?: "flight" | "hotel" | "ai" | "manual";
      metadata?: any;
    }) => {
      const res = await apiRequest("POST", `/api/trips/${tripId}/locations`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "locations"] });
    },
  });
}

export function useDeleteTripLocation(tripId: number | undefined) {
  return useMutation({
    mutationFn: async (locationId: number) => {
      await apiRequest("DELETE", `/api/trips/${tripId}/locations/${locationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "locations"] });
    },
  });
}

export function useMapboxToken() {
  return useQuery<string>({
    queryKey: ["/api/mapbox/token"],
    queryFn: async () => {
      const res = await fetch("/api/mapbox/token", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch Mapbox token");
      const data = await res.json();
      return data.token;
    },
    staleTime: Infinity,
  });
}
