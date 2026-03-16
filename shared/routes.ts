import { z } from 'zod';
import { insertTripSchema, insertTripMessageSchema, insertVisitedCountrySchema, trips, tripMessages, visitedCountries, bookings, flightBookings, tripLocations } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  trips: {
    list: {
      method: 'GET' as const,
      path: '/api/trips',
      responses: {
        200: z.array(z.custom<typeof trips.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/trips',
      input: insertTripSchema,
      responses: {
        201: z.custom<typeof trips.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/trips/:id',
      responses: {
        200: z.custom<typeof trips.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    messages: {
        list: {
            method: 'GET' as const,
            path: '/api/trips/:id/messages',
            responses: {
                200: z.array(z.custom<typeof tripMessages.$inferSelect>()),
            }
        },
        create: {
            method: 'POST' as const,
            path: '/api/trips/:id/messages',
            input: insertTripMessageSchema.omit({ tripId: true, role: true }).extend({
                content: z.string()
            }), 
            responses: {
                201: z.custom<typeof tripMessages.$inferSelect>(),
            }
        }
    },
    aiPlan: {
        method: 'POST' as const,
        path: '/api/trips/:id/plan',
        input: z.object({
            message: z.string(),
        }),
        responses: {
            200: z.object({
                message: z.custom<typeof tripMessages.$inferSelect>(), 
                tripUpdate: z.custom<typeof trips.$inferSelect>().optional(),
            })
        }
    }
  },
  world: {
      stats: {
          method: 'GET' as const,
          path: '/api/world/stats',
          responses: {
              200: z.object({
                  visitedCount: z.number(),
                  totalCountries: z.number(),
                  percent: z.number(),
              })
          }
      },
      visited: {
          list: {
            method: 'GET' as const,
            path: '/api/world/visited',
            responses: {
                200: z.array(z.custom<typeof visitedCountries.$inferSelect>())
            }
          },
          add: {
              method: 'POST' as const,
              path: '/api/world/visited',
              input: insertVisitedCountrySchema,
              responses: {
                  201: z.custom<typeof visitedCountries.$inferSelect>(),
                  400: errorSchemas.validation
              }
          },
          delete: {
              method: 'DELETE' as const,
              path: '/api/world/visited/:countryCode',
              responses: {
                  204: z.void(),
              }
          }
      }
  },
  payments: {
    createIntent: {
      method: 'POST' as const,
      path: '/api/payments/create-intent',
      input: z.object({
        selection_token: z.string(),
        trip_id: z.number().optional(),
      }),
      responses: {
        200: z.object({
          clientSecret: z.string(),
          bookingId: z.number(),
        })
      }
    },
  },
  bookings: {
    list: {
      method: 'GET' as const,
      path: '/api/bookings',
      responses: {
        200: z.array(z.any()),
      }
    },
    get: {
      method: 'GET' as const,
      path: '/api/bookings/:id',
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      }
    },
    confirm: {
      method: 'POST' as const,
      path: '/api/bookings/:id/confirm',
      responses: {
        200: z.any(),
      }
    },
  },
  tripLocations: {
    list: {
      method: 'GET' as const,
      path: '/api/trips/:tripId/locations',
      responses: {
        200: z.array(z.custom<typeof tripLocations.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/trips/:tripId/locations',
      input: z.object({
        type: z.enum(["airport", "hotel", "activity"]),
        name: z.string().min(1),
        lat: z.string(),
        lng: z.string(),
        address: z.string().optional(),
        source: z.enum(["flight", "hotel", "ai", "manual"]).default("manual"),
        metadata: z.any().optional(),
      }),
      responses: {
        201: z.custom<typeof tripLocations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/trips/:tripId/locations/:locationId',
      responses: {
        204: z.void(),
      },
    },
  },
  mapbox: {
    token: {
      method: 'GET' as const,
      path: '/api/mapbox/token',
      responses: {
        200: z.object({
          token: z.string(),
        }),
      },
    },
  },
  stripe: {
    publishableKey: {
      method: 'GET' as const,
      path: '/api/stripe/publishable-key',
      responses: {
        200: z.object({
          publishableKey: z.string(),
        })
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
