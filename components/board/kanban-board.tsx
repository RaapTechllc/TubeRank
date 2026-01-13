'use client'

import { useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useProfileCards, useMoveCard } from '@/lib/hooks/use-board'
import { useBoardStore } from '@/lib/stores/board-store'
import { announceToScreenReader } from '@/lib/utils/focus'
import { LoadingCard } from '@/components/ui/loading'
import { KanbanColumn } from './kanban-column'
import type { CardWithVideo } from '@/types'

const COLUMNS: CardWithVideo['column_status'][] = ['inbox', 'recommended', 'skim', 'watch', 'archived']

interface KanbanBoardProps {
  profileId: string
}

export function KanbanBoard({ profileId }: KanbanBoardProps) {
  const { data: cards, isLoading } = useProfileCards(profileId)
  const moveCardMutation = useMoveCard(profileId)
  const { setCards, moveCard, getColumnCards } = useBoardStore()
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { 
        distance: 8,
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  useEffect(() => {
    if (cards) {
      setCards(cards)
    }
  }, [cards, setCards])
  
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return
    
    const activeId = active.id as string
    const overId = over.id as string
    
    // Find which column the card is being dragged over
    const overColumn = COLUMNS.find(col => col === overId) || 
      COLUMNS.find(col => getColumnCards(col).some(c => c.id === overId))
    
    if (!overColumn) return
    
    const activeCard = useBoardStore.getState().cards[activeId]
    if (activeCard?.column_status !== overColumn) {
      const overCards = getColumnCards(overColumn)
      const overIndex = overCards.findIndex(c => c.id === overId)
      moveCard(activeId, overColumn, overIndex >= 0 ? overIndex : overCards.length)
    }
  }
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    
    const activeId = active.id as string
    const card = useBoardStore.getState().cards[activeId]
    
    if (card) {
      moveCardMutation.mutate({
        cardId: activeId,
        column: card.column_status,
        position: card.position,
      })
      
      // Announce the move to screen readers
      const columnLabels: Record<string, string> = {
        inbox: 'Inbox',
        recommended: 'Recommended', 
        skim: 'Skim',
        watch: 'Watch',
        archived: 'Archived'
      }
      
      announceToScreenReader(
        `Moved ${card.video?.title || 'video'} to ${columnLabels[card.column_status]} column`,
        'assertive'
      )
    }
  }
  
  if (isLoading) {
    return (
      <>
        {/* Mobile loading */}
        <div className="lg:hidden flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <div key={col} className="w-80 shrink-0 space-y-3">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="h-5 bg-muted rounded animate-pulse w-20" />
                <div className="h-6 bg-muted rounded-full animate-pulse w-8" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <LoadingCard key={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Desktop loading */}
        <div className="hidden lg:grid lg:grid-cols-5 gap-6">
          {COLUMNS.map((col) => (
            <div key={col} className="space-y-3">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="h-5 bg-muted rounded animate-pulse w-24" />
                <div className="h-6 bg-muted rounded-full animate-pulse w-8" />
              </div>
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <LoadingCard key={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Live region for screen reader announcements */}
      <div aria-live="assertive" aria-atomic="true" className="sr-only" id="kanban-announcements" />
      
      {/* Mobile: Horizontal scrolling columns */}
      <div className="lg:hidden" role="application" aria-label="Kanban board">
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column}
              id={column}
              cards={getColumnCards(column)}
              isMobile={true}
            />
          ))}
        </div>
      </div>
      
      {/* Desktop: Multi-column layout */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-4" role="application" aria-label="Kanban board">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column}
            id={column}
            cards={getColumnCards(column)}
            isMobile={false}
          />
        ))}
      </div>
    </DndContext>
  )
}