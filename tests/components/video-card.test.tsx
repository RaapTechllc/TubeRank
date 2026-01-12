import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { VideoCard } from '@/components/board/video-card'

const mockCard = {
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
    title: 'Test Video Title',
    channel_name: 'Test Channel',
    thumbnail_url: 'https://example.com/thumb.jpg',
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
    explanation: 'High relevance',
    created_at: '2024-01-10T00:00:00Z'
  }
}

describe('VideoCard', () => {
  it('should render video title and channel name', () => {
    render(<VideoCard card={mockCard} />)

    expect(screen.getByText('Test Video Title')).toBeInTheDocument()
    expect(screen.getByText('Test Channel')).toBeInTheDocument()
  })

  it('should render thumbnail when available', () => {
    render(<VideoCard card={mockCard} />)

    const thumbnail = screen.getByAltText('')
    expect(thumbnail).toBeInTheDocument()
    expect(thumbnail).toHaveAttribute('src', 'https://example.com/thumb.jpg')
  })

  it('should display score with correct color class', () => {
    render(<VideoCard card={mockCard} />)

    const scoreElement = screen.getByText('85')
    expect(scoreElement).toBeInTheDocument()
    expect(scoreElement).toHaveClass('bg-green-500/20')
  })

  it('should not display score when undefined', () => {
    const cardWithoutScore = { ...mockCard, score: undefined }
    render(<VideoCard card={cardWithoutScore} />)

    expect(screen.queryByText(/\d+/)).not.toBeInTheDocument()
  })

  it('should render card container', () => {
    render(<VideoCard card={mockCard} />)

    // Find the card container element
    const cardElement = screen.getByText('Test Video Title').closest('div')
    expect(cardElement).toBeInTheDocument()
  })
})
