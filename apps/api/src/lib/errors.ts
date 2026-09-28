import type { ApiErrorBody, ErrorCode } from "@qdot/types";
import type { FastifyError, FastifyInstance } from "fastify";
import { z } from "zod";

export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: ErrorCode,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const notFound = (code: ErrorCode, message: string) => new AppError(404, code, message);
export const unauthenticated = () => new AppError(401, "UNAUTHENTICATED", "You need to sign in.");

/** Parse untrusted input; throws a 400 VALIDATION_ERROR with per-field messages. */
export function parse<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_";
    fields[key] ??= issue.message;
  }
  const first = result.error.issues[0];
  throw new AppError(400, "VALIDATION_ERROR", first ? first.message : "Invalid request.", fields);
}

function body(code: ErrorCode, message: string, fields?: Record<string, string>): ApiErrorBody {
  return { error: { code, message, ...(fields ? { fields } : {}) } };
}

/** Consistent `{ error: { code, message } }` responses; never leaks stack traces or SQL errors. */
export function registerErrorHandling(app: FastifyInstance) {
  app.setErrorHandler((err: FastifyError | AppError, request, reply) => {
    if (err instanceof AppError) {
      return reply.status(err.statusCode).send(body(err.code, err.message, err.fields));
    }
    const status = (err as FastifyError).statusCode ?? 500;
    if (status === 429) return reply.status(429).send(body("RATE_LIMITED", "Too many attempts. Please wait a minute and try again."));
    if (status === 413) return reply.status(413).send(body("PAYLOAD_TOO_LARGE", "Request is too large."));
    if (status >= 400 && status < 500) {
      return reply.status(status).send(body("VALIDATION_ERROR", status === 415 ? "Unsupported content type." : "Invalid request."));
    }
    // Drizzle wraps the driver error in `cause`, which the logger doesn't serialize by default.
    const cause = (err as { cause?: { message?: string; code?: string } }).cause;
    request.log.error({ err, cause: cause ? { message: cause.message, code: cause.code } : undefined }, "Unhandled error");
    return reply.status(500).send(body("INTERNAL_ERROR", "Something went wrong."));
  });

  app.setNotFoundHandler((_request, reply) => reply.status(404).send(body("NOT_FOUND", "Route not found.")));
}

/** Postgres unique-violation check (duplicate email, duplicate QR code). */
export function isUniqueViolation(err: unknown): boolean {
  const cause = (err as { cause?: { code?: string } })?.cause;
  return (err as { code?: string })?.code === "23505" || cause?.code === "23505";
}
