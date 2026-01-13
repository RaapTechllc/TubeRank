/**
 * Custom application error classes
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
    this.name = 'RateLimitError'
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR')
    this.name = 'InternalServerError'
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 500, 'DATABASE_ERROR', details)
    this.name = 'DatabaseError'
  }
}

export class ExternalServiceError extends ApiError {
  constructor(service: string, message: string) {
    super(`${service} error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR')
    this.name = 'ExternalServiceError'
  }
}
