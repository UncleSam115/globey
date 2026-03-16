import { db } from "./db";
import { trips, tripMessages, bookings, visitedCountries, flightBookings, flightSelections, tripLocations } from "@shared/schema";
import { users } from "@shared/models/auth";
import { eq, desc, and, lt } from "drizzle-orm";
import type { FullInsertTrip, InsertTripMessage, FullInsertBooking, FullInsertVisitedCountry, Trip, TripMessage, Booking, VisitedCountry, FlightBooking, FullInsertFlightBooking, FlightSelection, FullInsertFlightSelection, TripLocation, FullInsertTripLocation } from "@shared/schema";

export interface IStorage {
  createTrip(trip: FullInsertTrip): Promise<Trip>;
  getTrip(id: number): Promise<Trip | undefined>;
  getUserTrips(userId: string): Promise<Trip[]>;
  updateTrip(id: number, updates: Partial<Trip>): Promise<Trip>;
  createMessage(message: InsertTripMessage): Promise<TripMessage>;
  getTripMessages(tripId: number): Promise<TripMessage[]>;
  createBooking(booking: FullInsertBooking): Promise<Booking>;
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingBySessionId(sessionId: string): Promise<Booking | undefined>;
  getUserBookings(userId: string): Promise<Booking[]>;
  updateBooking(id: number, updates: Partial<Booking>): Promise<Booking>;
  addVisitedCountry(entry: FullInsertVisitedCountry): Promise<VisitedCountry>;
  getVisitedCountries(userId: string): Promise<VisitedCountry[]>;
  removeVisitedCountry(userId: string, countryCode: string): Promise<void>;
  createFlightBooking(booking: FullInsertFlightBooking): Promise<FlightBooking>;
  getFlightBooking(id: number): Promise<FlightBooking | undefined>;
  getUserFlightBookings(userId: string): Promise<FlightBooking[]>;
  updateFlightBooking(id: number, updates: Partial<FlightBooking>): Promise<FlightBooking>;
  createFlightSelection(selection: FullInsertFlightSelection): Promise<FlightSelection>;
  getFlightSelection(token: string): Promise<FlightSelection | undefined>;
  markSelectionUsed(token: string): Promise<void>;
  createTripLocation(location: FullInsertTripLocation): Promise<TripLocation>;
  getTripLocations(tripId: number): Promise<TripLocation[]>;
  deleteTripLocation(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createTrip(trip: FullInsertTrip) {
    const [newTrip] = await db.insert(trips).values(trip).returning();
    return newTrip;
  }

  async getTrip(id: number) {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip;
  }

  async getUserTrips(userId: string) {
    return db.select().from(trips).where(eq(trips.userId, userId)).orderBy(desc(trips.createdAt));
  }

  async updateTrip(id: number, updates: Partial<typeof trips.$inferSelect>) {
    const [updatedTrip] = await db.update(trips).set(updates).where(eq(trips.id, id)).returning();
    return updatedTrip;
  }

  // Messages
  async createMessage(message: InsertTripMessage) {
    const [newMessage] = await db.insert(tripMessages).values(message).returning();
    return newMessage;
  }

  async getTripMessages(tripId: number) {
    return db.select().from(tripMessages).where(eq(tripMessages.tripId, tripId)).orderBy(tripMessages.createdAt);
  }

  async createBooking(booking: FullInsertBooking) {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async getBooking(id: number) {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingBySessionId(sessionId: string) {
    const [booking] = await db.select().from(bookings).where(eq(bookings.stripeSessionId, sessionId));
    return booking;
  }

  async getUserBookings(userId: string) {
    return db.select().from(bookings).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt));
  }

  async updateBooking(id: number, updates: Partial<Booking>) {
    const [updated] = await db.update(bookings).set(updates).where(eq(bookings.id, id)).returning();
    return updated;
  }

  async addVisitedCountry(entry: FullInsertVisitedCountry) {
    const [visited] = await db.insert(visitedCountries).values(entry).returning();
    return visited;
  }

  async getVisitedCountries(userId: string) {
    return db.select().from(visitedCountries).where(eq(visitedCountries.userId, userId));
  }

  async removeVisitedCountry(userId: string, countryCode: string) {
    await db.delete(visitedCountries).where(
      and(eq(visitedCountries.userId, userId), eq(visitedCountries.countryCode, countryCode))
    );
  }

  async createFlightBooking(booking: FullInsertFlightBooking) {
    const [newBooking] = await db.insert(flightBookings).values(booking).returning();
    return newBooking;
  }

  async getFlightBooking(id: number) {
    const [booking] = await db.select().from(flightBookings).where(eq(flightBookings.id, id));
    return booking;
  }

  async getUserFlightBookings(userId: string) {
    return db.select().from(flightBookings).where(eq(flightBookings.userId, userId)).orderBy(desc(flightBookings.createdAt));
  }

  async updateFlightBooking(id: number, updates: Partial<FlightBooking>) {
    const [updated] = await db.update(flightBookings).set(updates).where(eq(flightBookings.id, id)).returning();
    return updated;
  }

  async createFlightSelection(selection: FullInsertFlightSelection) {
    const [newSelection] = await db.insert(flightSelections).values(selection).returning();
    return newSelection;
  }

  async getFlightSelection(token: string) {
    const [selection] = await db.select().from(flightSelections).where(eq(flightSelections.selectionToken, token));
    return selection;
  }

  async markSelectionUsed(token: string) {
    await db.update(flightSelections).set({ used: true }).where(eq(flightSelections.selectionToken, token));
  }

  async createTripLocation(location: FullInsertTripLocation) {
    const [newLocation] = await db.insert(tripLocations).values(location).returning();
    return newLocation;
  }

  async getTripLocations(tripId: number) {
    return db.select().from(tripLocations).where(eq(tripLocations.tripId, tripId)).orderBy(tripLocations.createdAt);
  }

  async deleteTripLocation(id: number) {
    await db.delete(tripLocations).where(eq(tripLocations.id, id));
  }
}

export const storage = new DatabaseStorage();
