import { create } from 'zustand'
import type { CardWithVideo } from '@/types'

type ColumnStatus = CardWithVideo['column_status']

interface BoardState {
  cards: Record<string, CardWithVideo>
  columns: Record<ColumnStatus, string[]>
  setCards: (cards: CardWithVideo[]) => void
  moveCard: (cardId: string, toColumn: ColumnStatus, toIndex: number) => void
  getColumnCards: (column: ColumnStatus) => CardWithVideo[]
}

const COLUMNS: ColumnStatus[] = ['inbox', 'recommended', 'skim', 'watch', 'archived']

/**
 * Zustand store for Kanban board state management
 * Provides reactive card data and drag-drop operations
 */
export const useBoardStore = create<BoardState>((set, get) => ({
  cards: {},
  columns: {
    inbox: [],
    recommended: [],
    skim: [],
    watch: [],
    archived: [],
  },

  setCards: (cards) => {
    const cardsMap: Record<string, CardWithVideo> = {}
    const columns: Record<ColumnStatus, string[]> = {
      inbox: [],
      recommended: [],
      skim: [],
      watch: [],
      archived: [],
    }

    for (const card of cards) {
      cardsMap[card.id] = card
      columns[card.column_status].push(card.id)
    }

    // Sort each column by position
    for (const col of COLUMNS) {
      columns[col].sort((a, b) => {
        const cardA = cardsMap[a]
        const cardB = cardsMap[b]
        return (cardA?.position ?? 0) - (cardB?.position ?? 0)
      })
    }

    set({ cards: cardsMap, columns })
  },

  moveCard: (cardId, toColumn, toIndex) => {
    set((state) => {
      const card = state.cards[cardId]
      if (!card) return state

      const fromColumn = card.column_status
      const newColumns = { ...state.columns }

      // Remove from old column
      newColumns[fromColumn] = newColumns[fromColumn].filter(id => id !== cardId)

      // Add to new column at index
      newColumns[toColumn] = [...newColumns[toColumn]]
      newColumns[toColumn].splice(toIndex, 0, cardId)

      // Update card
      const newCards = {
        ...state.cards,
        [cardId]: { ...card, column_status: toColumn, position: toIndex },
      }

      return { cards: newCards, columns: newColumns }
    })
  },

  getColumnCards: (column) => {
    const state = get()
    return state.columns[column].map(id => state.cards[id]).filter((card): card is CardWithVideo => card !== undefined)
  },
}))
