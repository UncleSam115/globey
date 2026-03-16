# Globey - AI Travel Planning App

## Overview

Globey is an AI-powered travel planning web application that lets users plan trips through conversational AI, track visited countries on an interactive world map, and manage trip bookings with Stripe payment integration. The app follows a "Duolingo-style but premium" design philosophy — friendly, warm, and playful without being childish.

The project is a full-stack TypeScript monorepo with a React frontend (Vite) and Express backend, using PostgreSQL with Drizzle ORM for data storage. Authentication is handled via Replit Auth (OpenID Connect).

## User Preferences

Preferred communication style: Simple, everyday language.

## Anti-Hallucination Flight Integrity

The system enforces zero fake flights through a strict architecture:

### How It Works
1. **AI cannot generate flight data** — The LLM's `search_flights` tool returns only a count and message. The actual offer data is stored in message `metadata` as structured JSON from Duffel API.
2. **Frontend renders only verified data** — `ChatInterface` reads `metadata.offers[]` from messages and renders `FlightCard` components. Cards are only rendered if `offer_id` exists and `provider === 'duffel'`.
3. **Selection tokens with expiry** — When a user clicks a flight card, `POST /api/flights/select` validates the offer with Duffel (fresh fetch), creates a `flight_selections` record with a 15-minute expiry, and returns a `selection_token`.
4. **Payment requires valid token** — `POST /api/payments/create-intent` requires a `selection_token`. It validates the token is not expired, not already used, and belongs to the user before creating a Stripe PaymentIntent.
5. **Booking confirms with Duffel** — `POST /api/bookings/:id/confirm` re-validates the offer with Duffel before creating the order.

### Key Endpoints
- `POST /api/flights/search` — Direct search, returns normalized offers
- `POST /api/flights/validate` — Re-validates an offer_id with Duffel
- `POST /api/flights/select` — Creates selection_token (15min expiry)
- `POST /api/payments/create-intent` — Requires selection_token, creates PaymentIntent + booking
- `POST /api/bookings/:id/confirm` — Verifies Stripe payment, re-validates offer, creates Duffel order

### Normalized Offer Schema
All flight data flowing to the frontend follows a strict schema with: `offer_id`, `total_amount`, `currency`, `slices[]` (with segments), `refundable`, `cabin_class`, `baggage`, `provider: "duffel"`, `airline`, `expires_at`.

## System Architecture

### Frontend (client/)
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state; no global client state library
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives, styled with Tailwind CSS
- **Custom Components**: Custom `Button` component with Duolingo-style press animations (shadow-based depth), `ChatInterface` for AI conversations with inline `FlightCard` rendering and `DateSwitcher` for date navigation, `MapChart` using react-simple-maps for interactive world map (click-to-toggle countries), `FlightCard` for clickable Duffel flight offers, `DateSwitcher` for browsing flights by date with left/right arrows and per-date caching, `TripMap` page with Mapbox GL JS for trip-specific location pins (airports, hotels, activities)
- **Dark Mode**: Class-based dark mode via `ThemeProvider` (`client/src/components/ThemeProvider.tsx`). Persists to localStorage key "globey-theme". Toggle in Profile page.
- **Animations**: Framer Motion for subtle micro-animations (fade, scale-in for cards)
- **Design System**: Nunito font, vibrant green primary color, very rounded corners (1rem radius), friendly but premium feel. All surfaces use semantic tokens (bg-card, bg-background) for dark mode compatibility.
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend (server/)
- **Framework**: Express.js running on Node.js with TypeScript (tsx for dev, esbuild for production)
- **API Pattern**: RESTful JSON API under `/api/` prefix. Route definitions with Zod schemas live in `shared/routes.ts` for type-safe request/response validation shared between client and server
- **Authentication**: Replit Auth via OpenID Connect (passport + express-session with PostgreSQL session store via connect-pg-simple). The `isAuthenticated` middleware gates protected routes. Sessions stored in a `sessions` table.
- **AI Integration**: OpenAI API (via Replit AI Integrations env vars `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`) for trip planning chat. AI uses function calling with `search_flights` tool only — no `book_flight` tool (booking is handled by UI selection flow).
- **Replit Integrations** (`server/replit_integrations/`): Modular integration modules for auth, chat, image generation, audio/voice, and batch processing. Each has its own routes, storage, and client files.

### Shared Layer (shared/)
- **Schema** (`shared/schema.ts`): Drizzle ORM table definitions for application tables (trips, trip_messages, bookings, flight_bookings, flight_selections, trip_locations, visited_countries). Re-exports integration models from `shared/models/`.
- **Models** (`shared/models/`): `auth.ts` defines users and sessions tables (mandatory for Replit Auth). `chat.ts` defines conversations and messages tables for the AI chat integration.
- **Routes** (`shared/routes.ts`): Centralized API route definitions with Zod schemas for input validation and response typing, shared between frontend and backend.

### Database
- **Database**: PostgreSQL (required, connection via `DATABASE_URL` env var)
- **ORM**: Drizzle ORM with `drizzle-kit` for schema management
- **Schema Push**: Use `npm run db:push` (runs `drizzle-kit push`) to sync schema to database — no migration files needed for development
- **Key Tables**: `users`, `sessions` (auth), `conversations`, `messages` (chat), `trips`, `trip_messages`, `bookings` (legacy), `flight_bookings` (active - PaymentIntent flow), `flight_selections` (offer selection tokens with expiry), `trip_locations` (map pins per trip), `visited_countries` (application)

