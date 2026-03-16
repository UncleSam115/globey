import { useParams, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { ChatInterface } from "@/components/ChatInterface";
import { useTrip, useTripMessages, useSendMessage } from "@/hooks/use-trips";
import { Loader2, Calendar, MapPin, CheckCircle, Map } from "lucide-react";

export default function TripDetails() {
  const { id } = useParams();
  const tripId = Number(id);
  
  const { data: trip, isLoading: loadingTrip } = useTrip(tripId);
  const { data: messages = [], isLoading: loadingMessages } = useTripMessages(tripId);
  const { mutate: sendMessage, isPending: sending } = useSendMessage();

  if (loadingTrip) {
    return (
      <Layout className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </Layout>
    );
  }

  if (!trip) return <Layout><div className="p-6 text-center text-muted-foreground">Trip not found</div></Layout>;

  const isBooked = trip.status === "booked";

  return (
    <Layout className="flex flex-col h-screen md:h-auto">
      <div className="p-4 border-b border-border bg-card sticky top-0 z-50" data-testid="trip-header">
        <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
                <h1 className="text-xl font-extrabold text-foreground truncate" data-testid="text-trip-title">{trip.title}</h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground font-semibold flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {trip.destination}</span>
                    {trip.startDate && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Planned</span>}
                    {isBooked && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" /> Booked
                      </span>
                    )}
                </div>
            </div>
            <Link href={`/trips/${tripId}/map`}>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-bold shrink-0" data-testid="button-trip-map">
                <Map className="w-4 h-4" />
                Map
              </button>
            </Link>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <ChatInterface 
          messages={messages} 
          onSend={(content) => sendMessage({ tripId, content })}
          isLoading={sending}
          tripId={tripId}
        />
      </div>
    </Layout>
  );
}
