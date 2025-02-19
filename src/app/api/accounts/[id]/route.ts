import { NextResponse } from 'next/server'
import { getAccountName } from '@/utils/ga4'
import { withAuth } from '@/lib/supabase'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth(async () => {
    try {
      const { id } = await context.params
      const accountName = await getAccountName(id)

      // Create response with strong caching headers
      const response = NextResponse.json({ name: accountName })
      
      // Cache for 1 hour, allow stale response for 1 minute while revalidating
      response.headers.set(
        'Cache-Control',
        'private, max-age=3600, must-revalidate, stale-while-revalidate=60'
      )
      
      // Ensure proper cache key includes auth state
      response.headers.set('Vary', 'Cookie, Authorization')
      
      return response
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch account name'
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }
  })
} 