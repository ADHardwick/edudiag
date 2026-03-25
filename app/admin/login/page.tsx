import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function login(formData: FormData) {
  'use server'

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/admin/login?error=1')
  }

  redirect('/admin')
}

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const hasError = !!searchParams.error

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-primary mb-6">Admin Login</h1>
        <form action={login} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {hasError && <p className="text-red-600 text-sm">Invalid email or password.</p>}
          <button
            type="submit"
            className="w-full bg-primary text-white rounded-md py-2 text-sm font-medium hover:bg-primary/90"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
