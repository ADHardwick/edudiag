'use client'
import { useState } from 'react'
import Link from 'next/link'

export function SiteNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav
      className="sticky top-0 z-50 h-14 flex items-center justify-between px-8 relative"
      style={{ background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
    >
      <Link href="/" className="flex items-center gap-2 text-white font-extrabold text-base tracking-tight">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          S
        </span>
        SharpKid
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-6">
        <Link href="/diagnosticians" className="text-slate-400 text-sm font-medium hover:text-white transition-colors">
          Browse All
        </Link>
        <a
          href="#"
          className="text-sm font-semibold text-white px-4 py-[7px] rounded-lg"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          Get Listed →
        </a>
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden text-white text-xl leading-none"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
      >
        {menuOpen ? '✕' : '≡'}
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="absolute top-14 left-0 right-0 flex flex-col z-50"
          style={{ background: '#1e293b' }}
        >
          <Link
            href="/diagnosticians"
            className="px-6 py-4 text-slate-300 text-sm font-medium border-b border-white/5"
            onClick={() => setMenuOpen(false)}
          >
            Browse All
          </Link>
          <a
            href="#"
            className="px-6 py-4 text-slate-300 text-sm font-medium"
            onClick={() => setMenuOpen(false)}
          >
            Get Listed →
          </a>
        </div>
      )}
    </nav>
  )
}
