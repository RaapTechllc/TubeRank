'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Save, RefreshCw, Settings as SettingsIcon } from 'lucide-react'
import { toast } from 'sonner'

interface UserSettings {
  digest_enabled: boolean
  default_score_threshold: number
}

interface SettingsResponse {
  settings: UserSettings
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    digest_enabled: true,
    default_score_threshold: 75,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalSettings, setOriginalSettings] = useState<UserSettings>({
    digest_enabled: true,
    default_score_threshold: 75,
  })

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }
      const data: SettingsResponse = await response.json()
      setSettings(data.settings)
      setOriginalSettings(data.settings)
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      const data: SettingsResponse = await response.json()
      setSettings(data.settings)
      setOriginalSettings(data.settings)
      setHasChanges(false)
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const resetSettings = () => {
    setSettings(originalSettings)
    setHasChanges(false)
  }

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 sm:h-8 sm:w-8 bg-muted rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 sm:h-8 w-24 sm:w-32 bg-muted rounded animate-pulse" />
            <div className="h-3 sm:h-4 w-36 sm:w-48 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 sm:gap-6">
          <div className="h-40 sm:h-48 bg-muted rounded-lg animate-pulse" />
          <div className="h-24 sm:h-32 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
          <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your TubeRank preferences and notifications
          </p>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="grid gap-4 sm:gap-6">
        {/* Digest Settings */}
        <Card>
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Daily Digest</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Configure how you receive daily summaries of high-scoring videos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-1 flex-1">
                <Label htmlFor="digest-enabled" className="text-sm sm:text-base font-medium">
                  Enable Daily Digest
                </Label>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Receive daily summaries of high-scoring videos from your profiles
                </div>
              </div>
              <Switch
                id="digest-enabled"
                checked={settings.digest_enabled}
                onCheckedChange={(checked) => updateSetting('digest_enabled', checked)}
                className="shrink-0"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="score-threshold" className="text-sm sm:text-base font-medium">
                  Score Threshold
                </Label>
                <span className="text-xs sm:text-sm font-medium bg-muted px-2 py-1 rounded shrink-0">
                  {settings.default_score_threshold}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mb-3">
                Only include videos with scores above this threshold in your digest
              </div>
              <Slider
                id="score-threshold"
                min={0}
                max={100}
                step={5}
                value={[settings.default_score_threshold]}
                onValueChange={([value]) => updateSetting('default_score_threshold', value ?? 75)}
                className="w-full"
                disabled={!settings.digest_enabled}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Future Settings Placeholder */}
        <Card className="opacity-60">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-lg sm:text-xl">
              <span>Notification Preferences</span>
              <span className="text-xs bg-muted px-2 py-1 rounded self-start">Coming Soon</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Configure how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs sm:text-sm text-muted-foreground">
              Email notifications, push notifications, and other alert preferences will be available in a future update.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex flex-col gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg border animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex-1">
            <p className="text-sm font-medium">You have unsaved changes</p>
            <p className="text-xs text-muted-foreground">
              Save your changes to apply the new settings
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={resetSettings}
              disabled={isSaving}
              className="w-full sm:w-auto transition-all duration-200 hover:scale-105 order-2 sm:order-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={saveSettings}
              disabled={isSaving}
              className="w-full sm:w-auto transition-all duration-200 hover:scale-105 order-1 sm:order-2"
            >
              <Save className={`h-4 w-4 mr-2 ${isSaving ? 'animate-spin' : ''}`} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}