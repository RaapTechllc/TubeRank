'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    <form onSubmit={handleSubmit(onSubmit)} role="form" aria-label={profile ? 'Edit profile form' : 'Create profile form'}>
      <Card>
        <CardHeader>
          <CardTitle id="form-title">{profile ? 'Edit Profile' : 'Create Profile'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="profile-name" className="text-sm font-medium">
              Profile Name
              <span className="text-destructive ml-1" aria-label="required">*</span>
            </Label>
            <Input
              id="profile-name"
              {...register('name')}
              placeholder="My Profile"
              aria-describedby={errors.name ? 'name-error' : undefined}
              aria-invalid={!!errors.name}
              autoComplete="off"
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="profile-type" className="text-sm font-medium">
              Profile Type
              <span className="text-destructive ml-1" aria-label="required">*</span>
            </Label>
            <select
              id="profile-type"
              {...register('type')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!!profile}
              aria-describedby={errors.type ? 'type-error' : 'type-description'}
              aria-invalid={!!errors.type}
            >
              {PROFILE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
            <p id="type-description" className="text-xs text-muted-foreground">
              Choose the type of profile that best fits your content curation needs
            </p>
            {errors.type && (
              <p id="type-error" className="text-sm text-destructive" role="alert">
                {errors.type.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="system-prompt" className="text-sm font-medium">
                System Prompt (optional)
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetPrompt}
                className="h-7 text-xs"
                aria-label="Reset system prompt to default"
              >
                <RotateCcw className="w-3 h-3 mr-1" aria-hidden="true" />
                Reset to Default
              </Button>
            </div>
            <textarea
              id="system-prompt"
              {...register('system_prompt')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-32 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="AI instructions for analyzing videos..."
              onBlur={() => setHasEditedPrompt(true)}
              aria-describedby={errors.system_prompt ? 'prompt-error' : 'prompt-description'}
              aria-invalid={!!errors.system_prompt}
            />
            <p id="prompt-description" className="text-xs text-muted-foreground">
              Custom instructions for the AI to analyze and score videos according to your preferences
            </p>
            {errors.system_prompt && (
              <p id="prompt-error" className="text-sm text-destructive" role="alert">
                {errors.system_prompt.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            disabled={isLoading}
            aria-describedby="submit-status"
          >
            {isLoading ? 'Saving...' : profile ? 'Save Changes' : 'Create Profile'}
          </Button>
          {isLoading && (
            <span id="submit-status" className="sr-only" aria-live="polite">
              Form is being submitted, please wait
            </span>
          )}
        </CardFooter>
      </Card>
    </form>
  )
}