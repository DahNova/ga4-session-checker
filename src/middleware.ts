import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Specify which routes this middleware should run for
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Define public and auth pages
  const isAuthPage = req.nextUrl.pathname === '/login'
  const isPublicPage = req.nextUrl.pathname === '/'

  // Redirect unauthenticated users to login page if they're trying to access protected pages
  if (!session && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Redirect authenticated users to dashboard if they try to access login page
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
} 