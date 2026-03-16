import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Loader2, Plane } from "lucide-react";
import { Button } from "./Button";
import { FlightCard, type FlightOffer } from "./FlightCard";
import { DateSwitcher } from "./DateSwitcher";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { TripMessage } from "@shared/schema";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: string;
}

interface ChatInterfaceProps {
  messages: TripMessage[];
  onSend: (content: string) => void;
  isLoading: boolean;
  tripId?: number;
}

export function ChatInterface({ messages, onSend, isLoading, tripId }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<FlightOffer | null>(null);
  const [selectingOffer, setSelectingOffer] = useState(false);
  const [selectionToken, setSelectionToken] = useState<string | null>(null);
  const [creatingPayment, setCreatingPayment] = useState(false);

  const [dateCache, setDateCache] = useState<Record<string, FlightOffer[]>>({});
  const [activeDateOverride, setActiveDateOverride] = useState<string | null>(null);
  const [dateSwitcherLoading, setDateSwitcherLoading] = useState(false);
  const [activeSearchParams, setActiveSearchParams] = useState<SearchParams | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    setSelectedOffer(null);
    setSelectionToken(null);
    setActiveDateOverride(null);
    setDateCache({});
    setActiveSearchParams(null);
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput("");
  };

  const handleSelectFlight = async (offer: FlightOffer) => {
    if (selectingOffer) return;

    if (selectedOffer?.offer_id === offer.offer_id) {
      setSelectedOffer(null);
      setSelectionToken(null);
      return;
    }

    setSelectingOffer(true);
    try {
      const res = await fetch("/api/flights/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer_id: offer.offer_id, trip_id: tripId }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Flight unavailable",
          description: data.message || "This flight is no longer available.",
          variant: "destructive",
        });
        return;
      }

      setSelectedOffer(offer);
      setSelectionToken(data.selection_token);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to select flight. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSelectingOffer(false);
    }
  };

  const handleContinueToBooking = async () => {
    if (!selectionToken || creatingPayment) return;
    setCreatingPayment(true);

    try {
      const res = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selection_token: selectionToken, trip_id: tripId }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Payment error",
          description: data.message || "Failed to create payment. Please try again.",
          variant: "destructive",
        });
        return;
      }

      navigate(`/checkout/${data.bookingId}`);
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleDateChange = useCallback(async (newDate: string) => {
    if (!activeSearchParams) return;

    setSelectedOffer(null);
    setSelectionToken(null);
    setActiveDateOverride(newDate);

    if (dateCache[newDate]) {
      return;
    }

    setDateSwitcherLoading(true);
    try {
      const res = await fetch("/api/flights/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: activeSearchParams.origin,
          destination: activeSearchParams.destination,
          departureDate: newDate,
          returnDate: activeSearchParams.returnDate,
          passengers: activeSearchParams.passengers,
          cabinClass: activeSearchParams.cabinClass,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const errData = await res.json();
        toast({
          title: "Search failed",
          description: errData.message || "Could not fetch flights for this date.",
          variant: "destructive",
        });
        setDateCache((prev) => ({ ...prev, [newDate]: [] }));
        return;
      }

      const data = await res.json();
      const validOffers = (data.offers || []).filter(
        (o: any) => o.offer_id && o.provider === "duffel"
      );

      setDateCache((prev) => ({ ...prev, [newDate]: validOffers }));
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to fetch flights. Please try again.",
        variant: "destructive",
      });
      setDateCache((prev) => ({ ...prev, [newDate]: [] }));
    } finally {
      setDateSwitcherLoading(false);
    }
  }, [activeSearchParams, dateCache, toast]);

  const getFlightOffers = (msg: TripMessage): FlightOffer[] => {
    const meta = msg.metadata as any;
    if (!meta || meta.type !== "flight_results" || !Array.isArray(meta.offers)) return [];
    return meta.offers.filter(
      (o: any) => o.offer_id && o.provider === "duffel"
    );
  };

  const getSearchParams = (msg: TripMessage): SearchParams | null => {
    const meta = msg.metadata as any;
    if (!meta || meta.type !== "flight_results" || !meta.searchParams) return null;
    return meta.searchParams as SearchParams;
  };

  const lastFlightMessageIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (getFlightOffers(messages[i]).length > 0) return i;
    }
    return -1;
  })();

  useEffect(() => {
    if (lastFlightMessageIdx >= 0) {
      const params = getSearchParams(messages[lastFlightMessageIdx]);
      if (params) {
        setActiveSearchParams(params);
        const originalOffers = getFlightOffers(messages[lastFlightMessageIdx]);
        setDateCache((prev) => {
          if (!prev[params.departureDate]) {
            return { ...prev, [params.departureDate]: originalOffers };
          }
          return prev;
        });
      }
    }
  }, [lastFlightMessageIdx, messages]);

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide pb-24" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Plan your next adventure</h3>
            <p>Tell me where you want to go, or ask for inspiration!</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          const originalOffers = !isUser ? getFlightOffers(msg) : [];
          const isLatestFlightMsg = idx === lastFlightMessageIdx;
          const searchParams = !isUser ? getSearchParams(msg) : null;

          const currentDate = isLatestFlightMsg && activeDateOverride
            ? activeDateOverride
            : searchParams?.departureDate || null;

          const displayOffers = isLatestFlightMsg && activeDateOverride && dateCache[activeDateOverride]
            ? dateCache[activeDateOverride]
            : originalOffers;

          const showDateSwitcher = isLatestFlightMsg && searchParams && originalOffers.length > 0;

          return (
            <div key={msg.id || idx}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex w-full",
                  isUser ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] px-5 py-3 rounded-2xl text-base leading-relaxed shadow-sm border border-transparent",
                    isUser 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-card border-border text-foreground rounded-tl-none"
                  )}
                >
                  {isUser ? (
                    msg.content
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-foreground prose-a:text-primary prose-a:font-bold prose-a:no-underline hover:prose-a:underline">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" data-testid="link-chat">
                              {children}
                            </a>
                          ),
                        }}
                      >{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.div>

              {originalOffers.length > 0 && (
                <div className="mt-3 space-y-2 max-w-[95%] ml-0" data-testid="flight-results-container">
                  {showDateSwitcher && currentDate && (
                    <DateSwitcher
                      activeDate={currentDate}
                      onDateChange={handleDateChange}
                      isLoading={dateSwitcherLoading}
                      origin={searchParams!.origin}
                      destination={searchParams!.destination}
                    />
                  )}

                  {dateSwitcherLoading && isLatestFlightMsg ? (
                    <div className="flex items-center justify-center py-8" data-testid="flight-loading">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm font-medium">Searching flights...</span>
                      </div>
                    </div>
                  ) : displayOffers.length === 0 && isLatestFlightMsg && activeDateOverride ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center" data-testid="flight-empty">
                      <Plane className="w-8 h-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground font-medium">No flights found for this date</p>
                      <p className="text-xs text-muted-foreground mt-1">Try another date using the arrows above</p>
                    </div>
                  ) : (
                    displayOffers.map((offer, oi) => (
                      <FlightCard
                        key={offer.offer_id}
                        offer={offer}
                        selected={selectedOffer?.offer_id === offer.offer_id}
                        onClick={handleSelectFlight}
                        disabled={selectingOffer || creatingPayment || !isLatestFlightMsg}
                        index={oi}
                      />
                    ))
                  )}

                  {isLatestFlightMsg && selectedOffer && selectionToken && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-2"
                    >
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full rounded-2xl text-base font-bold py-4"
                        onClick={handleContinueToBooking}
                        disabled={creatingPayment}
                        data-testid="button-continue-booking"
                      >
                        {creatingPayment ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating payment...
                          </>
                        ) : (
                          `Book for ${selectedOffer.total_amount} ${selectedOffer.currency.toUpperCase()}`
                        )}
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
             <div className="bg-card dark:bg-card px-5 py-4 rounded-2xl rounded-tl-none border border-border shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
             </div>
          </motion.div>
        )}
      </div>

      <div className="absolute bottom-4 left-0 right-0 px-4 md:px-0 bg-gradient-to-t from-background via-background to-transparent pt-10">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end max-w-4xl mx-auto">
          <div className="relative flex-1">
             <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Where to next?"
              className="w-full pl-5 pr-4 py-4 rounded-2xl border-2 border-border bg-card dark:bg-card shadow-lg focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-medium text-lg placeholder:text-muted-foreground/50"
              disabled={isLoading}
              data-testid="input-chat-message"
            />
          </div>
          <Button 
            type="submit" 
            size="lg" 
            variant="primary" 
            className="h-[60px] w-[60px] rounded-2xl px-0 shrink-0 shadow-lg"
            disabled={!input.trim() || isLoading}
            data-testid="button-send-message"
          >
            <Send className="w-6 h-6" />
          </Button>
        </form>
      </div>
    </div>
  );
}
