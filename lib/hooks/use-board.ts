import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CardWithVideo } from '@/types'

/**
 * Fetch cards for a profile
 * @param profileId - Profile ID
 * @returns Query result with cards data
 */
export function useProfileCards(profileId: string) {
  return useQuery<CardWithVideo[]>({
    queryKey: ['cards', profileId],
    queryFn: async () => {
      const res = await fetch(`/api/profiles/${profileId}/cards`)
      if (!res.ok) throw new Error('Failed to fetch cards')
      return res.json()
    },
    enabled: !!profileId,
  })
}

/**
 * Move card to different column with optimistic updates
 * @param profileId - Profile ID
 * @returns Mutation for moving cards
 */
export function useMoveCard(profileId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ cardId, column, position }: {
      cardId: string
      column: string
      position: number
    }) => {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column_status: column, position }),
      })
      if (!res.ok) throw new Error('Failed to move card')
      return res.json()
    },
    onMutate: async ({ cardId, column, position }) => {
      await queryClient.cancelQueries({ queryKey: ['cards', profileId] })

      const previous = queryClient.getQueryData<CardWithVideo[]>(['cards', profileId])

      queryClient.setQueryData<CardWithVideo[]>(['cards', profileId], (old) => {
        if (!old) return old
        return old.map(card =>
          card.id === cardId
            ? { ...card, column_status: column as CardWithVideo['column_status'], position }
            : card
        )
      })

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['cards', profileId], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', profileId] })
    },
  })
}
