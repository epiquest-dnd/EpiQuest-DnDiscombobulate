import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const DISPLAY_NAME_MAX_LENGTH = 50;

const emailSchema = z.string().trim().max(254).pipe(z.email());

export const registerInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  displayName: z.string().trim().min(1).max(DISPLAY_NAME_MAX_LENGTH),
  locale: z.string().trim().min(1).max(35).optional(),
});

export const loginInputSchema = z.object({
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
