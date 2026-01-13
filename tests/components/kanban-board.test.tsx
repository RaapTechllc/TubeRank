import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { KanbanBoard } from '@/components/board/kanban-board'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the hooks
vi.mock('@/lib/hooks/use-board', () => ({
  useProfileCards: vi.fn(),
  useMoveCard: vi.fn(() => ({ mutate: vi.fn() })),
}))

vi.mock('@/lib/stores/board-store', () => ({
  useBoardStore: vi.fn(() => ({
    setCards: vi.fn(),
    moveCard: vi.fn(),
    getColumnCards: vi.fn(() => []),
    cards: {},
  })),
}))

const mockCards = [
  {
    id: 'card-1',
    profile_id: 'profile-1',
    video_id: 'video-1',
    column_status: 'inbox' as const,
    position: 0,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
    video: {
      id: 'video-1',
      youtube_id: 'yt-1',
      title: 'Test Video 1',
      channel_name: 'Test Channel',
      thumbnail_url: 'https://example.com/thumb1.jpg',
      published_at: '2024-01-10T00:00:00Z',
      duration_seconds: 600,
      view_count: 1000,
      like_count: 50,
      comment_count: 10,
      metadata: {},
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-10T00:00:00Z'
    },
    score: {
      id: 'score-1',
      video_id: 'video-1',
      profile_id: 'profile-1',
      overall_score: 85,
      relevance_score: 80,
      novelty_score: 90,
      actionability_score: 85,
      credibility_score: 85,
      efficiency_score: 85,
      time_saved_seconds: 300,
      explanation: 'High relevance and actionability',
      created_at: '2024-01-10T00:00:00Z'
    }
  },
  {
    id: 'card-2',
    profile_id: 'profile-1',
    video_id: 'video-2',
    column_status: 'recommended' as const,
    position: 0,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
    video: {
      id: 'video-2',
      youtube_id: 'yt-2',
      title: 'Test Video 2',
      channel_name: 'Test Channel',
      thumbnail_url: 'https://example.com/thumb2.jpg',
      published_at: '2024-01-09T00:00:00Z',
      duration_seconds: 800,
      view_count: 2000,
      like_count: 100,
      comment_count: 20,
      metadata: {},
      created_at: '2024-01-09T00:00:00Z',
      updated_at: '2024-01-09T00:00:00Z'
    },
    score: {
      id: 'score-2',
      video_id: 'video-2',
      profile_id: 'profile-1',
      overall_score: 75,
      relevance_score: 70,
      novelty_score: 80,
      actionability_score: 75,
      credibility_score: 75,
      efficiency_score: 75,
      time_saved_seconds: 250,
      explanation: 'Good overall score',
      created_at: '2024-01-10T00:00:00Z'
    }
  }
]

describe('KanbanBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading skeleton when isLoading is true', async () => {
    const { useProfileCards } = await import('@/lib/hooks/use-board')
    vi.mocked(useProfileCards).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <KanbanBoard profileId="profile-1" />
      </QueryClientProvider>
    )

    // Should render loading skeletons (5 columns with animate-pulse)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should render board with columns when data is loaded', async () => {
    const { useProfileCards } = await import('@/lib/hooks/use-board')
    vi.mocked(useProfileCards).mockReturnValue({
      data: mockCards,
      isLoading: false,
      error: null,
    } as any)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <KanbanBoard profileId="profile-1" />
      </QueryClientProvider>
    )

    // Should render the board container
    const boardContainer = document.querySelector('.flex.gap-4')
    expect(boardContainer).toBeInTheDocument()
  })
})
