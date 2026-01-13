import Parser from 'rss-parser'
import { RSSFetchError, RSSParseError } from './errors'

export interface ParsedVideo {
  youtube_id: string
  channel_id: string
  channel_name: string
  title: string
  description: string
  published_at: string
  thumbnail_url: string
}

interface YouTubeFeedItem {
  id?: string
  title?: string
  contentSnippet?: string
  pubDate?: string
  link?: string
  'yt:videoId'?: string
  'yt:channelId'?: string
  'media:group'?: {
    'media:description'?: string
    'media:thumbnail'?: Array<{ $: { url: string } }>
  }
  author?: string
}

interface YouTubeFeed {
  items: YouTubeFeedItem[]
  title?: string
}

/**
 * Fetch and parse YouTube channel RSS feed
 * @param channelId - YouTube channel ID
 * @returns Array of parsed videos
 * @throws RSSFetchError on network/fetch errors
 * @throws RSSParseError on parse errors
 */

export async function fetchYouTubeChannelFeed(
  channelId: string
): Promise<ParsedVideo[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`

  try {
    const parser = new Parser({
      customFields: {
        item: [
          ['yt:videoId', 'videoId'],
          ['yt:channelId', 'channelId'],
          ['media:group', 'mediaGroup']
        ]
      }
    })

    const feed = await parser.parseURL(feedUrl) as unknown as YouTubeFeed

    if (!feed.items || feed.items.length === 0) {
      return []
    }

    const channelName = feed.title || 'Unknown Channel'

    return feed.items.map((item): ParsedVideo => {
      const extendedItem = item as YouTubeFeedItem & {
        videoId?: string
        channelId?: string
        mediaGroup?: {
          'media:description'?: string
          'media:thumbnail'?: Array<{ $: { url: string } }>
        }
      }

      const videoId = extendedItem.videoId || item.id?.split(':').pop() || ''
      const channelIdFromFeed = extendedItem.channelId || channelId
      const thumbnail = extendedItem.mediaGroup?.['media:thumbnail']?.[0]?.$?.url ||
                       `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      const description = extendedItem.mediaGroup?.['media:description'] ||
                         item.contentSnippet ||
                         ''

      if (!videoId) {
        throw new RSSParseError(
          `Failed to extract video ID from feed item`,
          channelId
        )
      }

      return {
        youtube_id: videoId,
        channel_id: channelIdFromFeed,
        channel_name: channelName,
        title: item.title || 'Untitled',
        description,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        thumbnail_url: thumbnail
      }
    })
  } catch (error) {
    if (error instanceof RSSParseError) {
      throw error
    }

    const statusCode = (error as any)?.statusCode ||
                      (error as any)?.response?.status

    if (statusCode === 404) {
      throw new RSSFetchError(
        `Channel feed not found (404) - channel may be deleted or private`,
        channelId,
        404
      )
    }

    throw new RSSFetchError(
      `Failed to fetch RSS feed: ${(error as Error).message}`,
      channelId,
      statusCode
    )
  }
}
