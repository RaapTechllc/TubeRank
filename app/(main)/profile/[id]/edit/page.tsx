'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProfileForm } from '@/components/profiles/profile-form'
import { useProfile, useUpdateProfile, useDeleteProfile } from '@/lib/hooks/use-profiles'
import { ArrowLeft } from 'lucide-react'
import type { CreateProfileInput } from '@/lib/validations/profile'

export default function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: profile, isLoading } = useProfile(id)
  const updateProfile = useUpdateProfile(id)
  const deleteProfile = useDeleteProfile()
  
  const handleSubmit = async (data: CreateProfileInput) => {
    await updateProfile.mutateAsync(data)
    router.push(`/profile/${id}`)
  }
  
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this profile?')) {
      await deleteProfile.mutateAsync(id)
      router.push('/dashboard')
    }
  }
  
  if (isLoading) {
    return (
      <div className="max-w-xl">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
        <div className="h-64 bg-muted/50 rounded animate-pulse" />
      </div>
    )
  }
  
  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Profile not found</p>
        <Link href="/dashboard">
          <Button variant="link">Back to Dashboard</Button>
        </Link>
      </div>
    )
  }
  
  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/profile/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
      </div>
      <ProfileForm
        profile={profile}
        onSubmit={handleSubmit}
        isLoading={updateProfile.isPending}
      />
      <div className="mt-8 pt-8 border-t">
        <h2 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h2>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleteProfile.isPending}
        >
          {deleteProfile.isPending ? 'Deleting...' : 'Delete Profile'}
        </Button>
      </div>
    </div>
  )
}
