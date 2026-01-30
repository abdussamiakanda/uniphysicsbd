import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { computeMedalSummary } from '../lib/contestStats'

export default function UniversityPage() {
  const { slug } = useParams()
  const [university, setUniversity] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      const { data: uniData, error: uniErr } = await supabase
        .from('universities')
        .select('id, name, slug, acronym, url, logo_url, founded, location, division, type, description')
        .eq('slug', slug)
        .single()

      if (uniErr || !uniData) {
        if (!cancelled) setError(uniErr?.message || 'University not found')
        setLoading(false)
        return
      }
      if (!cancelled) setUniversity(uniData)

      const { data: teamsData, error: teamsErr } = await supabase
        .from('contest_teams')
        .select('*, contest:contest_id(year)')
        .eq('university_id', uniData.id)
        .order('team_number')

      if (!teamsErr && !cancelled) setTeams(teamsData || [])
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  if (loading) {
    return (
      <div className="loading-state" aria-live="polite">
        <p className="loading">Loading…</p>
      </div>
    )
  }
  if (error) return <p className="error">{error}</p>
  if (!university) return null

  const byYear = {}
  teams.forEach((t) => {
    const year = t.contest?.year ?? 'Unknown'
    if (!byYear[year]) byYear[year] = []
    byYear[year].push(t)
  })
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a))

  const summary = computeMedalSummary(teams.map((t) => ({ ...t, university_name: university.name })))
  const totals = summary[0] ?? { gold: 0, silver: 0, bronze: 0, acc: 0, total: 0 }

  return (
    <div className="university-view">
      <Link to="/universities" className="back-link">← All universities</Link>

      <header className="university-header">
        {university.logo_url && (
          <div className="university-logo-wrap">
            <img src={university.logo_url} alt="" className="university-logo" />
          </div>
        )}
        <div className="university-header-text">
          <h1 className="university-title">
            {university.name}
            {university.acronym && <span className="university-acronym"> ({university.acronym})</span>}
          </h1>
          <div className="university-meta">
            {university.type && <span className="university-meta-item">{university.type}</span>}
            {university.founded && <span className="university-meta-item">Founded {university.founded}</span>}
            {university.location && <span className="university-meta-item">{university.location}</span>}
            {university.division && <span className="university-meta-item">{university.division}</span>}
            {university.url && (
              <a href={university.url} target="_blank" rel="noopener noreferrer" className="university-meta-link">Website →</a>
            )}
          </div>
        </div>
      </header>

      {university.description && (
        <div className="university-description">
          <p>{university.description}</p>
        </div>
      )}

      <section className="university-overview">
        <h2 className="section-title">UPC achievements overview</h2>
        <div className="university-stats-cards" role="list">
          <div className="university-stat-card university-stat-card--gold" role="listitem">
            <span className="university-stat-card-label">Gold</span>
            <span className="university-stat-card-value">{totals.gold}</span>
          </div>
          <div className="university-stat-card university-stat-card--silver" role="listitem">
            <span className="university-stat-card-label">Silver</span>
            <span className="university-stat-card-value">{totals.silver}</span>
          </div>
          <div className="university-stat-card university-stat-card--bronze" role="listitem">
            <span className="university-stat-card-label">Bronze</span>
            <span className="university-stat-card-value">{totals.bronze}</span>
          </div>
          <div className="university-stat-card university-stat-card--acc" role="listitem">
            <span className="university-stat-card-label">Acc.</span>
            <span className="university-stat-card-value">{totals.acc}</span>
          </div>
          <div className="university-stat-card university-stat-card--total" role="listitem">
            <span className="university-stat-card-label">Total teams</span>
            <span className="university-stat-card-value">{totals.total}</span>
          </div>
        </div>
      </section>

      <section className="university-by-year">
        <h2 className="section-title">By year</h2>
        {years.length === 0 ? (
          <p className="loading">No teams recorded yet for this university.</p>
        ) : (
          years.map((year) => (
            <div key={year} className="university-year-block">
              <h3 className="university-year-heading">
                <Link to={`/competition/${year}`}>University Physics Competition {year}</Link>
              </h3>
              <div className="site-table-wrap">
                <table className="site-table">
                  <thead>
                    <tr>
                      <th><span className="th-full">Team</span><span className="th-short" aria-hidden>#</span></th>
                      <th><span className="th-full">Problem</span><span className="th-short" aria-hidden>Prob.</span></th>
                      <th><span className="th-full">Medal</span><span className="th-short" aria-hidden>Med.</span></th>
                      <th><span className="th-full">Members</span><span className="th-short" aria-hidden>Mem.</span></th>
                      <th><span className="th-full">Sponsor</span><span className="th-short" aria-hidden>Spons.</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {byYear[year].map((team) => (
                      <tr key={team.id}>
                        <td>{team.team_number}</td>
                        <td>{team.problem}</td>
                        <td>{team.medal}</td>
                        <td>{team.members_text || '—'}</td>
                        <td>{team.sponsor || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
