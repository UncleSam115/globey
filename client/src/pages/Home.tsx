import { useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { ChatInterface } from "@/components/ChatInterface";
import { useCreateTrip, useTripMessages, useSendMessage } from "@/hooks/use-trips";
import { Button } from "@/components/Button";
import { Plus } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  
  // For MVP simplification: We'll have a "Main" planning thread or just create a new trip immediately.
  // Let's assume we create a default "General Planning" trip or just redirect to a new trip flow.
  // Better yet, Home lists active chats or has a big "Start Planning" button.
  
  const { mutate: createTrip, isPending: isCreating } = useCreateTrip();

  const handleStartPlanning = () => {
    createTrip({
      title: "New Adventure",
      destination: "Anywhere",
      status: "draft",
    }, {
      onSuccess: (trip) => {
        setLocation(`/trips/${trip.id}`);
      }
    });
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-80px)] md:h-screen justify-center items-center p-6 text-center">
        <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-8 animate-in zoom-in duration-500">
           <img 
             src="https://cdn-icons-png.flaticon.com/512/201/201623.png" 
             alt="Travel" 
             className="w-16 h-16 opacity-80" 
           />
           {/* Fallback icon if image fails or for cleaner look */}
           {/* <Map className="w-16 h-16 text-primary" /> */}
        </div>
        
        <h1 className="text-3xl font-extrabold mb-4">Ready to explore?</h1>
        <p className="text-muted-foreground max-w-sm mb-10">Start a new chat to plan your next trip, discover destinations, or build an itinerary.</p>
        
        <Button 
          size="lg" 
          onClick={handleStartPlanning} 
          disabled={isCreating}
          className="w-full max-w-sm h-16 text-lg shadow-xl"
        >
           {isCreating ? "Creating..." : "Start New Plan"}
           <Plus className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </Layout>
  );
}
