import { YoutubeTranscript } from 'youtube-transcript'

/**
 * Transcript segment with timestamps
 */
export interface TranscriptSegment {
  text: string
  duration: number
  offset: number
  lang: string
}

/**
 * Transcript fetcher result
 */
export interface TranscriptResult {
  videoId: string
  language: string
  segments: TranscriptSegment[]
  fullText: string
  hasTimestamps: boolean
}

/**
 * Transcript fetcher errors
 */
export class TranscriptError extends Error {
  constructor(
    message: string,
    public code: 'VIDEO_NOT_FOUND' | 'NO_TRANSCRIPT' | 'API_ERROR' | 'RATE_LIMITED'
  ) {
    super(message)
    this.name = 'TranscriptError'
  }
}

/**
 * Fetch transcript for a YouTube video
 * 
 * @param videoId - YouTube video ID
 * @param language - ISO 639-1 language code (default: 'en')
 * @returns Parsed transcript with segments and full text
 * 
 * @throws TranscriptError if video has no transcript or fetch fails
 * 
 * Quota Cost: 0 (uses scraping, not official API)
 */
export async function fetchTranscript(
  videoId: string,
  language: string = 'en'
): Promise<TranscriptResult> {
  try {
    // Validate video ID format
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      throw new TranscriptError('Invalid YouTube video ID format', 'VIDEO_NOT_FOUND')
    }

    // Fetch transcript using youtube-transcript package
    const segments = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: language,
    })

    if (!segments || segments.length === 0) {
      throw new TranscriptError('No transcript available for this video', 'NO_TRANSCRIPT')
    }

    // Convert segments to our format
    const transcriptSegments: TranscriptSegment[] = segments.map(seg => ({
      text: seg.text,
      duration: seg.duration / 1000, // Convert ms to seconds
      offset: seg.offset / 1000, // Convert ms to seconds
      lang: language,
    }))

    // Build full text
    const fullText = transcriptSegments.map(seg => seg.text).join(' ')

    return {
      videoId,
      language,
      segments: transcriptSegments,
      fullText,
      hasTimestamps: true,
    }
  } catch (error) {
    if (error instanceof TranscriptError) {
      throw error
    }

    // Handle specific errors from youtube-transcript
    if (error instanceof Error) {
      const msg = error.message.toLowerCase()
      if (
        msg.includes('could not retrieve transcript') ||
        msg.includes('transcript is disabled') ||
        msg.includes('no transcript') ||
        msg.includes('transcripts are disabled')
      ) {
        throw new TranscriptError(
          'Video has no available transcript',
          'NO_TRANSCRIPT'
        )
      }
      if (msg.includes('video is unavailable') || msg.includes('video not found')) {
        throw new TranscriptError(
          'Video not found or unavailable',
          'VIDEO_NOT_FOUND'
        )
      }
    }

    throw new TranscriptError(
      `Failed to fetch transcript: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'API_ERROR'
    )
  }
}

/**
 * Check if a video has a transcript without fetching full content
 */
export async function hasTranscript(
  videoId: string,
  language: string = 'en'
): Promise<boolean> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: language,
    })
    return segments && segments.length > 0
  } catch {
    return false
  }
}

/**
 * Fetch transcript in plain text (no timestamps)
 */
export async function fetchTranscriptText(
  videoId: string,
  language: string = 'en'
): Promise<string> {
  const result = await fetchTranscript(videoId, language)
  return result.fullText
}
