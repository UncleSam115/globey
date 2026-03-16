import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/components/ThemeProvider";

import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import TripsList from "@/pages/TripsList";
import TripDetails from "@/pages/TripDetails";
import World from "@/pages/World";
import Profile from "@/pages/Profile";
import Bookings from "@/pages/Bookings";
import Checkout from "@/pages/Checkout";
import TripMap from "@/pages/TripMap";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/trips" component={TripsList} />
      <Route path="/trips/:id" component={TripDetails} />
      <Route path="/trips/:id/map" component={TripMap} />
      <Route path="/world" component={World} />
      <Route path="/profile" component={Profile} />
      <Route path="/bookings" component={Bookings} />
      <Route path="/checkout/:id" component={Checkout} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
