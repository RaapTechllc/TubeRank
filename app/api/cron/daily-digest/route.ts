import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: Implement daily digest
  return NextResponse.json({ success: true, processed: 0 })
}
