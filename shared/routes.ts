import { z } from 'zod';
import { insertProfileSchema, insertGroupSchema, profiles, groups } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  profiles: {
    get: {
      method: 'GET' as const,
      path: '/api/profiles/me' as const,
      responses: {
        200: z.custom<typeof profiles.$inferSelect>().nullable(),
        401: errorSchemas.unauthorized,
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/profiles/me' as const,
      input: insertProfileSchema.partial(),
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    }
  },
  groups: {
    list: {
      method: 'GET' as const,
      path: '/api/groups' as const,
      responses: {
        200: z.array(z.custom<typeof groups.$inferSelect>()),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/groups' as const,
      input: insertGroupSchema,
      responses: {
        201: z.custom<typeof groups.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    }
  },
  frequencies: {
    active: {
      method: 'GET' as const,
      path: '/api/frequencies/active' as const,
      responses: {
        200: z.array(z.object({
          frequency: z.string(),
          userCount: z.number(),
        })),
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

export const ws = {
  send: {
    joinFrequency: z.object({
      frequency: z.string(),
      userInfo: z.object({
        id: z.string(),
        name: z.string(),
        avatar: z.string().optional().nullable()
      }).optional()
    }),
    leaveFrequency: z.object({ frequency: z.string() }),
    speaking: z.object({ isSpeaking: z.boolean() }),
    webrtcSignal: z.object({
      targetUserId: z.string().optional(),
      signalData: z.any(),
      frequency: z.string()
    })
  },
  receive: {
    frequencyState: z.object({
      frequency: z.string(),
      users: z.array(z.object({ id: z.string(), name: z.string(), isSpeaking: z.boolean(), avatar: z.string().optional() }))
    }),
    userJoined: z.object({ userId: z.string(), name: z.string(), avatar: z.string().optional() }),
    userLeft: z.object({ userId: z.string() }),
    userSpeaking: z.object({ userId: z.string(), isSpeaking: z.boolean() }),
    webrtcSignal: z.object({
      fromUserId: z.string(),
      signalData: z.any()
    })
  }
};

// Types
export type ProfileResponse = z.infer<typeof api.profiles.get.responses[200]>;
export type UpdateProfileRequest = z.infer<typeof api.profiles.update.input>;
export type GroupResponse = z.infer<typeof api.groups.create.responses[201]>;