### Storage Pattern
- `server/storage.ts`: `DatabaseStorage` class implementing `IStorage` interface for all application CRUD operations (trips, messages, bookings, flight selections, visited countries)
- `server/replit_integrations/auth/storage.ts`: Auth-specific storage for user upsert operations
- `server/replit_integrations/chat/storage.ts`: Chat-specific storage for conversation/message operations

### Build & Dev
- **Dev**: `npm run dev` — runs tsx to start the Express server which sets up Vite dev server as middleware (HMR enabled)
- **Build**: `npm run build` — Vite builds the client to `dist/public/`, esbuild bundles the server to `dist/index.cjs`
- **Production**: `npm start` — runs the built `dist/index.cjs` which serves static files from `dist/public/`
- **Type Check**: `npm run check` — runs TypeScript compiler in noEmit mode

## External Dependencies

### Required Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (must be provisioned)
- `SESSION_SECRET` — Secret for express-session cookie signing
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key (via Replit AI Integrations)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI API base URL (via Replit AI Integrations)
- `DUFFEL_ACCESS_TOKEN` — Duffel API token for real flight search
- `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` — Stripe keys (or uses Replit Stripe connector)
- `MAPBOX_ACCESS_TOKEN` — Mapbox public token for Trip Map rendering (served via `/api/mapbox/token`)
- `REPL_ID`, `ISSUER_URL` — Set automatically by Replit for auth

### Third-Party Services
- **OpenAI API**: Powers the AI trip planning chat, image generation, and voice features
- **Stripe**: In-app payment processing via Stripe Payment Element (PaymentIntents, not Checkout sessions). Frontend uses `@stripe/react-stripe-js` Elements. Supports both direct API keys and Replit's Stripe connector.
- **Duffel API**: Real flight search (`searchFlights`), offer validation (`getOffer`), and order creation (`createOrder`) in `server/duffelClient.ts`. Orders are created after payment confirmation. Validates IATA codes and date formats before searching.
- **Mapbox GL JS**: Trip Map page (`/trips/:id/map`) renders interactive map with location pins for airports, hotels, and activities. Token served from backend via `/api/mapbox/token`. Airport coordinates lookup in `server/airportCoordinates.ts` with 65+ major airports.
- **Replit Auth**: OpenID Connect-based authentication — no custom auth flow needed. Users log in via `/api/login`, log out via `/api/logout`.

### Key NPM Packages
- `drizzle-orm` + `drizzle-kit` — Database ORM and schema tooling
- `@tanstack/react-query` — Server state management
- `react-simple-maps` + `d3-scale` — Interactive SVG world map
- `framer-motion` — Animations
- `wouter` — Client-side routing
- `zod` + `drizzle-zod` — Schema validation
- `react-markdown` — Rendering AI chat responses
- `@stripe/stripe-js` + `@stripe/react-stripe-js` — Stripe Payment Element integration
- `passport` + `openid-client` — Replit Auth integration
- `connect-pg-simple` — PostgreSQL session store
- `mapbox-gl` — Mapbox GL JS for Trip Map rendering

### Booking Flow
1. User asks AI about flights → AI calls `search_flights` tool → Duffel API returns offers
2. Offers stored in message `metadata` → ChatInterface renders FlightCard components
3. User clicks a FlightCard → `POST /api/flights/select` validates with Duffel → returns `selection_token` (15min expiry)
4. User clicks "Book" → `POST /api/payments/create-intent` with token → creates Stripe PaymentIntent + flight_bookings record
5. User completes payment on `/checkout/:bookingId` → `POST /api/bookings/:id/confirm` → re-validates offer → creates Duffel order → status = "booked"
6. On successful booking confirmation, airport locations (origin + destination) are automatically added to `trip_locations` using IATA lookup from `server/airportCoordinates.ts`

## Trip Map

### Overview
Each trip has a Trip Map page (`/trips/:id/map`) showing location pins on an interactive Mapbox GL JS map. Three location types: airports (blue, "A"), hotels (amber, "H"), and activities (green, "P"). The existing World Map page (`/world`) is completely separate and unchanged.

### Data Model
`trip_locations` table: id (serial PK), tripId (FK to trips), userId, type ("airport"|"hotel"|"activity"), name, lat (text), lng (text), address (optional), source ("flight"|"hotel"|"ai"|"manual"), metadata (jsonb), createdAt.

### API Endpoints
- `GET /api/trips/:tripId/locations` — Returns all locations for a trip (auth + ownership required)
- `POST /api/trips/:tripId/locations` — Creates a location, validates lat (-90 to 90) and lng (-180 to 180) server-side
- `DELETE /api/trips/:tripId/locations/:locationId` — Deletes a location (verifies location belongs to trip and user)
- `GET /api/mapbox/token` — Returns the Mapbox access token from server env (auth required)

### Integration Hooks
- **Flight booking confirmation**: After `POST /api/bookings/:id/confirm` succeeds, origin and destination airports are added to `trip_locations` automatically using `server/airportCoordinates.ts` lookup (65+ major airports with lat/lng)
- **Manual/AI additions**: Locations can be added manually via the API. Future: "Add to Trip Map" button for AI-suggested activities

### Frontend
- `client/src/pages/TripMap.tsx` — Full-screen map with sliding locations panel, fit-to-bounds, click-to-focus, popup details
- `client/src/hooks/use-trip-locations.ts` — React Query hooks for locations CRUD and Mapbox token
- Trip detail page has a "Map" button in the header linking to `/trips/:id/map`
