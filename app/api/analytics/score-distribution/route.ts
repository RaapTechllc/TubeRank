import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

type ScoreDimension = 'overall' | 'relevance' | 'novelty' | 'actionability' | 'credibility' | 'efficiency'

interface HistogramBucket {
  range: string
  min: number
  max: number
  count: number
  percentage: number
}

interface ScoreStats {
  mean: number
  median: number
  min: number
  max: number
  stdDev: number
  q1: number
  q3: number
  count: number
}

interface RadarData {
  dimension: string
  value: number
  fullMark: number
}

interface ScoreDistributionResponse {
  histogram: HistogramBucket[]
  stats: ScoreStats
  radar: RadarData[]
  rawScores: number[]
}

function calculateStats(scores: number[]): ScoreStats {
  if (scores.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0, q1: 0, q3: 0, count: 0 }
  }

  const sorted = [...scores].sort((a, b) => a - b)
  const n = sorted.length

  // Mean
  const mean = scores.reduce((a, b) => a + b, 0) / n

  // Median
  const medianValue = n % 2 === 0
    ? ((sorted[n / 2 - 1] ?? 0) + (sorted[n / 2] ?? 0)) / 2
    : sorted[Math.floor(n / 2)] ?? 0

  // Quartiles
  const q1Index = Math.floor(n * 0.25)
  const q3Index = Math.floor(n * 0.75)
  const q1Value = sorted[q1Index] ?? 0
  const q3Value = sorted[q3Index] ?? 0

  // Standard Deviation
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / n
  const stdDev = Math.sqrt(variance)

  return {
    mean: Math.round(mean * 10) / 10,
    median: Math.round(medianValue * 10) / 10,
    min: sorted[0] ?? 0,
    max: sorted[n - 1] ?? 0,
    stdDev: Math.round(stdDev * 10) / 10,
    q1: Math.round(q1Value * 10) / 10,
    q3: Math.round(q3Value * 10) / 10,
    count: n
  }
}

function createHistogram(scores: number[], bucketCount: number = 10): HistogramBucket[] {
  if (scores.length === 0) {
    return []
  }

  // Create buckets from 0-100 with specified count
  const bucketSize = 100 / bucketCount
  const buckets: HistogramBucket[] = []

  for (let i = 0; i < bucketCount; i++) {
    const min = i * bucketSize
    const max = (i + 1) * bucketSize
    buckets.push({
      range: `${Math.round(min)}-${Math.round(max)}`,
      min: Math.round(min),
      max: Math.round(max),
      count: 0,
      percentage: 0
    })
  }

  // Count scores in each bucket
  for (const score of scores) {
    const bucketIndex = Math.min(Math.floor(score / bucketSize), bucketCount - 1)
    const bucket = buckets[bucketIndex]
    if (bucket) bucket.count++
  }

  // Calculate percentages
  const total = scores.length
  for (const bucket of buckets) {
    bucket.percentage = Math.round((bucket.count / total) * 1000) / 10
  }

  return buckets
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const profileId = searchParams.get('profileId')
  const dimension = (searchParams.get('dimension') || 'overall') as ScoreDimension

  const supabase = createServerClient()

  try {
    // Build query for scores
    let query = supabase
      .from('scores')
      .select('overall_score, relevance_score, novelty_score, actionability_score, credibility_score, efficiency_score')

    if (profileId) {
      query = query.eq('profile_id', profileId)
    }

    const { data: scores, error } = await query

    if (error) {
      console.error('Analytics score-distribution query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!scores || scores.length === 0) {
      const emptyResponse: ScoreDistributionResponse = {
        histogram: createHistogram([]),
        stats: calculateStats([]),
        radar: [
          { dimension: 'Relevance', value: 0, fullMark: 100 },
          { dimension: 'Novelty', value: 0, fullMark: 100 },
          { dimension: 'Actionability', value: 0, fullMark: 100 },
          { dimension: 'Credibility', value: 0, fullMark: 100 },
          { dimension: 'Efficiency', value: 0, fullMark: 100 }
        ],
        rawScores: []
      }
      return NextResponse.json(emptyResponse)
    }

    // Map dimension to column name
    const dimensionColumn: Record<ScoreDimension, keyof typeof scores[0]> = {
      overall: 'overall_score',
      relevance: 'relevance_score',
      novelty: 'novelty_score',
      actionability: 'actionability_score',
      credibility: 'credibility_score',
      efficiency: 'efficiency_score'
    }

    // Extract scores for the requested dimension
    const columnName = dimensionColumn[dimension]
    const dimensionScores = scores
      .map(s => s[columnName])
      .filter((s): s is number => s !== null && s !== undefined)

    // Create histogram and stats
    const histogram = createHistogram(dimensionScores, 10)
    const stats = calculateStats(dimensionScores)

    // Calculate radar chart data (average of each dimension)
    const radarDimensions: Array<{ key: keyof typeof scores[0]; label: string }> = [
      { key: 'relevance_score', label: 'Relevance' },
      { key: 'novelty_score', label: 'Novelty' },
      { key: 'actionability_score', label: 'Actionability' },
      { key: 'credibility_score', label: 'Credibility' },
      { key: 'efficiency_score', label: 'Efficiency' }
    ]

    const radar: RadarData[] = radarDimensions.map(({ key, label }) => {
      const values = scores
        .map(s => s[key])
        .filter((v): v is number => v !== null && v !== undefined)

      const average = values.length > 0
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : 0

      return {
        dimension: label,
        value: average,
        fullMark: 100
      }
    })

    const response: ScoreDistributionResponse = {
      histogram,
      stats,
      radar,
      rawScores: dimensionScores.slice(0, 500) // Limit for performance
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Analytics score-distribution error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch score distribution data' },
      { status: 500 }
    )
  }
}
