import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DateRange, ScoreDimension, GroupBy, SortBy, SortOrder } from '@/lib/hooks/use-analytics'

interface AnalyticsFilters {
  dateRange: DateRange
  profileId: string | null
  selectedProfiles: string[]
  scoreDimension: ScoreDimension
  velocityGroupBy: GroupBy
  channelSortBy: SortBy
  channelSortOrder: SortOrder
}

interface AnalyticsPreferences {
  showSparklines: boolean
  showPercentages: boolean
  compactMode: boolean
  defaultView: 'overview' | 'performance' | 'scores' | 'channels' | 'velocity' | 'workflow'
}

interface AnalyticsState {
  // Filters
  filters: AnalyticsFilters
  setDateRange: (range: DateRange) => void
  setProfileId: (id: string | null) => void
  setSelectedProfiles: (ids: string[]) => void
  addSelectedProfile: (id: string) => void
  removeSelectedProfile: (id: string) => void
  setScoreDimension: (dimension: ScoreDimension) => void
  setVelocityGroupBy: (groupBy: GroupBy) => void
  setChannelSortBy: (sortBy: SortBy) => void
  setChannelSortOrder: (order: SortOrder) => void
  resetFilters: () => void

  // Preferences
  preferences: AnalyticsPreferences
  setShowSparklines: (show: boolean) => void
  setShowPercentages: (show: boolean) => void
  setCompactMode: (compact: boolean) => void
  setDefaultView: (view: AnalyticsPreferences['defaultView']) => void

  // UI State
  expandedSections: Set<string>
  toggleSection: (sectionId: string) => void
  isExpanded: (sectionId: string) => boolean
}

const defaultFilters: AnalyticsFilters = {
  dateRange: '30d',
  profileId: null,
  selectedProfiles: [],
  scoreDimension: 'overall',
  velocityGroupBy: 'day',
  channelSortBy: 'trust',
  channelSortOrder: 'desc',
}

const defaultPreferences: AnalyticsPreferences = {
  showSparklines: true,
  showPercentages: true,
  compactMode: false,
  defaultView: 'overview',
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      // Filters
      filters: defaultFilters,

      setDateRange: (range) =>
        set((state) => ({
          filters: { ...state.filters, dateRange: range },
        })),

      setProfileId: (id) =>
        set((state) => ({
          filters: { ...state.filters, profileId: id },
        })),

      setSelectedProfiles: (ids) =>
        set((state) => ({
          filters: { ...state.filters, selectedProfiles: ids },
        })),

      addSelectedProfile: (id) =>
        set((state) => ({
          filters: {
            ...state.filters,
            selectedProfiles: [...state.filters.selectedProfiles, id],
          },
        })),

      removeSelectedProfile: (id) =>
        set((state) => ({
          filters: {
            ...state.filters,
            selectedProfiles: state.filters.selectedProfiles.filter((p) => p !== id),
          },
        })),

      setScoreDimension: (dimension) =>
        set((state) => ({
          filters: { ...state.filters, scoreDimension: dimension },
        })),

      setVelocityGroupBy: (groupBy) =>
        set((state) => ({
          filters: { ...state.filters, velocityGroupBy: groupBy },
        })),

      setChannelSortBy: (sortBy) =>
        set((state) => ({
          filters: { ...state.filters, channelSortBy: sortBy },
        })),

      setChannelSortOrder: (order) =>
        set((state) => ({
          filters: { ...state.filters, channelSortOrder: order },
        })),

      resetFilters: () =>
        set({ filters: defaultFilters }),

      // Preferences
      preferences: defaultPreferences,

      setShowSparklines: (show) =>
        set((state) => ({
          preferences: { ...state.preferences, showSparklines: show },
        })),

      setShowPercentages: (show) =>
        set((state) => ({
          preferences: { ...state.preferences, showPercentages: show },
        })),

      setCompactMode: (compact) =>
        set((state) => ({
          preferences: { ...state.preferences, compactMode: compact },
        })),

      setDefaultView: (view) =>
        set((state) => ({
          preferences: { ...state.preferences, defaultView: view },
        })),

      // UI State
      expandedSections: new Set(['overview', 'performance', 'scores']),

      toggleSection: (sectionId) =>
        set((state) => {
          const newExpanded = new Set(state.expandedSections)
          if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId)
          } else {
            newExpanded.add(sectionId)
          }
          return { expandedSections: newExpanded }
        }),

      isExpanded: (sectionId) => get().expandedSections.has(sectionId),
    }),
    {
      name: 'tuberank-analytics',
      partialize: (state) => ({
        filters: state.filters,
        preferences: state.preferences,
      }),
    }
  )
)

// Selector hooks for common use cases
export const useAnalyticsFilters = () => useAnalyticsStore((state) => state.filters)
export const useAnalyticsPreferences = () => useAnalyticsStore((state) => state.preferences)
export const useDateRange = () => useAnalyticsStore((state) => state.filters.dateRange)
export const useProfileFilter = () => useAnalyticsStore((state) => state.filters.profileId)
