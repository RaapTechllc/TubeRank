'use client'

import { useRouter } from 'next/navigation'
import { ProfileForm } from '@/components/profiles/profile-form'
import { useCreateProfile } from '@/lib/hooks/use-profiles'
import type { CreateProfileInput } from '@/lib/validations/profile'

export default function NewProfilePage() {
  const router = useRouter()
  const createProfile = useCreateProfile()
  
  const handleSubmit = async (data: CreateProfileInput) => {
    const profile = await createProfile.mutateAsync(data)
    router.push(`/profile/${profile.id}`)
  }
  
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Create Profile</h1>
      <ProfileForm onSubmit={handleSubmit} isLoading={createProfile.isPending} />
    </div>
  )
}
