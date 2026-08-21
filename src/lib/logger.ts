/**
 * Structured logging baseline — WP-01 / NFR-10.
 *
 * Goals:
 * - Consistent JSON-shaped output that can be ingested by any log platform.
 * - Zero external dependencies for the foundation stage.
 * - Easy to swap later for pino / winston / OpenTelemetry without changing call sites.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("animal.created", { animalId, orgId });
 *   logger.error("quota.exceeded", { orgId, quota: "images" }, err);
 *
 * Levels: debug | info | warn | error
 * In production we suppress debug by default.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  // Arbitrary structured context (no PII by convention).
  [key: string]: unknown;
}

const isProd = process.env.NODE_ENV === "production";

function emit(level: LogLevel, message: string, context: Record<string, unknown> = {}, error?: unknown) {
  // Suppress debug in production unless explicitly enabled later.
  if (level === "debug" && isProd) return;

  const payload: LogPayload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (error !== undefined) {
    // Normalise Error objects so they serialise cleanly.
    if (error instanceof Error) {
      payload.error = {
        name: error.name,
        message: error.message,
        stack: isProd ? undefined : error.stack,
      };
    } else {
      payload.error = error;
    }
  }

  // Single write path — stdout for now; hosting platforms capture it.
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) => emit("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit("warn", message, context),
  error: (message: string, context?: Record<string, unknown>, error?: unknown) =>
    emit("error", message, context, error),
};
