'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { GripVertical } from 'lucide-react'
import type { CardWithVideo } from '@/types'

interface VideoCardProps {
  card: CardWithVideo
}

export function VideoCard({ card }: VideoCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  
  const video = card.video
  const score = card.score?.overall_score
  
  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-grab active:cursor-grabbing touch-manipulation focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      role="article"
      aria-label={`Video: ${video?.title || 'Untitled'} by ${video?.channel_name || 'Unknown channel'}`}
    >
      <CardContent className="p-3">
        <div className="flex gap-2">
          <button 
            {...attributes} 
            {...listeners} 
            className="touch-none p-1 -m-1 md:p-0 md:m-0 rounded focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" 
            aria-label={`Drag to reorder video: ${video?.title || 'Untitled'}`}
            tabIndex={0}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </button>
          <div className="flex-1 min-w-0">
            {video?.thumbnail_url && (
              <img
                src={video.thumbnail_url}
                alt={`Thumbnail for ${video.title}`}
                className="w-full aspect-video object-cover rounded mb-2"
              />
            )}
            <h4 className="text-sm font-medium line-clamp-2">{video?.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{video?.channel_name}</p>
            {score !== undefined && (
              <div className="mt-2 flex items-center gap-1">
                <span 
                  className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                    score >= 75 ? 'bg-green-500/20 text-green-500' :
                    score >= 50 ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-red-500/20 text-red-500'
                  }`}
                  aria-label={`Score: ${score} out of 100`}
                >
                  {score}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}