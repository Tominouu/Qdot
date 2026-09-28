import { z } from "zod";

export const MIN_PASSWORD_LENGTH = 8;

const email = z.string().trim().toLowerCase().max(254).email("Enter a valid email address");

export const RegisterSchema = z.object({
  email,
  password: z.string().min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`).max(256),
  name: z.string().trim().max(80).optional(),
});
export type RegisterInput = z.input<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email,
  password: z.string().min(1).max(256),
});
export type LoginInput = z.input<typeof LoginSchema>;

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}
