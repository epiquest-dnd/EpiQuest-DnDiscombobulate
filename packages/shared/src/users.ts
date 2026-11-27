import { z } from 'zod';

export const userSchema = z
  .object({
    id: z.uuid(),
    role: z.enum(['admin', 'user']),
    email: z.email(),
    displayName: z.string(),
    locale: z.string(),
    preferences: z.record(z.string(), z.unknown()),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: 'User' });

export type UserDto = z.infer<typeof userSchema>;
