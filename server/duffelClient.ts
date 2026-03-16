import { Duffel } from "@duffel/api";

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN!,
});

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
}

export interface NormalizedSegment {
  marketing_airline: string;
  flight_number: string;
  departing_at: string;
  arriving_at: string;
  origin_iata: string;
  destination_iata: string;
  stops: number;
}

export interface NormalizedSlice {
  origin: { iata: string; time: string; city?: string };
  destination: { iata: string; time: string; city?: string };
  duration_minutes: number;
  segments: NormalizedSegment[];
}

export interface NormalizedOffer {
  offer_id: string;
  total_amount: string;
  currency: string;
  slices: NormalizedSlice[];
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

const IATA_CODE_REGEX = /^[A-Z]{3}$/;

function validateIataCode(code: string): string {
  const upper = code.trim().toUpperCase();
  if (!IATA_CODE_REGEX.test(upper)) {
    throw new Error(`Invalid IATA code: "${code}". Please use 3-letter airport or city codes like JFK, LHR, DXB.`);
  }
  return upper;
}

function validateDateFormat(date: string): string {
  const d = date.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    throw new Error(`Invalid date format: "${date}". Use YYYY-MM-DD format.`);
  }
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: "${date}".`);
  }
  if (parsed < new Date(new Date().toISOString().split('T')[0])) {
    throw new Error(`Date "${date}" is in the past. Please use a future date.`);
  }
  return d;
}

function parseDuration(isoDuration: string | null | undefined): number {
  if (!isoDuration) return 0;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return (parseInt(match[1] || "0") * 60) + parseInt(match[2] || "0");
}

function normalizeOffer(offer: any, cabinClass: string): NormalizedOffer {
  const slices: NormalizedSlice[] = (offer.slices || []).map((slice: any) => {
    const segments: NormalizedSegment[] = (slice.segments || []).map((seg: any) => ({
      marketing_airline: seg.marketing_carrier?.iata_code || "",
      flight_number: `${seg.marketing_carrier?.iata_code || ""}${seg.marketing_carrier_flight_number || ""}`,
      departing_at: seg.departing_at || "",
      arriving_at: seg.arriving_at || "",
      origin_iata: seg.origin?.iata_code || "",
      destination_iata: seg.destination?.iata_code || "",
      stops: 0,
    }));

    return {
      origin: {
        iata: slice.origin?.iata_code || "",
        time: slice.segments?.[0]?.departing_at || "",
        city: slice.origin?.city_name || undefined,
      },
      destination: {
        iata: slice.destination?.iata_code || "",
        time: slice.segments?.[slice.segments.length - 1]?.arriving_at || "",
        city: slice.destination?.city_name || undefined,
      },
      duration_minutes: parseDuration(slice.duration),
      segments,
    };
  });

  const baggageInfo = offer.slices?.[0]?.segments?.[0]?.passengers?.[0]?.baggages || [];
  const carryOn = baggageInfo.some((b: any) => b.type === "carry_on" && b.quantity > 0);
  const checkedBag = baggageInfo.find((b: any) => b.type === "checked");
  const checkedStr = checkedBag ? `${checkedBag.quantity}pc` : "0pc";

  return {
    offer_id: offer.id,
    total_amount: offer.total_amount,
    currency: offer.total_currency,
    slices,
    refundable: offer.conditions?.refund_before_departure?.allowed || false,
    changeable: offer.conditions?.change_before_departure?.allowed || false,
    cabin_class: cabinClass,
    baggage: { carry_on: carryOn, checked: checkedStr },
    provider: "duffel",
    airline: offer.owner?.name || "Unknown Airline",
    airline_logo: offer.owner?.logo_symbol_url || null,
    expires_at: offer.expires_at || "",
    created_at: new Date().toISOString(),
  };
}

export async function searchFlights(params: FlightSearchParams): Promise<{ offers: NormalizedOffer[]; message?: string }> {
  const origin = validateIataCode(params.origin);
  const destination = validateIataCode(params.destination);
  const departureDate = validateDateFormat(params.departureDate);
  const returnDate = params.returnDate ? validateDateFormat(params.returnDate) : undefined;

  const slices: any[] = [
    {
      origin,
      destination,
      departure_date: departureDate,
    },
  ];

  if (returnDate) {
    slices.push({
      origin: destination,
      destination: origin,
      departure_date: returnDate,
    });
  }

  const passengers: any[] = [];
  for (let i = 0; i < Math.min(params.passengers || 1, 9); i++) {
    passengers.push({ type: "adult" as const });
  }

  const cabinClass = params.cabinClass || "economy";

  try {
    const offerRequestResponse = await duffel.offerRequests.create({
      slices,
      passengers,
      cabin_class: cabinClass,
      return_offers: true,
      max_connections: 1,
    });

    const data = offerRequestResponse.data as any;
    let offers = data.offers || [];

    if (offers.length === 0 && data.id) {
      const offersResponse = await duffel.offers.list({ offer_request_id: data.id, sort: "total_amount", limit: 10 });
      offers = (offersResponse.data as any) || [];
    }

    if (offers.length === 0) {
      return { offers: [], message: "No flights found for these dates and route. Try different dates or nearby airports." };
    }

    const normalized = offers.slice(0, 10).map((offer: any) => normalizeOffer(offer, cabinClass));

    return { offers: normalized };
  } catch (error: any) {
    const duffelErrors = error?.errors;
    if (duffelErrors && Array.isArray(duffelErrors)) {
      const msg = duffelErrors.map((e: any) => e.message).join("; ");
      console.error("Duffel API error:", msg);
      throw new Error(msg);
    }
    console.error("Duffel flight search error:", error?.message || error);
    throw new Error(error?.message || "Failed to search flights");
  }
}

export async function getOffer(offerId: string): Promise<{ valid: boolean; offer?: NormalizedOffer; reason?: string }> {
  try {
    const response = await duffel.offers.get(offerId);
    const offer = response.data as any;

    if (!offer) {
      return { valid: false, reason: "Offer not found" };
    }

    const expiresAt = new Date(offer.expires_at);
    if (expiresAt < new Date()) {
      return { valid: false, reason: "Offer has expired" };
    }

    const normalized = normalizeOffer(offer, offer.slices?.[0]?.segments?.[0]?.passengers?.[0]?.cabin_class_marketing_name?.toLowerCase() || "economy");
    return { valid: true, offer: normalized };
  } catch (error: any) {
    const duffelErrors = error?.errors;
    if (duffelErrors && Array.isArray(duffelErrors)) {
      const msg = duffelErrors.map((e: any) => e.message).join("; ");
      return { valid: false, reason: msg };
    }
    return { valid: false, reason: error?.message || "Failed to validate offer" };
  }
}

export async function createOrder(params: {
  offerId: string;
  passengers: Array<{
    given_name: string;
    family_name: string;
    born_on?: string;
    email: string;
    phone_number?: string;
    gender?: string;
    type?: string;
    id?: string;
  }>;
}) {
  try {
    const order = await duffel.orders.create({
      type: "instant",
      selected_offers: [params.offerId],
      passengers: params.passengers.map((p, i) => ({
        id: p.id || `pas_${i}`,
        given_name: p.given_name,
        family_name: p.family_name,
        born_on: p.born_on || "1990-01-01",
        email: p.email,
        phone_number: p.phone_number || "+441234567890",
        gender: (p.gender || "m") as any,
        type: (p.type || "adult") as any,
        title: "mr" as any,
      })),
      payments: [{
        type: "balance" as any,
        amount: "0",
        currency: "GBP",
      }],
    });

    return {
      orderId: order.data.id,
      bookingReference: order.data.booking_reference,
      orderData: order.data,
    };
  } catch (error: any) {
    const duffelErrors = error?.errors;
    if (duffelErrors && Array.isArray(duffelErrors)) {
      const msg = duffelErrors.map((e: any) => e.message).join("; ");
      console.error("Duffel create order error:", msg);
      throw new Error(msg);
    }
    console.error("Duffel create order error:", error?.message || error);
    throw new Error(error?.message || "Failed to create Duffel order");
  }
}

export { duffel };
