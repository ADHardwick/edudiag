'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/diagnosticians', label: 'Diagnosticians' },
  { href: '/admin/leads', label: 'Leads' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <aside className="w-56 min-h-screen bg-primary text-white flex flex-col">
      <div className="p-6 border-b border-white/10">
        <span className="font-semibold text-sm tracking-wide uppercase">Admin Panel</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`block px-3 py-2 rounded-md text-sm transition-colors ${
              (href === '/admin' ? pathname === href : pathname === href || pathname.startsWith(href + '/'))
                ? 'bg-white/20 font-medium'
                : 'hover:bg-white/10'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4">
        <button
          onClick={handleSignOut}
          className="w-full px-3 py-2 text-sm rounded-md hover:bg-white/10 text-left"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
