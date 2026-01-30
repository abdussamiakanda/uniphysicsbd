import { Outlet, Link, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import './AdminLayout.css'

export default function AdminLayout() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="admin-wrap">
        <div className="admin-loading">
          <div className="admin-spinner" aria-hidden />
          <p>Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Outlet />
  }

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <div className="admin-header-brand">
          <span className="admin-brand-mark">UPC</span>
          <span className="admin-brand-text">UPC BD Admin</span>
        </div>
        <nav className="admin-header-nav" aria-label="Admin sections">
          <NavLink to="/admin/competitions" className={({ isActive }) => 'admin-header-nav-link' + (isActive ? ' active' : '')}>Competitions</NavLink>
          <NavLink to="/admin/universities" className={({ isActive }) => 'admin-header-nav-link' + (isActive ? ' active' : '')}>Universities</NavLink>
        </nav>
        <div className="admin-header-actions">
          <span className="admin-user-email" title={user.email}>{user.email}</span>
          <Link to="/" className="admin-btn admin-btn-ghost">View site</Link>
          <button type="button" className="admin-btn admin-btn-secondary" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="admin-main">
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
