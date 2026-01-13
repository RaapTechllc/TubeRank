import crypto from 'crypto'

/**
 * Compare two strings in constant time to prevent timing attacks
 * @param a First string to compare
 * @param b Second string to compare
 * @returns true if strings are equal, false otherwise
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  try {
    const aBuffer = Buffer.from(a, 'utf8')
    const bBuffer = Buffer.from(b, 'utf8')
    return crypto.timingSafeEqual(aBuffer, bBuffer)
  } catch {
    return false
  }
}

/**
 * Verify Bearer token against expected value using constant-time comparison
 * Prevents timing attacks on sensitive authentication endpoints
 * @param authHeader Authorization header value
 * @param expectedToken Expected token value
 * @returns true if token matches, false otherwise
 */
export function verifyBearerToken(authHeader: string | null, expectedToken: string): boolean {
  if (!authHeader) return false
  
  const prefix = 'Bearer '
  if (!authHeader.startsWith(prefix)) return false
  
  const token = authHeader.slice(prefix.length)
  return timingSafeEqual(token, expectedToken)
}
