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
        className={`flex-1 p-2 rounded-lg transition-all duration-300 ${
          isOver 
            ? 'bg-primary/10 border-2 border-primary/30 border-dashed' 
            : 'bg-muted/50 border-2 border-transparent'
        } ${isMobile ? 'min-h-[50vh] max-h-[70vh]' : 'min-h-[60vh]'} space-y-2 overflow-y-auto`}
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
          <div className="text-center py-8 text-sm text-muted-foreground" role="status">
            Drop cards here
          </div>
        )}
      </div>
    </div>
  )
}