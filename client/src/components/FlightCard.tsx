import { cn } from "@/lib/utils";
import { Plane, Clock, ArrowRight, Check, Luggage, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface Segment {
  marketing_airline: string;
  flight_number: string;
  departing_at: string;
  arriving_at: string;
  origin_iata: string;
  destination_iata: string;
  stops: number;
}

interface Slice {
  origin: { iata: string; time: string; city?: string };
  destination: { iata: string; time: string; city?: string };
  duration_minutes: number;
  segments: Segment[];
}

export interface FlightOffer {
  offer_id: string;
  total_amount: string;
  currency: string;
  slices: Slice[];
  refundable: boolean;
  changeable: boolean;
  cabin_class: string;
  baggage: { carry_on: boolean; checked: string };
  provider: "duffel";
  airline: string;
  airline_logo: string | null;
  expires_at: string;
  created_at: string;
}

interface FlightCardProps {
  offer: FlightOffer;
  selected?: boolean;
  onClick: (offer: FlightOffer) => void;
  disabled?: boolean;
  index: number;
}

function formatTime(dateStr: string): string {
  if (!dateStr) return "--:--";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDuration(mins: number): string {
  if (!mins) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function formatCurrency(amount: string, currency: string): string {
  const num = parseFloat(amount);
  const symbols: Record<string, string> = { GBP: "£", USD: "$", EUR: "€", SAR: "﷼" };
  const sym = symbols[currency?.toUpperCase()] || currency + " ";
  return `${sym}${num.toFixed(2)}`;
}

function stopsLabel(count: number): string {
  if (count === 0) return "Non-stop";
  if (count === 1) return "1 stop";
  return `${count} stops`;
}

export function FlightCard({ offer, selected, onClick, disabled, index }: FlightCardProps) {
  if (!offer.offer_id || offer.provider !== "duffel") return null;

  const slice = offer.slices[0];
  if (!slice) return null;

  const totalStops = Math.max(0, (slice.segments?.length || 1) - 1);

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      type="button"
      onClick={() => !disabled && onClick(offer)}
      disabled={disabled}
      data-testid={`flight-card-${offer.offer_id}`}
      className={cn(
        "w-full text-left p-4 rounded-2xl border-2 transition-all duration-200",
        "bg-card hover:shadow-md",
        selected
          ? "border-primary ring-2 ring-primary/20 shadow-md"
          : "border-border hover:border-primary/40",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {offer.airline_logo && (
            <img src={offer.airline_logo} alt={offer.airline} className="w-6 h-6 rounded" />
          )}
          <span className="font-bold text-sm text-foreground" data-testid={`text-airline-${offer.offer_id}`}>
            {offer.airline}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold text-primary" data-testid={`text-price-${offer.offer_id}`}>
            {formatCurrency(offer.total_amount, offer.currency)}
          </span>
          {selected && (
            <span className="bg-primary text-primary-foreground rounded-full p-1">
              <Check className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <div className="text-center min-w-[60px]">
          <div className="text-base font-bold text-foreground">{formatTime(slice.origin.time)}</div>
          <div className="text-xs font-semibold text-muted-foreground">{slice.origin.iata}</div>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <div className="text-xs text-muted-foreground font-medium mb-1">
            {formatDuration(slice.duration_minutes)}
          </div>
          <div className="w-full flex items-center gap-1">
            <div className="h-[2px] flex-1 bg-border" />
            <Plane className="w-3 h-3 text-primary shrink-0" />
            <div className="h-[2px] flex-1 bg-border" />
          </div>
          <div className="text-xs text-muted-foreground mt-1">{stopsLabel(totalStops)}</div>
        </div>

        <div className="text-center min-w-[60px]">
          <div className="text-base font-bold text-foreground">{formatTime(slice.destination.time)}</div>
          <div className="text-xs font-semibold text-muted-foreground">{slice.destination.iata}</div>
        </div>
      </div>

      {offer.slices.length > 1 && (
        <div className="flex items-center gap-3 mb-2 pt-2 border-t border-border/50">
          {(() => {
            const returnSlice = offer.slices[1];
            const returnStops = Math.max(0, (returnSlice.segments?.length || 1) - 1);
            return (
              <>
                <div className="text-center min-w-[60px]">
                  <div className="text-base font-bold text-foreground">{formatTime(returnSlice.origin.time)}</div>
                  <div className="text-xs font-semibold text-muted-foreground">{returnSlice.origin.iata}</div>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="text-xs text-muted-foreground font-medium mb-1">
                    {formatDuration(returnSlice.duration_minutes)}
                  </div>
                  <div className="w-full flex items-center gap-1">
                    <div className="h-[2px] flex-1 bg-border" />
                    <Plane className="w-3 h-3 text-primary shrink-0 rotate-180" />
                    <div className="h-[2px] flex-1 bg-border" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{stopsLabel(returnStops)}</div>
                </div>
                <div className="text-center min-w-[60px]">
                  <div className="text-base font-bold text-foreground">{formatTime(returnSlice.destination.time)}</div>
                  <div className="text-xs font-semibold text-muted-foreground">{returnSlice.destination.iata}</div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
        <span className="capitalize">{offer.cabin_class}</span>
        {offer.baggage.checked !== "0pc" && (
          <span className="flex items-center gap-1"><Luggage className="w-3 h-3" /> {offer.baggage.checked}</span>
        )}
        {offer.refundable && (
          <span className="flex items-center gap-1 text-green-600"><RefreshCw className="w-3 h-3" /> Refundable</span>
        )}
        {slice.segments?.[0]?.flight_number && (
          <span>{slice.segments[0].flight_number}</span>
        )}
      </div>
    </motion.button>
  );
}
