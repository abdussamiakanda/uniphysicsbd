import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AdminLogin() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setAuthError('')
    setAuthSuccess('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setAuthError(error.message)
    else setAuthSuccess('Signed in.')
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" aria-hidden />
        <p className="admin-loading-text">Loading…</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/admin/competitions" replace />
  }

  return (
    <div className="admin-login-wrap">
      <div className="admin-login">
        <h1>Admin sign in</h1>
        {authError && <p className="error">{authError}</p>}
        {authSuccess && <p className="success">{authSuccess}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Sign in</button>
        </form>
      </div>
    </div>
  )
}
