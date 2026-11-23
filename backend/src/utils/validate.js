import { z } from 'zod';
import { badRequest } from './errors.js';

export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const msg = result.error.errors.map((e) => e.message).join(' ') || 'Invalid request.';
    throw badRequest(msg);
  }
  return result.data;
}

export const emailSchema = z.string().email('Enter a valid email address.');
export const uuidSchema = z.string().uuid('Invalid id.');

export const roleSchema = z.enum(['super_admin', 'club_admin', 'player']);

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  role: roleSchema.optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const googleAuthSchema = z
  .object({
    idToken: z.string().optional(),
    code: z.string().optional(),
    redirectUri: z.string().optional(),
  })
  .refine((d) => d.idToken || d.code, {
    message: 'Provide a Google sign-in credential.',
  })
  .refine((d) => !d.code || d.redirectUri, {
    message: 'redirectUri is required when using an authorization code.',
  });