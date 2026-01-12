// Run this with: npx tsx scripts/run-migration.ts
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/00002_add_feed_error_alert_type.sql')
  const sql = fs.readFileSync(migrationPath, 'utf-8')

  console.log('Running migration: 00002_add_feed_error_alert_type.sql')

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

  if (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }

  console.log('✅ Migration completed successfully')
}

runMigration()
