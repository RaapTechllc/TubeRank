import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as fetchTranscript } from '@/app/api/jobs/fetch-transcript/route'
import { POST as summarizeVideo } from '@/app/api/jobs/summarize-video/route'
import { POST as scoreVideo } from '@/app/api/jobs/score-video/route'
import { createMockSupabaseClient } from '../setup'

// Mock auth middleware
vi.mock('@/lib/middleware/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: { id: 'test-user' }, error: null })
}))

// Mock rate limit middleware
vi.mock('@/lib/rate-limit/middleware', () => ({
  withRateLimit: vi.fn((handler) => handler)
}))

// Mock transcript fetcher
vi.mock('@/lib/transcripts/youtube-fetcher', () => ({
  fetchYouTubeTranscript: vi.fn()
}))

// Mock LLM client
vi.mock('@/lib/llm/client', () => ({
  LLMClient: vi.fn().mockImplementation(() => ({
    summarize: vi.fn(),
    score: vi.fn()
  }))
}))

describe('Jobs API', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
  })

  describe('POST /api/jobs/fetch-transcript', () => {
    it('should fetch and store transcript successfully', async () => {
      const mockTranscript = 'This is a test transcript'
      const mockCard = { id: 'card-1', video_id: 'test-video', title: 'Test Video' }
      
      vi.mocked(require('@/lib/transcripts/youtube-fetcher').fetchYouTubeTranscript)
        .mockResolvedValue(mockTranscript)
      
      mockSupabase.from().select().eq().single.mockResolvedValue({ 
        data: mockCard, 
        error: null 
      })
      
      mockSupabase.from().update().eq().select().single.mockResolvedValue({ 
        data: { ...mockCard, transcript: mockTranscript }, 
        error: null 
      })

      const request = new NextRequest('http://localhost:3000/api/jobs/fetch-transcript', {
        method: 'POST',
        body: JSON.stringify({ cardId: 'card-1' })
      })
      
      const response = await fetchTranscript(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.transcript).toBe(mockTranscript)
    })

    it('should handle missing cardId', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs/fetch-transcript', {
        method: 'POST',
        body: JSON.stringify({})
      })
      
      const response = await fetchTranscript(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Card ID is required')
    })

    it('should handle card not found', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Card not found' } 
      })

      const request = new NextRequest('http://localhost:3000/api/jobs/fetch-transcript', {
        method: 'POST',
        body: JSON.stringify({ cardId: 'nonexistent' })
      })
      
      const response = await fetchTranscript(request)
      
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Card not found')
    })
  })

  describe('POST /api/jobs/summarize-video', () => {
    it('should summarize video successfully', async () => {
      const mockCard = { 
        id: 'card-1', 
        transcript: 'Long transcript content here',
        title: 'Test Video'
      }
      const mockSummary = 'This is a test summary'
      
      mockSupabase.from().select().eq().single.mockResolvedValue({ 
        data: mockCard, 
        error: null 
      })
      
      const mockLLMClient = {
        summarize: vi.fn().mockResolvedValue(mockSummary)
      }
      vi.mocked(require('@/lib/llm/client').LLMClient).mockImplementation(() => mockLLMClient)
      
      mockSupabase.from().update().eq().select().single.mockResolvedValue({ 
        data: { ...mockCard, summary: mockSummary }, 
        error: null 
      })

      const request = new NextRequest('http://localhost:3000/api/jobs/summarize-video', {
        method: 'POST',
        body: JSON.stringify({ cardId: 'card-1' })
      })
      
      const response = await summarizeVideo(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.summary).toBe(mockSummary)
    })

    it('should handle missing transcript', async () => {
      const mockCard = { 
        id: 'card-1', 
        transcript: null,
        title: 'Test Video'
      }
      
      mockSupabase.from().select().eq().single.mockResolvedValue({ 
        data: mockCard, 
        error: null 
      })

      const request = new NextRequest('http://localhost:3000/api/jobs/summarize-video', {
        method: 'POST',
        body: JSON.stringify({ cardId: 'card-1' })
      })
      
      const response = await summarizeVideo(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('No transcript available for this video')
    })
  })

  describe('POST /api/jobs/score-video', () => {
    it('should score video successfully', async () => {
      const mockCard = { 
        id: 'card-1', 
        summary: 'Test summary',
        title: 'Test Video',
        profile_id: 'profile-1'
      }
      const mockProfile = {
        id: 'profile-1',
        scoring_criteria: { relevance: 0.8, quality: 0.9 }
      }
      const mockScore = 85
      
      mockSupabase.from().select().eq().single
        .mockResolvedValueOnce({ data: mockCard, error: null })
        .mockResolvedValueOnce({ data: mockProfile, error: null })
      
      const mockLLMClient = {
        score: vi.fn().mockResolvedValue(mockScore)
      }
      vi.mocked(require('@/lib/llm/client').LLMClient).mockImplementation(() => mockLLMClient)
      
      mockSupabase.from().update().eq().select().single.mockResolvedValue({ 
        data: { ...mockCard, score: mockScore }, 
        error: null 
      })

      const request = new NextRequest('http://localhost:3000/api/jobs/score-video', {
        method: 'POST',
        body: JSON.stringify({ cardId: 'card-1' })
      })
      
      const response = await scoreVideo(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.score).toBe(mockScore)
    })

    it('should handle missing summary', async () => {
      const mockCard = { 
        id: 'card-1', 
        summary: null,
        title: 'Test Video'
      }
      
      mockSupabase.from().select().eq().single.mockResolvedValue({ 
        data: mockCard, 
        error: null 
      })

      const request = new NextRequest('http://localhost:3000/api/jobs/score-video', {
        method: 'POST',
        body: JSON.stringify({ cardId: 'card-1' })
      })
      
      const response = await scoreVideo(request)
      
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('No summary available for scoring')
    })
  })
})