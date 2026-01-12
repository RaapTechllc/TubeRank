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
      activationConstraint: { distance: 8 },
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
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-5 md:overflow-x-visible">
        {COLUMNS.map((col) => (
          <div key={col} className="w-72 shrink-0 md:w-auto">
            <div className="h-8 bg-muted rounded animate-pulse mb-3" />
            <div className="h-96 bg-muted/50 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Mobile: Single column view */}
      <div className="md:hidden" role="application" aria-label="Kanban board">
        <div className="grid grid-cols-1 gap-4">
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
      <div className="hidden md:flex gap-4 overflow-x-auto pb-4" role="application" aria-label="Kanban board">
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