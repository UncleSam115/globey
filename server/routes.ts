import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { openai } from "./replit_integrations/chat/routes";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { searchFlights, getOffer, type FlightSearchParams, type NormalizedOffer } from "./duffelClient";
import { getAirportByIata } from "./airportCoordinates";
import crypto from "crypto";

function generateSelectionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);
  registerImageRoutes(app);

  // --- Trips ---
  app.get(api.trips.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const trips = await storage.getUserTrips(userId);
    res.json(trips);
  });

  app.post(api.trips.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.trips.create.input.parse(req.body);
      const trip = await storage.createTrip({ ...input, userId: req.user.claims.sub });
      res.status(201).json(trip);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.trips.get.path, isAuthenticated, async (req: any, res) => {
    const trip = await storage.getTrip(Number(req.params.id));
    if (!trip || trip.userId !== req.user.claims.sub) {
      return res.status(404).json({ message: "Trip not found" });
    }
    res.json(trip);
  });

  // --- Messages & AI Planning ---
  app.get(api.trips.messages.list.path, isAuthenticated, async (req: any, res) => {
    const tripId = Number(req.params.id);
    const trip = await storage.getTrip(tripId);
    if (!trip || trip.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Trip not found" });
    }
    const messages = await storage.getTripMessages(tripId);
    res.json(messages);
  });

  app.post(api.trips.messages.create.path, isAuthenticated, async (req: any, res) => {
     try {
        const tripId = Number(req.params.id);
        const trip = await storage.getTrip(tripId);
        if (!trip || trip.userId !== req.user.claims.sub) {
            return res.status(404).json({ message: "Trip not found" });
        }
        
        const input = api.trips.messages.create.input.parse(req.body);
        const userMessage = await storage.createMessage({
            tripId,
            role: 'user',
            content: input.content
        });

        const history = await storage.getTripMessages(tripId);
        const messagesForAI = history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

        const tools: any[] = [
          {
            type: "function",
            function: {
              name: "search_flights",
              description: "Search for available flights between two airports or cities. Use this when the user asks about flights, airfare, or flying somewhere. Use IATA airport codes (e.g. JFK, LHR, DXB) or city codes.",
              parameters: {
                type: "object",
                properties: {
                  origin: { type: "string", description: "Origin IATA airport or city code (e.g. JFK, LHR, NYC)" },
                  destination: { type: "string", description: "Destination IATA airport or city code (e.g. CDG, DXB, LON)" },
                  departureDate: { type: "string", description: "Departure date in YYYY-MM-DD format" },
                  returnDate: { type: "string", description: "Return date in YYYY-MM-DD format (optional for one-way)" },
                  passengers: { type: "number", description: "Number of adult passengers", default: 1 },
                  cabinClass: { type: "string", enum: ["economy", "premium_economy", "business", "first"], default: "economy" },
                },
                required: ["origin", "destination", "departureDate"],
              },
            },
          },
        ];

        const systemPrompt = `You are Globey, a friendly and enthusiastic travel assistant. You help users plan amazing trips.

Key behaviors:
- Be warm, concise, and helpful. Use markdown formatting for readability.
- When users mention specific destinations or ask about flights, use the search_flights tool to find real options.
- If the user hasn't specified dates, ask them for approximate travel dates before searching.
- If the user hasn't specified origin, ask where they're flying from.
- You can also help with itineraries, travel tips, visa information, packing lists, and general travel advice.
- Keep responses organized with headers and bullet points.
- Today's date is ${new Date().toISOString().split('T')[0]}.

CRITICAL FLIGHT RULES:
- NEVER write, describe, list, or format individual flight details (airline names, times, prices, flight numbers) in your text response.
- When the search_flights tool returns results, the UI will automatically display clickable flight cards to the user.
- Your text response after a flight search should ONLY say something like "I found X flights for you! Take a look at the options below and tap the one you'd like to book." 
- If the search returns no results, say "No flights found" and suggest adjusting dates or airports.
- NEVER invent or fabricate flight information. You can ONLY reference flights returned by the search_flights tool.
- Do NOT describe flight details like "Flight 1: BA123 departing at 10am..." — the cards handle that.
- You do NOT handle booking. The user selects a flight card in the UI, which handles payment automatically.`;

        let completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                ...messagesForAI
            ],
            tools,
            tool_choice: "auto",
        });

        let assistantMsg = completion.choices[0].message;
        let flightOffers: NormalizedOffer[] = [];
        let flightSearchParams: any = null;

        if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
            const toolResults: any[] = [
              { role: "system", content: systemPrompt },
              ...messagesForAI,
              assistantMsg,
            ];

            for (const toolCall of assistantMsg.tool_calls) {
              const tc = toolCall as any;
              if (tc.function?.name === "search_flights") {
                try {
                  const args = JSON.parse(tc.function.arguments);
                  const result = await searchFlights({
                    origin: args.origin,
                    destination: args.destination,
                    departureDate: args.departureDate,
                    returnDate: args.returnDate,
                    passengers: args.passengers || 1,
                    cabinClass: args.cabinClass || "economy",
                  });
                  flightOffers = result.offers;
                  flightSearchParams = {
                    origin: args.origin,
                    destination: args.destination,
                    departureDate: args.departureDate,
                    returnDate: args.returnDate,
                    passengers: args.passengers || 1,
                    cabinClass: args.cabinClass || "economy",
                  };
                  toolResults.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify({
                      count: result.offers.length,
                      message: result.offers.length > 0 
                        ? `Found ${result.offers.length} flights. The UI will display them as clickable cards. Do NOT list flight details in your response.`
                        : result.message || "No flights found.",
                    }),
                  });
                } catch (err: any) {
                  toolResults.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify({ 
                      error: true, 
                      message: err.message || "Flight search failed.",
                      suggestion: "Please ask the user for valid 3-letter IATA airport codes (e.g. JFK, LHR, CDG) and dates in YYYY-MM-DD format."
                    }),
                  });
                }
              }
            }

            const followUp = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: toolResults,
            });
            assistantMsg = followUp.choices[0].message;
        }

        let aiContent = assistantMsg.content || "I'm having trouble thinking right now. Please try again.";

        if (flightOffers.length > 0) {
          aiContent = `I found ${flightOffers.length} flight${flightOffers.length === 1 ? '' : 's'} for you! Take a look at the options below and tap the one you'd like to book.`;
        }

        const metadata = flightOffers.length > 0 ? { type: "flight_results", offers: flightOffers, tripId, searchParams: flightSearchParams } : null;

        await storage.createMessage({
            tripId,
            role: 'assistant',
            content: aiContent,
            metadata,
        });

        res.status(201).json(userMessage); 

     } catch (err) {
         console.error("Message error:", err);
         res.status(500).json({ message: "Failed to process message" });
     }
  });


  // --- Flight Search (Direct) ---
  app.post("/api/flights/search", isAuthenticated, async (req: any, res) => {
    try {
      const schema = z.object({
        origin: z.string().min(2).max(4),
        destination: z.string().min(2).max(4),
        departureDate: z.string(),
        returnDate: z.string().optional(),
        passengers: z.number().min(1).max(9).default(1),
        cabinClass: z.enum(["economy", "premium_economy", "business", "first"]).default("economy"),
      });
      const params = schema.parse(req.body);
      const result = await searchFlights(params);
      res.json(result);
    } catch (err: any) {
      console.error("Flight search error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: err.message || "Flight search failed" });
    }
  });

  // --- Flight Validate ---
  app.post("/api/flights/validate", isAuthenticated, async (req: any, res) => {
    try {
      const { offer_id } = z.object({ offer_id: z.string() }).parse(req.body);
      const result = await getOffer(offer_id);
      res.json(result);
    } catch (err: any) {
      console.error("Flight validate error:", err);
      res.status(500).json({ valid: false, reason: err.message || "Validation failed" });
    }
  });

  // --- Flight Select (creates selection token) ---
  app.post("/api/flights/select", isAuthenticated, async (req: any, res) => {
    try {
      const { offer_id, trip_id } = z.object({ 
        offer_id: z.string(),
        trip_id: z.number().optional(),
      }).parse(req.body);

      const userId = req.user.claims.sub;

      const validation = await getOffer(offer_id);
      if (!validation.valid || !validation.offer) {
        return res.status(400).json({ 
          error: true, 
          message: validation.reason || "Offer is no longer valid",
          needsRefresh: true,
        });
      }

      const offer = validation.offer;
      const token = generateSelectionToken();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const selection = await storage.createFlightSelection({
        userId,
        tripId: trip_id || null,
        offerId: offer_id,
        offerData: offer as any,
        selectionToken: token,
        quotedAmount: offer.total_amount,
        quotedCurrency: offer.currency,
        expiresAt,
      });

      res.json({
        selection_token: token,
        offer_summary: {
          offer_id: offer.offer_id,
          airline: offer.airline,
          total_amount: offer.total_amount,
          currency: offer.currency,
          slices: offer.slices,
          expires_at: expiresAt.toISOString(),
        },
      });
    } catch (err: any) {
      console.error("Flight select error:", err);
      res.status(500).json({ error: true, message: err.message || "Failed to select flight" });
    }
  });


  // --- World Stats ---
  app.get(api.world.stats.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const visited = await storage.getVisitedCountries(userId);
    res.json({
        visitedCount: visited.length,
        totalCountries: 195,
        percent: Math.round((visited.length / 195) * 100)
    });
  });

  app.get(api.world.visited.list.path, isAuthenticated, async (req: any, res) => {
      const userId = req.user.claims.sub;
      const visited = await storage.getVisitedCountries(userId);
      res.json(visited);
  });
  
  app.post(api.world.visited.add.path, isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const input = api.world.visited.add.input.parse(req.body);
        const visited = await storage.addVisitedCountry({ ...input, userId });
        res.status(201).json(visited);
      } catch (err) {
          res.status(400).json({ message: "Invalid input" });
      }
  });

  app.delete(api.world.visited.delete.path, isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const countryCode = req.params.countryCode;
        await storage.removeVisitedCountry(userId, countryCode);
        res.status(204).send();
      } catch (err) {
          res.status(500).json({ message: "Failed to remove country" });
      }
  });


  // --- Stripe Publishable Key ---
  app.get(api.stripe.publishableKey.path, async (req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (err) {
      res.status(500).json({ message: "Failed to get Stripe key" });
    }
  });

  // --- Payments (now requires selection_token) ---
  app.post(api.payments.createIntent.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = z.object({
        selection_token: z.string(),
        trip_id: z.number().optional(),
      }).parse(req.body);
      const userId = req.user.claims.sub;

      const selection = await storage.getFlightSelection(input.selection_token);
      if (!selection) {
        return res.status(400).json({ message: "Invalid selection token" });
      }
      if (selection.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      if (selection.used) {
        return res.status(400).json({ message: "This flight has already been booked. Please select a new flight." });
      }
      if (new Date(selection.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Selection has expired. Please select a new flight." });
      }

      const amountCents = Math.round(parseFloat(selection.quotedAmount) * 100);
      const currency = selection.quotedCurrency.toLowerCase();

      const stripe = await getUncachableStripeClient();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency,
        automatic_payment_methods: { enabled: true },
        metadata: {
          tripId: (selection.tripId || input.trip_id || "").toString(),
          userId,
          selectionToken: input.selection_token,
          offerId: selection.offerId,
        },
      });

      const offerData = selection.offerData as any;
      const booking = await storage.createFlightBooking({
        userId,
        tripId: selection.tripId || input.trip_id || null,
        offerId: selection.offerId,
        passengersJson: null,
        amount: amountCents,
        currency,
        stripePaymentIntentId: paymentIntent.id,
        flightDetails: offerData,
        status: "payment_pending",
      });

      res.json({
        clientSecret: paymentIntent.client_secret!,
        bookingId: booking.id,
      });
    } catch (err: any) {
      console.error("Create intent error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: err.message || "Failed to create payment" });
    }
  });

  // --- Bookings ---
  app.get(api.bookings.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const userBookings = await storage.getUserFlightBookings(userId);
    res.json(userBookings);
  });

  app.get(api.bookings.get.path, isAuthenticated, async (req: any, res) => {
    const booking = await storage.getFlightBooking(Number(req.params.id));
    if (!booking || booking.userId !== req.user.claims.sub) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json(booking);
  });

  app.get("/api/bookings/:id/client-secret", isAuthenticated, async (req: any, res) => {
    try {
      const booking = await storage.getFlightBooking(Number(req.params.id));
      if (!booking || booking.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (!booking.stripePaymentIntentId) {
        return res.status(400).json({ message: "No payment intent for this booking" });
      }
      const stripe = await getUncachableStripeClient();
      const pi = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);
      res.json({ clientSecret: pi.client_secret });
    } catch (err: any) {
      console.error("Get client secret error:", err);
      res.status(500).json({ message: "Failed to get payment details" });
    }
  });

  // --- Mapbox Token ---
  app.get(api.mapbox.token.path, isAuthenticated, async (_req: any, res) => {
    const token = process.env.MAPBOX_ACCESS_TOKEN;
    if (!token) {
      return res.status(500).json({ message: "Mapbox token not configured" });
    }
    res.json({ token });
  });

  // --- Trip Locations ---
  app.get(api.tripLocations.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const tripId = Number(req.params.tripId);
      const trip = await storage.getTrip(tripId);
      if (!trip || trip.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Trip not found" });
      }
      const locations = await storage.getTripLocations(tripId);
      res.json(locations);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to get locations" });
    }
  });

  app.post(api.tripLocations.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const tripId = Number(req.params.tripId);
      const trip = await storage.getTrip(tripId);
      if (!trip || trip.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const parsed = api.tripLocations.create.input.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid input" });
      }

      const { lat, lng } = parsed.data;
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        return res.status(400).json({ message: "Latitude must be between -90 and 90" });
      }
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        return res.status(400).json({ message: "Longitude must be between -180 and 180" });
      }

      const location = await storage.createTripLocation({
        ...parsed.data,
        tripId,
        userId: req.user.claims.sub,
      });
      res.status(201).json(location);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to create location" });
    }
  });

  app.delete(api.tripLocations.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const tripId = Number(req.params.tripId);
      const locationId = Number(req.params.locationId);
      const trip = await storage.getTrip(tripId);
      if (!trip || trip.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Trip not found" });
      }
      const locations = await storage.getTripLocations(tripId);
      const location = locations.find(l => l.id === locationId);
      if (!location || location.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Location not found" });
      }
      await storage.deleteTripLocation(locationId);
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to delete location" });
    }
  });

  app.post(api.bookings.confirm.path, isAuthenticated, async (req: any, res) => {
    try {
      const bookingId = Number(req.params.id);
      const booking = await storage.getFlightBooking(bookingId);

      if (!booking || booking.userId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.status === "booked" || booking.duffelOrderId) {
        return res.json(booking);
      }

      if (booking.status === "failed" || booking.status === "cancelled") {
        return res.status(400).json({ message: `Booking is ${booking.status}` });
      }

      const stripe = await getUncachableStripeClient();
      const pi = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId!);

      if (pi.status === "canceled") {
        await storage.updateFlightBooking(bookingId, { status: "cancelled" });
        return res.status(400).json({ message: "Payment was cancelled" });
      }

      if (pi.status !== "succeeded") {
        return res.status(400).json({ message: `Payment status: ${pi.status}. Please complete payment first.` });
      }

      let duffelResult: any = null;
      if (booking.offerId) {
        const validation = await getOffer(booking.offerId);
        if (!validation.valid) {
          await storage.updateFlightBooking(bookingId, { status: "failed" });
          return res.status(400).json({ 
            message: "Offer is no longer valid. Payment succeeded but the flight cannot be booked. A refund will be processed.",
            reason: validation.reason,
          });
        }

        try {
          const { createOrder } = await import("./duffelClient");
          const passengers = (booking.passengersJson as any[]) || [{
            given_name: "Test",
            family_name: "Passenger",
            email: (req.user.claims as any).email || "test@example.com",
            type: "adult",
          }];
          duffelResult = await createOrder({
            offerId: booking.offerId,
            passengers,
          });
        } catch (duffelErr: any) {
          console.error("Duffel order creation failed:", duffelErr.message);
          await storage.updateFlightBooking(bookingId, { status: "failed" });
          return res.status(500).json({ 
            message: "Flight booking failed after payment. A refund will be processed.",
            error: duffelErr.message,
          });
        }
      }

      const updates: any = {
        status: "booked",
      };
      if (duffelResult) {
        updates.duffelOrderId = duffelResult.orderId;
        updates.duffelBookingReference = duffelResult.bookingReference;
        updates.duffelOrderJson = duffelResult.orderData;
      }

      if (pi.metadata?.selectionToken) {
        await storage.markSelectionUsed(pi.metadata.selectionToken);
      }

      const updated = await storage.updateFlightBooking(bookingId, updates);

      if (booking.tripId) {
        try {
          const flightDetails = booking.flightDetails as any;
          const slices = flightDetails?.slices || [];
          const addedIatas = new Set<string>();
          for (const slice of slices) {
            const originIata = slice?.origin?.iata;
            const destIata = slice?.destination?.iata;
            for (const iata of [originIata, destIata]) {
              if (iata && !addedIatas.has(iata)) {
                addedIatas.add(iata);
                const airport = getAirportByIata(iata);
                if (airport) {
                  await storage.createTripLocation({
                    tripId: booking.tripId,
                    userId: req.user.claims.sub,
                    type: "airport",
                    name: `${airport.name} (${airport.iata})`,
                    lat: String(airport.lat),
                    lng: String(airport.lng),
                    source: "flight",
                    metadata: { iata: airport.iata, city: airport.city },
                  });
                }
              }
            }
          }
        } catch (locErr) {
          console.error("Failed to add airport locations:", locErr);
        }
      }

      res.json(updated);
    } catch (err: any) {
      console.error("Confirm booking error:", err);
      res.status(500).json({ message: err.message || "Failed to confirm booking" });
    }
  });

  return httpServer;
}
