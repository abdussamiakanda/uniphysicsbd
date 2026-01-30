import { Outlet, NavLink, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Layout() {
  const [contests, setContests] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="site-layout">
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="site-brand">
            <span className="site-brand-text">UPC Bangladesh</span>
          </Link>
          <nav className="site-nav" aria-label="Main">
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
        </div>
      </header>
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
        </p>
      </footer>
    </div>
  )
}
