import * as Sentry from "@sentry/nextjs";
import type { ErrorEvent, EventHint } from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === "development",
  beforeSend(event: ErrorEvent, hint: EventHint) {
    // Filter out non-critical errors in development
    if (process.env.NODE_ENV === "development") {
      return event;
    }
    return event;
  },
});
