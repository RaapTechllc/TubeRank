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
      className="cursor-grab active:cursor-grabbing touch-manipulation focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02] hover:border-primary/20 group select-none relative overflow-hidden"
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
      <CardContent className="p-3 relative">
        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
        
        <div className="flex gap-2 relative z-10">
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
              <div className="relative overflow-hidden rounded mb-2 group-hover:shadow-md transition-all duration-300">
                <img
                  src={video.thumbnail_url}
                  alt={`Thumbnail for ${video.title}`}
                  className="w-full aspect-video object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse" />
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
                  className={`text-xs font-medium px-2 py-1 rounded-full transition-all duration-300 transform group-hover:scale-105 ${
                    score >= 75 ? 'bg-green-500/20 text-green-400 group-hover:bg-green-500/30 group-hover:shadow-lg group-hover:shadow-green-500/20' :
                    score >= 50 ? 'bg-yellow-500/20 text-yellow-400 group-hover:bg-yellow-500/30 group-hover:shadow-lg group-hover:shadow-yellow-500/20' :
                    'bg-red-500/20 text-red-400 group-hover:bg-red-500/30 group-hover:shadow-lg group-hover:shadow-red-500/20'
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