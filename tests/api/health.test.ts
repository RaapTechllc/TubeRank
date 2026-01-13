import { describe, it, expect } from 'vitest'
import { GET } from '@/app/api/health/route'

describe('Health API', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await GET()
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.status).toBe('ok')
      expect(data.timestamp).toBeDefined()
      expect(new Date(data.timestamp)).toBeInstanceOf(Date)
    })

    it('should return current timestamp', async () => {
      const beforeTime = new Date()
      const response = await GET()
      const afterTime = new Date()
      
      const data = await response.json()
      const responseTime = new Date(data.timestamp)
      
      expect(responseTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(responseTime.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })
  })
})