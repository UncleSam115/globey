import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Loader2, Plane, CheckCircle, Clock, AlertCircle, Ticket } from "lucide-react";
import { Button } from "@/components/Button";
import type { FlightBooking } from "@shared/schema";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  booked: { label: "Confirmed", icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
  payment_pending: { label: "Payment Pending", icon: Clock, color: "text-amber-600 dark:text-amber-400" },
  failed: { label: "Failed", icon: AlertCircle, color: "text-destructive" },
  cancelled: { label: "Cancelled", icon: AlertCircle, color: "text-muted-foreground" },
};

export default function Bookings() {
  const [, setLocation] = useLocation();

  const { data: bookings = [], isLoading } = useQuery<FlightBooking[]>({
    queryKey: ["/api/bookings"],
  });

  if (isLoading) {
    return (
      <Layout className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-extrabold mb-6" data-testid="bookings-title">My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="text-center py-16" data-testid="no-bookings">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ticket className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">No bookings yet</h2>
            <p className="text-muted-foreground mb-6">
              Start chatting with the AI to find and book flights!
            </p>
            <Button onClick={() => setLocation("/")} data-testid="button-start-chat">
              Start Planning
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking, idx) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                index={idx}
                onClick={() => {
                  if (booking.status === "payment_pending") {
                    setLocation(`/checkout/${booking.id}`);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function BookingCard({ booking, index, onClick }: { booking: FlightBooking; index: number; onClick: () => void }) {
  const details = booking.flightDetails as any;
  const status = statusConfig[booking.status] || statusConfig.failed;
  const StatusIcon = status.icon;
  const amountFormatted = (booking.amount / 100).toFixed(2);
  const isClickable = booking.status === "payment_pending";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div
        className={cn(
          "bg-card rounded-xl border border-border p-4 transition-all",
          isClickable && "cursor-pointer hover:border-primary/30"
        )}
        onClick={isClickable ? onClick : undefined}
        data-testid={`booking-card-${booking.id}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Plane className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground truncate" data-testid={`text-booking-route-${booking.id}`}>
                {details?.summary || `${details?.origin || "?"} to ${details?.destination || "?"}`}
              </p>
              {details?.airline && (
                <p className="text-sm text-muted-foreground">{details.airline}</p>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="font-bold text-foreground" data-testid={`text-booking-amount-${booking.id}`}>
              {booking.currency.toUpperCase()} {amountFormatted}
            </p>
            <div className={cn("flex items-center gap-1 text-xs font-medium mt-1", status.color)}>
              <StatusIcon className="w-3.5 h-3.5" />
              <span data-testid={`text-booking-status-${booking.id}`}>{status.label}</span>
            </div>
          </div>
        </div>

        {booking.duffelBookingReference && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Ref: <span className="font-mono font-bold">{booking.duffelBookingReference}</span>
            </p>
          </div>
        )}

        {isClickable && (
          <div className="mt-3 pt-3 border-t border-border">
            <Button size="sm" fullWidth data-testid={`button-complete-payment-${booking.id}`}>
              Complete Payment
            </Button>
          </div>
        )}

        {booking.createdAt && (
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(booking.createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
      </div>
    </motion.div>
  );
}
