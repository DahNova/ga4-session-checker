import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cache } from 'react'

export const createClient = cache(() => {
  const cookieStore = cookies()
  return createClientComponentClient<Database>({
    cookies: () => cookieStore,
  })
})

export async function createAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  return { supabase, user }
}

export async function withAuth<T>(handler: (client: { supabase: ReturnType<typeof createRouteHandlerClient<Database>>, user: any }) => Promise<T>) {
  try {
    const client = await createAuthenticatedClient()
    return await handler(client)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    throw error
  }
} 