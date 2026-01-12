/**
 * Standardized API error response format
 */

export interface ApiErrorResponse {
  error: {
    message: string
    code?: string
    details?: unknown
  }
  status: number
}

export interface ApiSuccessResponse<T = unknown> {
  data: T
  status: number
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  code?: string,
  details?: unknown
): ApiErrorResponse {
  return {
    error: {
      message,
      code,
      details
    },
    status
  }
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(data: T, status: number = 200): ApiSuccessResponse<T> {
  return {
    data,
    status
  }
}
