import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/Button";
import { Loader2, CheckCircle, AlertCircle, Plane, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { FlightBooking } from "@shared/schema";

let stripePromise: ReturnType<typeof loadStripe> | null = null;

function getStripePromise() {
  if (!stripePromise) {
    stripePromise = fetch("/api/stripe/publishable-key", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => loadStripe(data.publishableKey));
  }
  return stripePromise;
}

function PaymentForm({ booking, onSuccess }: { booking: FlightBooking; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { toast } = useToast();

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bookings/${booking.id}/confirm`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to confirm booking");
      }
      return res.json();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMsg(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: window.location.href,
      },
    });

    if (error) {
      setErrorMsg(error.message || "Payment failed. Please try again.");
      setIsProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      try {
        await confirmMutation.mutateAsync();
        toast({ title: "Booking Confirmed!", description: "Your flight has been booked successfully." });
        onSuccess();
      } catch (err: any) {
        setErrorMsg(err.message || "Payment succeeded but booking confirmation failed. Contact support.");
        setIsProcessing(false);
      }
    } else {
      setErrorMsg("Payment was not completed. Please try again.");
      setIsProcessing(false);
    }
  };

  const details = booking.flightDetails as any;
  const amountFormatted = (booking.amount / 100).toFixed(2);

  const getFlightSummary = () => {
    if (details?.slices && details.slices.length > 0) {
      const s = details.slices[0];
      return `${s.origin?.iata || "?"} to ${s.destination?.iata || "?"}`;
    }
    return details?.summary || `${details?.origin || "?"} to ${details?.destination || "?"}`;
  };

  const getAirline = () => details?.airline || "";

  const getDepartureTime = () => {
    if (details?.slices?.[0]?.origin?.time) {
      return new Date(details.slices[0].origin.time).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    }
    return details?.departureTime || "";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-card rounded-xl border border-border p-5" data-testid="flight-summary-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Plane className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground truncate" data-testid="text-flight-summary">
              {getFlightSummary()}
            </p>
            {getAirline() && (
              <p className="text-sm text-muted-foreground">{getAirline()}</p>
            )}
          </div>
        </div>
        {getDepartureTime() && (
          <p className="text-sm text-muted-foreground">
            Departure: {getDepartureTime()}
          </p>
        )}
        <div className="mt-3 pt-3 border-t border-border flex justify-between items-center gap-2">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-extrabold text-foreground" data-testid="text-total-amount">
            {booking.currency.toUpperCase()} {amountFormatted}
          </span>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5" data-testid="payment-element-container">
        <PaymentElement />
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20" data-testid="payment-error">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      <Button
        type="submit"
        fullWidth
        size="lg"
        disabled={!stripe || isProcessing}
        className="text-lg"
        data-testid="button-pay"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${booking.currency.toUpperCase()} ${amountFormatted}`
        )}
      </Button>
    </form>
  );
}

export default function Checkout() {
  const { id } = useParams();
  const bookingId = Number(id);
  const [, setLocation] = useLocation();
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const { data: booking, isLoading, error } = useQuery<FlightBooking>({
    queryKey: ["/api/bookings", bookingId],
    queryFn: async () => {
      const res = await fetch(`/api/bookings/${bookingId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Booking not found");
      return res.json();
    },
    enabled: !!bookingId,
  });

  if (isLoading) {
    return (
      <Layout className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </Layout>
    );
  }

  if (error || !booking) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Booking Not Found</h2>
          <p className="text-muted-foreground mb-6">This booking doesn't exist or you don't have access to it.</p>
          <Button onClick={() => setLocation("/")} data-testid="button-go-home">Go Home</Button>
        </div>
      </Layout>
    );
  }

  if (paymentSuccess || booking.status === "booked") {
    const details = booking.flightDetails as any;
    return (
      <Layout>
        <div className="p-6 text-center max-w-md mx-auto" data-testid="booking-success">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-extrabold mb-2">Booking Confirmed!</h2>
          <p className="text-muted-foreground mb-6">
            {details?.summary || "Your flight has been booked successfully."}
          </p>
          {booking.duffelBookingReference && (
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
              <p className="text-sm text-muted-foreground">Booking Reference</p>
              <p className="text-lg font-bold font-mono" data-testid="text-booking-reference">{booking.duffelBookingReference}</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Button onClick={() => setLocation("/bookings")} fullWidth data-testid="button-view-bookings">
              View My Bookings
            </Button>
            <Button variant="outline" onClick={() => setLocation("/")} fullWidth data-testid="button-back-home">
              Back to Chat
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 max-w-lg mx-auto">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 font-medium"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-2xl font-extrabold mb-6" data-testid="checkout-title">Complete Payment</h1>

        <CheckoutWithElements booking={booking} onSuccess={() => setPaymentSuccess(true)} />
      </div>
    </Layout>
  );
}

function CheckoutWithElements({ booking, onSuccess }: { booking: FlightBooking; onSuccess: () => void }) {
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const stripe = await getStripePromise();
        if (cancelled) return;
        setStripeInstance(stripe);

        const res = await fetch(`/api/bookings/${booking.id}/client-secret`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to get payment details");
        const data = await res.json();
        if (cancelled) return;
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [booking.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stripeInstance || !clientSecret) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
        <p className="text-muted-foreground">{error || "Unable to load payment form."}</p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripeInstance}
      options={{
        clientSecret,
        appearance: {
          theme: document.documentElement.classList.contains("dark") ? "night" : "stripe",
          variables: {
            borderRadius: "12px",
          },
        },
      }}
    >
      <PaymentForm booking={booking} onSuccess={onSuccess} />
    </Elements>
  );
}
