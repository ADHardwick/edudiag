export function SiteFooter() {
  return (
    <footer
      className="px-8 py-10 mt-[60px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      style={{ background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div>
        <p className="text-white font-extrabold text-sm">✦ SharpKid</p>
        <p className="text-slate-500 text-xs mt-1">
          © {new Date().getFullYear()} SharpKid · Serving Texas, New Mexico &amp; Louisiana
        </p>
      </div>
      <div className="flex gap-5">
        <a href="#" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">Privacy</a>
        <a href="#" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">Terms</a>
        <a href="#" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">Contact</a>
      </div>
    </footer>
  )
}
