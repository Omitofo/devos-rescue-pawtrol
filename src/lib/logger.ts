/**
 * Structured logger — WP-01.
 *
 * Single write path to stdout/stderr as JSON lines (hosting captures them).
 * Convention: no PII in context.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

const isProd = process.env.NODE_ENV === "production";

function emit(
  level: LogLevel,
  message: string,
  context: Record<string, unknown> = {},
  error?: unknown
) {
  if (level === "debug" && isProd) return;

  const payload: LogPayload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (error !== undefined) {
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
  debug: (message: string, context?: Record<string, unknown>) =>
    emit("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) =>
    emit("info", message, context),
  warn: (
    message: string,
    context?: Record<string, unknown>,
    error?: unknown
  ) => emit("warn", message, context, error),
  error: (
    message: string,
    context?: Record<string, unknown>,
    error?: unknown
  ) => emit("error", message, context, error),
};
