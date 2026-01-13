'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { createProfileSchema, type CreateProfileInput } from '@/lib/validations/profile'
import type { Profile } from '@/types'
import { getDefaultPromptForType } from '@/lib/constants/profile-prompts'

interface ProfileFormProps {
  profile?: Profile
  onSubmit: (data: CreateProfileInput) => void
  isLoading?: boolean
}

const PROFILE_TYPES = [
  { value: 'channel_stack', label: 'Channel Stack', description: 'Track uploads from favorite channels' },
  { value: 'video_set', label: 'Video Set', description: 'Curate specific videos manually' },
  { value: 'keyword_radar', label: 'Keyword Radar', description: 'Alert on keyword matches' },
  { value: 'category_pulse', label: 'Category Pulse', description: 'Top videos in a category' },
  { value: 'custom', label: 'Custom', description: 'Custom profile configuration' },
] as const

export function ProfileForm({ profile, onSubmit, isLoading }: ProfileFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateProfileInput>({
    resolver: zodResolver(createProfileSchema),
    defaultValues: {
      name: profile?.name ?? '',
      type: profile?.type ?? 'channel_stack',
      system_prompt: profile?.system_prompt ?? getDefaultPromptForType(profile?.type ?? 'channel_stack'),
    },
  })

  const selectedType = watch('type')
  const [hasEditedPrompt, setHasEditedPrompt] = useState(false)

  // Auto-fill prompt when type changes (only for new profiles)
  useEffect(() => {
    if (!profile && !hasEditedPrompt) {
      setValue('system_prompt', getDefaultPromptForType(selectedType))
    }
  }, [selectedType, profile, hasEditedPrompt, setValue])

  // Handler for reset button
  const handleResetPrompt = () => {
    setValue('system_prompt', getDefaultPromptForType(selectedType))
    setHasEditedPrompt(false)
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>{profile ? 'Edit Profile' : 'Create Profile'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              {...register('name')}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="My Profile"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium">Type</label>
            <select
              {...register('type')}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              disabled={!!profile}
            >
              {PROFILE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">System Prompt (optional)</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetPrompt}
                className="h-7 text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset to Default
              </Button>
            </div>
            <textarea
              {...register('system_prompt')}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-32"
              placeholder="AI instructions for analyzing videos..."
              onBlur={() => setHasEditedPrompt(true)}
            />
            {errors.system_prompt && (
              <p className="mt-1 text-sm text-destructive">{errors.system_prompt.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : profile ? 'Save Changes' : 'Create Profile'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
