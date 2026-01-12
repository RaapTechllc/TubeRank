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
    <div className={`flex flex-col ${isMobile ? 'w-full' : 'w-72 shrink-0'}`}>
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-semibold text-sm">{COLUMN_LABELS[id]}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {cards.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 p-2 rounded-lg bg-muted/50 transition-colors ${
          isOver ? 'bg-muted' : ''
        } ${isMobile ? 'min-h-32' : 'min-h-96'} space-y-2`}
      >
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <VideoCard key={card.id} card={card} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Drop cards here
          </div>
        )}
      </div>
    </div>
  )
}