'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Layers, Search, Radio, TrendingUp, MoreHorizontal, ArrowRight } from 'lucide-react'
import type { ProfileWithSources } from '@/types'

const TYPE_ICONS = {
  channel_stack: Layers,
  video_set: MoreHorizontal,
  keyword_radar: Search,
  category_pulse: TrendingUp,
  custom: Radio,
}

const TYPE_LABELS = {
  channel_stack: 'CHANNEL_STACK',
  video_set: 'VIDEO_SET',
  keyword_radar: 'KEYWORD_RADAR',
  category_pulse: 'CATEGORY_PULSE',
  custom: 'CUSTOM',
}

const TYPE_COLORS = {
  channel_stack: 'text-[var(--neon-green)]',
  video_set: 'text-[var(--neon-cyan)]',
  keyword_radar: 'text-[var(--neon-magenta)]',
  category_pulse: 'text-[var(--chart-4)]',
  custom: 'text-[var(--neon-red)]',
}

const TYPE_BG_COLORS = {
  channel_stack: 'bg-[var(--neon-green)]/10',
  video_set: 'bg-[var(--neon-cyan)]/10',
  keyword_radar: 'bg-[var(--neon-magenta)]/10',
  category_pulse: 'bg-[var(--chart-4)]/10',
  custom: 'bg-[var(--neon-red)]/10',
}

const TYPE_BORDER_COLORS = {
  channel_stack: 'border-[var(--neon-green)]',
  video_set: 'border-[var(--neon-cyan)]',
  keyword_radar: 'border-[var(--neon-magenta)]',
  category_pulse: 'border-[var(--chart-4)]',
  custom: 'border-[var(--neon-red)]',
}

const TYPE_ACTUAL_COLORS = {
  channel_stack: '#00ff41',
  video_set: '#00ffff',
  keyword_radar: '#ff00ff',
  category_pulse: '#ffff00',
  custom: '#ff0055',
}

interface ProfileCardProps {
  profile: ProfileWithSources
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const Icon = TYPE_ICONS[profile.type]
  const sourceCount = profile.profile_sources?.length ?? 0
  const typeColor = TYPE_COLORS[profile.type]
  const typeBgColor = TYPE_BG_COLORS[profile.type]
  const borderColor = TYPE_BORDER_COLORS[profile.type]
  const actualColor = TYPE_ACTUAL_COLORS[profile.type]

  return (
    <div className="group relative perspective-card">
      {/* Background glow effect */}
      <div className={`absolute inset-0 ${typeBgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl`} />

      <Card className={`relative border-2 ${borderColor} bg-card/95 backdrop-blur-sm transition-all duration-300 hover:translate-x-[-4px] hover:translate-y-[-4px] overflow-hidden group-hover:border-glow`}>
        {/* Corner accent */}
        <div className={`absolute top-0 right-0 w-24 h-24 ${typeBgColor} transform rotate-45 translate-x-12 -translate-y-12`} />

        {/* Scan line effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className={`absolute inset-x-0 h-[2px] ${typeBgColor} animate-[scan-line_3s_ease-in-out_infinite]`} />
        </div>

        {/* Data streams on sides */}
        <div className="absolute left-0 top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-current to-transparent opacity-20" style={{ color: actualColor }} />

        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`p-2 border-2 ${borderColor} ${typeBgColor} shrink-0`}>
                <Icon className={`h-5 w-5 ${typeColor}`} strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl font-bold tracking-tight text-foreground mb-1 font-mono uppercase truncate group-hover:text-shadow-neon transition-all">
                  {profile.name}
                </CardTitle>
                <CardDescription className={`text-xs tracking-widest font-mono ${typeColor} flex items-center gap-2`}>
                  {TYPE_LABELS[profile.type]}
                  <span className="text-[8px] px-1 py-0.5 border border-current opacity-50">v1.0</span>
                </CardDescription>
              </div>
            </div>
            <Link href={`/profile/${profile.id}/edit`}>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 hover:bg-muted/50 border border-transparent hover:border-border"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="pt-4 border-t-2 border-border/50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 border ${borderColor} ${typeBgColor}`}>
                <span className={`text-sm font-bold font-mono ${typeColor}`}>
                  {String(sourceCount).padStart(2, '0')}
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                Source{sourceCount !== 1 ? 's' : ''}
              </span>
            </div>

            <Link href={`/profile/${profile.id}`} className="group/btn">
              <Button
                variant="outline"
                size="sm"
                className={`font-mono uppercase text-xs tracking-wider border-2 ${borderColor} ${typeColor} hover:bg-current hover:text-background transition-all`}
              >
                Open
                <ArrowRight className="h-3 w-3 ml-2 group-hover/btn:translate-x-1 transition-transform" strokeWidth={3} />
              </Button>
            </Link>
          </div>
        </CardContent>

        {/* Status indicator */}
        {profile.is_active && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <div className={`w-2 h-2 ${typeColor} animate-pulse-glow rounded-full`} />
            <span className="text-[8px] font-mono text-muted-foreground/50 uppercase tracking-widest">Active</span>
          </div>
        )}

        {/* Timestamp watermark */}
        <div className="absolute bottom-2 left-3 text-[8px] font-mono text-muted-foreground/30 tracking-wider">
          {new Date(profile.updated_at).toISOString().split('T')[0]?.replace(/-/g, '.') ?? ''}
        </div>
      </Card>
    </div>
  )
}
