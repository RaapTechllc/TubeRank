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
      className="cursor-grab active:cursor-grabbing touch-manipulation focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all duration-200 hover:shadow-md hover:scale-[1.02] group select-none"
      role="article"
      aria-label={`Video: ${video?.title || 'Untitled'} by ${video?.channel_name || 'Unknown channel'}${score !== undefined ? `, Score: ${score}` : ''}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          // Focus the drag handle for keyboard users
          const dragHandle = e.currentTarget.querySelector('[role="button"]') as HTMLElement
          dragHandle?.focus()
        }
      }}
    >
      <CardContent className="p-3">
        <div className="flex gap-2">
          <button 
            {...attributes} 
            {...listeners} 
            className="touch-none p-2 -m-2 lg:p-1 lg:-m-1 rounded focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 opacity-60 group-hover:opacity-100 transition-opacity duration-200 shrink-0" 
            aria-label={`Drag to reorder video: ${video?.title || 'Untitled'}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                // Activate drag mode for keyboard users
                e.currentTarget.focus()
              }
            }}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </button>
          <div className="flex-1 min-w-0">
            {video?.thumbnail_url && (
              <div className="relative overflow-hidden rounded mb-2 group-hover:shadow-sm transition-shadow duration-200">
                <img
                  src={video.thumbnail_url}
                  alt={`Thumbnail for ${video.title}`}
                  className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
              </div>
            )}
            <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors duration-200 leading-tight">
              {video?.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 transition-colors duration-200 truncate">
              {video?.channel_name}
            </p>
            {score !== undefined && (
              <div className="mt-2 flex items-center gap-1">
                <span 
                  className={`text-xs font-medium px-1.5 py-0.5 rounded transition-all duration-200 ${
                    score >= 75 ? 'bg-green-500/20 text-green-500 group-hover:bg-green-500/30' :
                    score >= 50 ? 'bg-yellow-500/20 text-yellow-500 group-hover:bg-yellow-500/30' :
                    'bg-red-500/20 text-red-500 group-hover:bg-red-500/30'
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