import * as Sentry from "@sentry/nextjs";
import type { Scope } from "@sentry/nextjs";

export interface ErrorContext {
  userId?: string;
  action?: string;
  resource?: string;
  metadata?: Record<string, unknown>;
}

export class ErrorTracker {
  static captureException(error: Error, context?: ErrorContext) {
    Sentry.withScope((scope: Scope) => {
      if (context?.userId) {
        scope.setUser({ id: context.userId });
      }
      if (context?.action) {
        scope.setTag("action", context.action);
      }
      if (context?.resource) {
        scope.setTag("resource", context.resource);
      }
      if (context?.metadata) {
        scope.setContext("metadata", context.metadata);
      }
      Sentry.captureException(error);
    });
  }

  static captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: ErrorContext) {
    Sentry.withScope((scope: Scope) => {
      if (context?.userId) {
        scope.setUser({ id: context.userId });
      }
      if (context?.metadata) {
        scope.setContext("metadata", context.metadata);
      }
      Sentry.captureMessage(message, level);
    });
  }

  static setUser(userId: string) {
    Sentry.setUser({ id: userId });
  }

  static addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>) {
    Sentry.addBreadcrumb({
      message,
      category: category || "custom",
      data,
      timestamp: Date.now() / 1000,
    });
  }
}
