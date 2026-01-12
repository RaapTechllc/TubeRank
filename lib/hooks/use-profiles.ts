import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ProfileWithSources } from '@/types'
import type { CreateProfileInput, UpdateProfileInput } from '@/lib/validations/profile'

export function useProfiles() {
  return useQuery<ProfileWithSources[]>({
    queryKey: ['profiles'],
    queryFn: async () => {
      const res = await fetch('/api/profiles')
      if (!res.ok) throw new Error('Failed to fetch profiles')
      return res.json()
    },
  })
}

export function useProfile(id: string) {
  return useQuery<ProfileWithSources>({
    queryKey: ['profiles', id],
    queryFn: async () => {
      const res = await fetch(`/api/profiles/${id}`)
      if (!res.ok) throw new Error('Failed to fetch profile')
      return res.json()
    },
    enabled: !!id,
  })
}

export function useCreateProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: CreateProfileInput) => {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error?.fieldErrors ? 'Validation failed' : error.error)
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}

export function useUpdateProfile(id: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const res = await fetch(`/api/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error('Failed to update profile')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['profiles', id] })
    },
  })
}

export function useDeleteProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/profiles/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete profile')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}

interface ProfileChannelsData {
  channels: Array<{
    youtube_id: string
    name: string
    last_checked_at: string | null
    trust_score: number
  }>
  lastCheckedAt: string | null
}

export function useProfileChannels(profileId: string) {
  return useQuery<ProfileChannelsData>({
    queryKey: ['profile-channels', profileId],
    queryFn: async () => {
      const res = await fetch(`/api/profiles/${profileId}/channels`)
      if (!res.ok) throw new Error('Failed to fetch profile channels')
      return res.json()
    },
    enabled: !!profileId,
    staleTime: 60000, // 1 minute
  })
}
