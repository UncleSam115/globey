import { Layout } from "@/components/Layout";
import { useTrips } from "@/hooks/use-trips";
import { Link } from "wouter";
import { Loader2, ChevronRight, Calendar } from "lucide-react";

export default function TripsList() {
  const { data: trips, isLoading } = useTrips();

  if (isLoading) {
    return (
      <Layout className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-extrabold mb-8">My Trips</h1>
        
        <div className="grid gap-4">
          {trips?.map((trip) => (
            <Link key={trip.id} href={`/trips/${trip.id}`}>
              <div className="group bg-card p-5 rounded-2xl border-2 border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">{trip.title}</h3>
                    <p className="text-muted-foreground font-medium flex items-center gap-2">
                        {trip.destination}
                        {trip.status === 'booked' && (
                            <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Booked</span>
                        )}
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
                
                {trip.createdAt && (
                    <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground font-bold">
                        <Calendar className="w-3 h-3" />
                        Created {new Date(trip.createdAt).toLocaleDateString()}
                    </div>
                )}
              </div>
            </Link>
          ))}
          
          {trips?.length === 0 && (
            <div className="text-center py-12 bg-muted/30 rounded-3xl border-2 border-dashed border-border">
                <p className="text-muted-foreground font-bold">No trips yet.</p>
                <Link href="/">
                    <button className="text-primary font-bold mt-2 hover:underline">Start planning one!</button>
                </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
