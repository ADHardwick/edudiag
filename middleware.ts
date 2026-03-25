import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  // DEBUG
  const cookieNames = request.cookies.getAll().map(c => c.name)
  console.warn('[MW]', request.nextUrl.pathname, '| user:', user?.email ?? 'null', '| cookies:', cookieNames.join(','))

  // For admin routes: verify the authenticated user is the configured admin
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL
  const isAdmin = !!user && !!adminEmail && user.email?.toLowerCase() === adminEmail.toLowerCase()

  const pathname = request.nextUrl.pathname
  const isAdminApiPath = pathname.startsWith('/api/admin')
  const isAdminPagePath = pathname.startsWith('/admin')
  const isLoginPath = pathname === '/admin/login'

  // API routes: return 401 JSON (not a redirect — clients aren't browsers)
  if (isAdminApiPath && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Page routes: redirect to login
  if (isAdminPagePath && !isLoginPath && !isAdmin) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Already logged in and is admin? Redirect away from login page
  if (isLoginPath && isAdmin) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return response
}

export const config = {
  // Match bare /admin AND all sub-paths AND all /api/admin/* routes
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
}
