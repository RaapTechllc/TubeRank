'use client'

import { useProfiles } from '@/lib/hooks/use-profiles'
import { ProfileCard } from './profile-card'
import { Card } from '@/components/ui/card'
import { AlertCircle, Database } from 'lucide-react'

export function ProfileList() {
  const { data: profiles, isLoading, error } = useProfiles()

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative">
            <div className="absolute inset-0 bg-primary/5 blur-xl animate-pulse" />
            <Card className="relative h-48 border-2 border-muted-foreground/30 bg-card/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-transparent animate-pulse" />
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border-2 border-muted-foreground/30 bg-muted/50 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-32 bg-muted/50 animate-pulse" />
                    <div className="h-3 w-24 bg-muted/30 animate-pulse" />
                  </div>
                </div>
                <div className="h-px bg-border/50" />
                <div className="flex justify-between items-center">
                  <div className="h-8 w-16 bg-muted/50 animate-pulse" />
                  <div className="h-8 w-20 bg-muted/50 animate-pulse" />
                </div>
              </div>
              {/* Scanning line animation */}
              <div className="absolute inset-x-0 h-[2px] bg-primary/20 animate-[scan-line_2s_ease-in-out_infinite]" />
            </Card>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-destructive/5 blur-xl" />
        <div className="relative border-2 border-destructive bg-card/50 backdrop-blur-sm p-12 text-center">
          <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
            <div className="p-4 border-2 border-destructive bg-destructive/10">
              <AlertCircle className="h-12 w-12 text-destructive" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-xl font-bold font-mono uppercase text-destructive mb-2">
                ERROR_LOADING_PROFILES
              </h3>
              <p className="text-sm text-muted-foreground font-mono tracking-wider">
                Failed to load profiles. Please try again.
              </p>
            </div>
            <div className="mt-4 px-4 py-2 border border-destructive/50 bg-destructive/5">
              <code className="text-xs font-mono text-destructive/80">
                {error.message || 'Unknown error occurred'}
              </code>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profiles?.length) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-muted/5 blur-xl" />
        <div className="relative border-2 border-dashed border-muted-foreground/30 bg-card/30 backdrop-blur-sm p-16 text-center">
          <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
            <div className="p-6 border-2 border-muted-foreground/30 bg-muted/5">
              <Database className="h-16 w-16 text-muted-foreground/50" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-2xl font-bold font-mono uppercase text-muted-foreground mb-3">
                NO_PROFILES_FOUND
              </h3>
              <p className="text-sm text-muted-foreground/70 font-mono tracking-wider">
                Initialize your first profile to begin tracking YouTube content
              </p>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <div className="h-[2px] w-8 bg-muted-foreground/30" />
              <span className="text-xs text-muted-foreground/50 font-mono tracking-widest">EMPTY_STATE</span>
              <div className="h-[2px] w-8 bg-muted-foreground/30" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile, index) => (
        <div
          key={profile.id}
          className="animate-float-in"
          style={{
            animationDelay: `${index * 0.1}s`,
            opacity: 0,
          }}
        >
          <ProfileCard profile={profile} />
        </div>
      ))}
    </div>
  )
}
