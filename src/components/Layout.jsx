import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Layout() {
  const [contests, setContests] = useState([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('contests')
        .select('id, year')
        .order('year', { ascending: false })
      if (!error) setContests(data || [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onEscape = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onEscape)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onEscape)
    }
  }, [menuOpen])

  return (
    <div className="site-layout">
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="site-brand" onClick={() => setMenuOpen(false)}>
            <span className="site-brand-text">UPC Bangladesh</span>
          </Link>

          <nav className="site-nav site-nav-desktop" aria-label="Main">
            <NavLink to="/competitions" className={({ isActive }) => 'site-nav-link' + (isActive ? ' active' : '')}>
              Competitions
            </NavLink>
            <NavLink to="/universities" className={({ isActive }) => 'site-nav-link' + (isActive ? ' active' : '')}>
              Universities
            </NavLink>
            {!loading && contests.length > 0 && (
              <>
                <span className="site-nav-divider" aria-hidden>|</span>
                <NavLink
                  to={`/competition/${contests[0].year}`}
                  className={({ isActive }) => 'site-nav-link site-nav-link-year' + (isActive ? ' active' : '')}
                >
                  {contests[0].year}
                </NavLink>
              </>
            )}
          </nav>

          <button
            type="button"
            className="site-header-menu-btn"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={24} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </header>

      <div
        className={'site-nav-overlay' + (menuOpen ? ' is-open' : '')}
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />
      <aside
        className={'site-nav-drawer' + (menuOpen ? ' is-open' : '')}
        aria-label="Main navigation"
        aria-hidden={!menuOpen}
      >
        <div className="site-nav-drawer-inner">
          <button
            type="button"
            className="site-nav-drawer-close"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <X size={24} strokeWidth={2} aria-hidden />
          </button>
          <nav className="site-nav-drawer-nav">
            <NavLink to="/competitions" className={({ isActive }) => 'site-nav-drawer-link' + (isActive ? ' active' : '')} onClick={() => setMenuOpen(false)}>
              Competitions
            </NavLink>
            <NavLink to="/universities" className={({ isActive }) => 'site-nav-drawer-link' + (isActive ? ' active' : '')} onClick={() => setMenuOpen(false)}>
              Universities
            </NavLink>
            {!loading && contests.length > 0 && (
              <NavLink
                to={`/competition/${contests[0].year}`}
                className={({ isActive }) => 'site-nav-drawer-link' + (isActive ? ' active' : '')}
                onClick={() => setMenuOpen(false)}
              >
                Latest: {contests[0].year}
              </NavLink>
            )}
          </nav>
        </div>
      </aside>
      <main className="site-main">
        <div className="site-container">
          <Outlet />
        </div>
      </main>
      <footer className="site-footer">
        <p>
          Official competition: <a href="https://www.uphysicsc.com/" target="_blank" rel="noopener noreferrer">uphysicsc.com</a>
          {' · '}
          This site shows Bangladesh-only data.
          {' · '}
          Developer: <a href="https://github.com/abdussamiakanda" target="_blank" rel="noopener noreferrer">Md Abdus Sami Akanda</a>
        </p>
      </footer>
    </div>
  )
}
