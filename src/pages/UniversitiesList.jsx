import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function UniversitiesList() {
  const [universities, setUniversities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('universities')
        .select('id, name, slug')
        .order('name')
      if (!error) setUniversities(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="loading-state" aria-live="polite">
        <p className="loading">Loading…</p>
      </div>
    )
  }

  return (
    <>
      <h1 className="page-title">Universities</h1>
      <p className="page-lead">
        Bangladeshi universities in the University Physics Competition. Click a university to see their achievements by year.
      </p>
      <ul className="university-list">
        {universities.map((u) => (
          <li key={u.id}>
            <Link to={`/university/${u.slug}`}>{u.name}</Link>
          </li>
        ))}
      </ul>
      {universities.length === 0 && <p className="loading">No universities added yet.</p>}
    </>
  )
}
