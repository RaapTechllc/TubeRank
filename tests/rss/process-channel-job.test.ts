import { describe, it, expect, beforeEach, vi } from 'vitest'
import { processChannelJob } from '@/lib/rss/process-channel-job'
import { createServerClient } from '@/lib/supabase/server'
import { fetchYouTubeChannelFeed } from '@/lib/rss/youtube-parser'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/rss/youtube-parser')

describe('processChannelJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function createMockSupabase(options: {
    videoUpsertData?: { id: string } | null
    profileSources?: Array<{ profile_id: string; profiles: { is_active: boolean } }> | null
    existingCard?: { id: string } | null
  } = {}) {
    const {
      videoUpsertData = { id: 'video-id-1' },
      profileSources = [{ profile_id: 'profile-1', profiles: { is_active: true } }],
      existingCard = null
    } = options

    return {
      from: vi.fn((table: string) => {
        if (table === 'videos') {
          return {
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: videoUpsertData, error: null })
              })
            })
          }
        }
        if (table === 'profile_sources') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: profileSources,
                  error: null
                })
              })
            })
          }
        }
        if (table === 'profile_video_cards') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: existingCard, error: null })
                })
              })
            }),
            insert: vi.fn().mockResolvedValue({ error: null })
          }
        }
        if (table === 'channels') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null })
            })
          }
        }
        return {}
      })
    } as any
  }

  it('should process videos and create cards', async () => {
    const mockVideos = [
      {
        youtube_id: 'video1',
        channel_id: 'channel123',
        channel_name: 'Test Channel',
        title: 'Test Video',
        description: 'Test description',
        published_at: '2024-01-10T00:00:00Z',
        thumbnail_url: 'https://example.com/thumb.jpg'
      }
    ]

    vi.mocked(fetchYouTubeChannelFeed).mockResolvedValue(mockVideos)
    vi.mocked(createServerClient).mockReturnValue(createMockSupabase())

    const result = await processChannelJob('job-1', {
      channel_youtube_id: 'channel123',
      triggered_by: 'manual'
    })

    expect(result.success).toBe(true)
    expect(result.videosProcessed).toBe(1)
  })

  it('should handle empty feed', async () => {
    vi.mocked(fetchYouTubeChannelFeed).mockResolvedValue([])
    vi.mocked(createServerClient).mockReturnValue(createMockSupabase())

    const result = await processChannelJob('job-1', {
      channel_youtube_id: 'channel123',
      triggered_by: 'manual'
    })

    expect(result.success).toBe(true)
    expect(result.videosProcessed).toBe(0)
    expect(result.cardsCreated).toBe(0)
  })

  it('should skip inactive profiles', async () => {
    const mockVideos = [
      {
        youtube_id: 'video1',
        channel_id: 'channel123',
        channel_name: 'Test Channel',
        title: 'Test Video',
        description: 'Test description',
        published_at: '2024-01-10T00:00:00Z',
        thumbnail_url: 'https://example.com/thumb.jpg'
      }
    ]

    vi.mocked(fetchYouTubeChannelFeed).mockResolvedValue(mockVideos)
    vi.mocked(createServerClient).mockReturnValue(createMockSupabase({
      profileSources: [{ profile_id: 'profile-1', profiles: { is_active: false } }]
    }))

    const result = await processChannelJob('job-1', {
      channel_youtube_id: 'channel123',
      triggered_by: 'manual'
    })

    expect(result.success).toBe(true)
    expect(result.cardsCreated).toBe(0)
  })

  it('should handle errors gracefully', async () => {
    vi.mocked(fetchYouTubeChannelFeed).mockRejectedValue(new Error('Network error'))
    vi.mocked(createServerClient).mockReturnValue(createMockSupabase())

    const result = await processChannelJob('job-1', {
      channel_youtube_id: 'channel123',
      triggered_by: 'manual'
    })

    expect(result.success).toBe(false)
    expect(result.videosProcessed).toBe(0)
    expect(result.cardsCreated).toBe(0)
    expect(result.error).toBe('Network error')
  })
})
