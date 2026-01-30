import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function CompetitionsList() {
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

  if (loading) {
    return (
      <div className="loading-state" aria-live="polite">
        <p className="loading">Loading…</p>
      </div>
    )
  }

  return (
    <>
      <h1 className="page-title">Competitions</h1>
      <p className="page-lead">
        University Physics Competition results by year. Select a year to view teams, statistics by problem and rank, and medal summaries.
      </p>
      <ul className="university-list">
        {contests.map((c) => (
          <li key={c.id}>
            <Link to={`/competition/${c.year}`}>University Physics Competition {c.year}</Link>
          </li>
        ))}
      </ul>
      {contests.length === 0 && <p className="loading">No competitions added yet.</p>}
    </>
  )
}
