import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as processAIJobs } from '@/app/api/cron/process-ai-jobs/route'
import { POST as ingestChannels } from '@/app/api/cron/ingest-channels/route'
import { createMockSupabaseClient } from '../setup'

// Mock cron auth
vi.mock('@/lib/utils/auth', () => ({
  verifyCronSecret: vi.fn().mockReturnValue(true)
}))

// Mock job queue
vi.mock('@/lib/jobs/queue', () => ({
  JobQueue: vi.fn().mockImplementation(() => ({
    processAIJobs: vi.fn(),
    addJob: vi.fn()
  }))
}))

// Mock RSS parser
vi.mock('@/lib/rss/youtube-parser', () => ({
  parseYouTubeRSSFeed: vi.fn()
}))

describe('Cron API', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
  })

  describe('POST /api/cron/process-ai-jobs', () => {
    it('should process AI jobs successfully', async () => {
      const mockJobQueue = {
        processAIJobs: vi.fn().mockResolvedValue({
          processed: 5,
          failed: 0,
          remaining: 10
        })
      }
      vi.mocked(require('@/lib/jobs/queue').JobQueue).mockImplementation(() => mockJobQueue)

      const request = new NextRequest('http://localhost:3000/api/cron/process-ai-jobs', {
        method: 'POST',
        headers: { 'x-cron-secret': 'valid-secret' }
      })
      
      const response = await processAIJobs(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.processed).toBe(5)
      expect(data.failed).toBe(0)
      expect(data.remaining).toBe(10)
    })

    it('should reject invalid cron secret', async () => {
      vi.mocked(require('@/lib/utils/auth').verifyCronSecret).mockReturnValue(false)

      const request = new NextRequest('http://localhost:3000/api/cron/process-ai-jobs', {
        method: 'POST',
        headers: { 'x-cron-secret': 'invalid-secret' }
      })
      
      const response = await processAIJobs(request)
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should handle job processing errors', async () => {
      const mockJobQueue = {
        processAIJobs: vi.fn().mockRejectedValue(new Error('Processing failed'))
      }
      vi.mocked(require('@/lib/jobs/queue').JobQueue).mockImplementation(() => mockJobQueue)

      const request = new NextRequest('http://localhost:3000/api/cron/process-ai-jobs', {
        method: 'POST',
        headers: { 'x-cron-secret': 'valid-secret' }
      })
      
      const response = await processAIJobs(request)
      
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to process AI jobs')
    })
  })

  describe('POST /api/cron/ingest-channels', () => {
    it('should ingest channels successfully', async () => {
      const mockChannels = [
        { id: 'ch1', rss_url: 'https://youtube.com/feeds/videos.xml?channel_id=ch1' },
        { id: 'ch2', rss_url: 'https://youtube.com/feeds/videos.xml?channel_id=ch2' }
      ]
      
      const mockVideos = [
        { id: 'v1', title: 'Video 1', channel_id: 'ch1' },
        { id: 'v2', title: 'Video 2', channel_id: 'ch1' }
      ]

      mockSupabase.from().select().then.mockResolvedValue({ 
        data: mockChannels, 
        error: null 
      })

      vi.mocked(require('@/lib/rss/youtube-parser').parseYouTubeRSSFeed)
        .mockResolvedValue(mockVideos)

      mockSupabase.from().upsert().select().then.mockResolvedValue({ 
        data: mockVideos, 
        error: null 
      })

      const request = new NextRequest('http://localhost:3000/api/cron/ingest-channels', {
        method: 'POST',
        headers: { 'x-cron-secret': 'valid-secret' }
      })
      
      const response = await ingestChannels(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.channelsProcessed).toBe(2)
      expect(data.videosIngested).toBeGreaterThan(0)
    })

    it('should handle RSS parsing errors gracefully', async () => {
      const mockChannels = [
        { id: 'ch1', rss_url: 'https://youtube.com/feeds/videos.xml?channel_id=ch1' }
      ]

      mockSupabase.from().select().then.mockResolvedValue({ 
        data: mockChannels, 
        error: null 
      })

      vi.mocked(require('@/lib/rss/youtube-parser').parseYouTubeRSSFeed)
        .mockRejectedValue(new Error('RSS parse failed'))

      const request = new NextRequest('http://localhost:3000/api/cron/ingest-channels', {
        method: 'POST',
        headers: { 'x-cron-secret': 'valid-secret' }
      })
      
      const response = await ingestChannels(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.channelsProcessed).toBe(1)
      expect(data.errors).toHaveLength(1)
    })

    it('should handle empty channel list', async () => {
      mockSupabase.from().select().then.mockResolvedValue({ 
        data: [], 
        error: null 
      })

      const request = new NextRequest('http://localhost:3000/api/cron/ingest-channels', {
        method: 'POST',
        headers: { 'x-cron-secret': 'valid-secret' }
      })
      
      const response = await ingestChannels(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.channelsProcessed).toBe(0)
      expect(data.videosIngested).toBe(0)
    })
  })
})