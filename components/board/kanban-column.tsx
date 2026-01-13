'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { VideoCard } from './video-card'
import type { CardWithVideo } from '@/types'

const COLUMN_LABELS: Record<string, string> = {
  inbox: 'Inbox',
  recommended: 'Recommended',
  skim: 'Skim',
  watch: 'Watch',
  archived: 'Archived',
}

interface KanbanColumnProps {
  id: string
  cards: CardWithVideo[]
  isMobile?: boolean
}

export function KanbanColumn({ id, cards, isMobile = false }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  
  return (
    <div className={`flex flex-col ${isMobile ? 'w-80 shrink-0 snap-start' : 'w-full min-w-0'}`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-semibold text-sm truncate" id={`column-${id}-title`}>
          {COLUMN_LABELS[id]}
        </h3>
        <span 
          className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0 ml-2"
          aria-label={`${cards.length} cards in ${COLUMN_LABELS[id]} column`}
        >
          {cards.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 rounded-xl transition-all duration-500 ${
          isOver 
            ? 'bg-primary/15 border-2 border-primary/50 border-dashed shadow-lg shadow-primary/20 scale-[1.02]' 
            : 'bg-muted/30 border-2 border-transparent hover:bg-muted/50 hover:border-muted-foreground/20'
        } ${isMobile ? 'min-h-[50vh] max-h-[70vh]' : 'min-h-[60vh]'} space-y-3 overflow-y-auto backdrop-blur-sm`}
        role="region"
        aria-labelledby={`column-${id}-title`}
        aria-describedby={`column-${id}-description`}
      >
        <div id={`column-${id}-description`} className="sr-only">
          Drop zone for {COLUMN_LABELS[id]} cards. Use arrow keys to navigate and space to pick up or drop cards.
        </div>
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <VideoCard key={card.id} card={card} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground transition-all duration-300 hover:text-foreground" role="status">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-dashed border-muted-foreground/50 rounded" />
            </div>
            <p>Drop cards here</p>
            <p className="text-xs mt-1 opacity-60">Drag videos to organize</p>
          </div>
        )}
      </div>
    </div>
  )
}