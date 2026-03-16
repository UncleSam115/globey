import { useParams, Link } from "wouter";
import { useEffect, useRef, useState, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { useTrip } from "@/hooks/use-trips";
import { useTripLocations, useMapboxToken, useDeleteTripLocation } from "@/hooks/use-trip-locations";
import { Loader2, Maximize, ArrowLeft, Plane, Hotel, MapPin, Trash2, X } from "lucide-react";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { TripLocation } from "@shared/schema";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const TYPE_CONFIG = {
  airport: { icon: Plane, label: "Airport", color: "#3B82F6", marker: "A" },
  hotel: { icon: Hotel, label: "Hotel", color: "#F59E0B", marker: "H" },
  activity: { icon: MapPin, label: "Activity", color: "#10B981", marker: "P" },
} as const;

function formatDate(d: Date | string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function TripMap() {
  const { id } = useParams();
  const tripId = Number(id);
  const { data: trip, isLoading: loadingTrip } = useTrip(tripId);
  const { data: locations = [], isLoading: loadingLocations } = useTripLocations(tripId);
  const { data: mapboxToken, isLoading: loadingToken } = useMapboxToken();
  const deleteMutation = useDeleteTripLocation(tripId);
  const { toast } = useToast();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showList, setShowList] = useState(true);

  const fitToAll = useCallback(() => {
    if (!mapRef.current || locations.length === 0) return;
    const bounds = new mapboxgl.LngLatBounds();
    locations.forEach((loc) => {
      bounds.extend([parseFloat(loc.lng), parseFloat(loc.lat)]);
    });
    mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 1000 });
  }, [locations]);

  const focusLocation = useCallback((loc: TripLocation) => {
    if (!mapRef.current) return;
    setSelectedId(loc.id);
    mapRef.current.flyTo({
      center: [parseFloat(loc.lng), parseFloat(loc.lat)],
      zoom: 13,
      duration: 800,
    });

    if (popupRef.current) popupRef.current.remove();
    const config = TYPE_CONFIG[loc.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.activity;
    const popupEl = document.createElement("div");
    popupEl.style.cssText = "font-family: 'Nunito', sans-serif; padding: 4px 0;";
    const titleEl = document.createElement("div");
    titleEl.style.cssText = "font-weight: 800; font-size: 14px; margin-bottom: 2px;";
    titleEl.textContent = loc.name;
    popupEl.appendChild(titleEl);
    if (loc.address) {
      const addrEl = document.createElement("div");
      addrEl.style.cssText = "font-size: 12px; color: #888;";
      addrEl.textContent = loc.address;
      popupEl.appendChild(addrEl);
    }
    const metaEl = document.createElement("div");
    metaEl.style.cssText = "font-size: 11px; color: #aaa; margin-top: 4px; text-transform: uppercase;";
    metaEl.textContent = `${config.label} · ${loc.source}`;
    popupEl.appendChild(metaEl);
    const popup = new mapboxgl.Popup({ offset: 25, closeButton: true })
      .setLngLat([parseFloat(loc.lng), parseFloat(loc.lat)])
      .setDOMContent(popupEl)
      .addTo(mapRef.current);
    popupRef.current = popup;
    popup.on("close", () => setSelectedId(null));
  }, []);

  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [0, 20],
      zoom: 2,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    locations.forEach((loc) => {
      const config = TYPE_CONFIG[loc.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.activity;

      const el = document.createElement("div");
      el.style.cssText = `
        width: 36px; height: 36px; border-radius: 50%;
        background: ${config.color}; border: 3px solid white;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; font-weight: 800; color: white;
        cursor: pointer; font-family: 'Nunito', sans-serif;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: transform 0.15s ease;
      `;
      el.textContent = config.marker;
      el.onmouseenter = () => { el.style.transform = "scale(1.2)"; };
      el.onmouseleave = () => { el.style.transform = "scale(1)"; };

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([parseFloat(loc.lng), parseFloat(loc.lat)])
        .addTo(mapRef.current!);

      el.addEventListener("click", () => focusLocation(loc));
      markersRef.current.push(marker);
    });

    if (locations.length > 0 && !selectedId) {
      setTimeout(() => fitToAll(), 300);
    }
  }, [locations, focusLocation, fitToAll, selectedId]);

  const handleDelete = async (loc: TripLocation) => {
    try {
      await deleteMutation.mutateAsync(loc.id);
      if (popupRef.current) popupRef.current.remove();
      setSelectedId(null);
      toast({ title: "Location removed" });
    } catch {
      toast({ title: "Failed to remove location", variant: "destructive" });
    }
  };

  if (loadingTrip || loadingToken) {
    return (
      <Layout className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </Layout>
    );
  }

  if (!trip) {
    return <Layout><div className="p-6 text-center text-muted-foreground">Trip not found</div></Layout>;
  }

  const dateRange = [formatDate(trip.startDate), formatDate(trip.endDate)].filter(Boolean).join(" – ");

  return (
    <Layout className="flex flex-col h-screen">
      <div className="p-3 border-b border-border bg-card sticky top-0 z-50" data-testid="trip-map-header">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link href={`/trips/${tripId}`}>
              <button className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0" data-testid="button-back-trip">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold text-foreground truncate" data-testid="text-trip-title">{trip.title}</h1>
              {dateRange && <p className="text-xs text-muted-foreground font-semibold">{dateRange}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => setShowList(!showList)}
              data-testid="button-toggle-list"
            >
              {showList ? <X className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={fitToAll}
              disabled={locations.length === 0}
              data-testid="button-fit-all"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        <div ref={mapContainerRef} className="flex-1 min-h-0" data-testid="map-container" />

        <AnimatePresence>
          {showList && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-80 max-w-[85%] bg-card border-l border-border overflow-y-auto z-10 shadow-xl md:relative md:w-80 md:max-w-none md:shadow-none"
              data-testid="locations-panel"
            >
              <div className="p-4">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Locations ({locations.length})
                </h2>

                {loadingLocations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : locations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No locations yet</p>
                    <p className="text-xs mt-1">Book a flight or add activities from your trip chat to see them here.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {locations.map((loc) => {
                      const config = TYPE_CONFIG[loc.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.activity;
                      const Icon = config.icon;
                      return (
                        <div
                          key={loc.id}
                          onClick={() => focusLocation(loc)}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border",
                            selectedId === loc.id
                              ? "bg-primary/10 border-primary/30"
                              : "bg-background border-transparent hover:bg-muted"
                          )}
                          data-testid={`location-item-${loc.id}`}
                        >
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white"
                            style={{ backgroundColor: config.color }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{loc.name}</p>
                            {loc.address && <p className="text-xs text-muted-foreground truncate mt-0.5">{loc.address}</p>}
                            <p className="text-xs text-muted-foreground/60 uppercase mt-1">{config.label} · {loc.source}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(loc); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                            data-testid={`button-delete-location-${loc.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
