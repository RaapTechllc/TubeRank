/**
 * Database Index Performance Monitor
 * Utility to check index usage and query performance
 */

import { createServerClient } from '@/lib/supabase/server'

export interface IndexStats {
  schemaname: string
  tablename: string
  indexname: string
  num_scans: number
  tup_read: number
  tup_fetch: number
}

export interface TableStats {
  schemaname: string
  tablename: string
  seq_scan: number
  seq_tup_read: number
  idx_scan: number
  idx_tup_fetch: number
  n_tup_ins: number
  n_tup_upd: number
  n_tup_del: number
}

/**
 * Get index usage statistics
 * @returns Array of index statistics
 */
export async function getIndexStats(): Promise<IndexStats[]> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase.rpc('get_index_stats', {
    query: `
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan as num_scans,
        idx_tup_read as tup_read,
        idx_tup_fetch as tup_fetch
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
    `
  })

  if (error) throw error
  return data || []
}

/**
 * Get table scan statistics
 * @returns Array of table statistics
 */
export async function getTableStats(): Promise<TableStats[]> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase.rpc('get_table_stats', {
    query: `
      SELECT 
        schemaname,
        tablename,
        seq_scan,
        seq_tup_read,
        idx_scan,
        idx_tup_fetch,
        n_tup_ins,
        n_tup_upd,
        n_tup_del
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY seq_scan DESC
    `
  })

  if (error) throw error
  return data || []
}

/**
 * Analyze query performance for common patterns
 * @returns Performance analysis results
 */
export async function analyzeQueryPerformance() {
  const supabase = createServerClient()
  
  const queries = [
    {
      name: 'Profile Cards by Profile ID',
      query: 'SELECT * FROM profile_video_cards WHERE profile_id = $1 ORDER BY position',
      expectedIndex: 'idx_profile_video_cards_profile_column_pos'
    },
    {
      name: 'Videos by Channel ID',
      query: 'SELECT * FROM videos WHERE channel_id = $1 ORDER BY published_at DESC',
      expectedIndex: 'idx_videos_channel_published'
    },
    {
      name: 'Pending Jobs by Type',
      query: 'SELECT * FROM job_queue WHERE job_type = $1 AND status = $2',
      expectedIndex: 'idx_job_queue_type_status'
    },
    {
      name: 'Profile Sources by Type',
      query: 'SELECT * FROM profile_sources WHERE source_type = $1',
      expectedIndex: 'idx_profile_sources_source_type'
    }
  ]

  const results = []
  
  for (const queryTest of queries) {
    try {
      // Use EXPLAIN to check if index is being used
      const { data, error } = await supabase.rpc('explain_query', {
        query: `EXPLAIN (FORMAT JSON) ${queryTest.query}`
      })
      
      if (!error && data) {
        const plan = data[0]?.['QUERY PLAN']?.[0]
        const usesIndex = JSON.stringify(plan).includes('Index Scan')
        
        results.push({
          name: queryTest.name,
          expectedIndex: queryTest.expectedIndex,
          usesIndex,
          plan: plan?.['Node Type'] || 'Unknown'
        })
      }
    } catch (err) {
      console.warn(`Failed to analyze query: ${queryTest.name}`, err)
    }
  }
  
  return results
}

/**
 * Get recommendations for missing indexes
 * @returns Array of index recommendations
 */
export async function getIndexRecommendations() {
  const tableStats = await getTableStats()
  const recommendations = []
  
  for (const table of tableStats) {
    // High sequential scans indicate missing indexes
    if (table.seq_scan > 1000 && table.seq_tup_read > 10000) {
      recommendations.push({
        table: table.tablename,
        issue: 'High sequential scans',
        recommendation: `Consider adding indexes for common WHERE clauses on ${table.tablename}`,
        seq_scans: table.seq_scan,
        seq_reads: table.seq_tup_read
      })
    }
    
    // Low index usage vs high sequential scans
    const indexRatio = table.idx_scan / (table.seq_scan + table.idx_scan || 1)
    if (indexRatio < 0.1 && table.seq_scan > 100) {
      recommendations.push({
        table: table.tablename,
        issue: 'Low index usage ratio',
        recommendation: `Review query patterns and add appropriate indexes for ${table.tablename}`,
        index_ratio: Math.round(indexRatio * 100) + '%'
      })
    }
  }
  
  return recommendations
}

/**
 * Generate performance report
 * @returns Comprehensive performance report
 */
export async function generatePerformanceReport() {
  const [indexStats, tableStats, queryAnalysis, recommendations] = await Promise.all([
    getIndexStats(),
    getTableStats(),
    analyzeQueryPerformance(),
    getIndexRecommendations()
  ])
  
  return {
    timestamp: new Date().toISOString(),
    indexStats,
    tableStats,
    queryAnalysis,
    recommendations,
    summary: {
      totalIndexes: indexStats.length,
      totalTables: tableStats.length,
      queriesUsingIndexes: queryAnalysis.filter(q => q.usesIndex).length,
      totalRecommendations: recommendations.length
    }
  }
}