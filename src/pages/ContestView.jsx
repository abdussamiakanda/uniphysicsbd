import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { computeStatsByProblem, computeMedalSummary } from '../lib/contestStats'


export default function ContestView() {
  const { year } = useParams()
  const [contest, setContest] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!year) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      const { data: contestData, error: contestErr } = await supabase
        .from('contests')
        .select('*')
        .eq('year', parseInt(year, 10))
        .single()

      if (contestErr || !contestData) {
        if (!cancelled) setError(contestErr?.message || 'Competition not found')
        setLoading(false)
        return
      }
      if (!cancelled) setContest(contestData)

      const { data: teamsData, error: teamsErr } = await supabase
        .from('contest_teams')
        .select('*, university:university_id(name, slug)')
        .eq('contest_id', contestData.id)
        .order('team_number')

      const normalized = (teamsData || []).map((t) => ({
        ...t,
        university_name: t.university?.name ?? '',
      }))
      if (!teamsErr && !cancelled) setTeams(normalized)
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [year])

  const statsByProblem = computeStatsByProblem(teams)
  const medalSummary = computeMedalSummary(teams)
  const nameToSlug = {}
  teams.forEach((t) => {
    if (t.university?.slug && (t.university_name ?? t.university?.name))
      nameToSlug[t.university_name ?? t.university?.name] = t.university.slug
  })

  if (loading) {
    return (
      <div className="loading-state" aria-live="polite">
        <p className="loading">Loading…</p>
      </div>
    )
  }
  if (error) return <p className="error">{error}</p>
  if (!contest) return null

  return (
    <div className="competition-view">
      <h1 className="page-title">University Physics Competition {contest.year}</h1>
      <p className="page-lead">Bangladeshi teams statistics and results.</p>

      {contest.intro_text && (
        <p className="intro-text">
          {contest.intro_text.split(/\*\*/).map((part, i) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
          )}
        </p>
      )}

      <div className="contest-meta">
        <p className="contest-meta-item">
          <strong>Problem A:</strong> {contest.problem_a_note || '—'}
        </p>
        <p className="contest-meta-item">
          <strong>Problem B:</strong> {contest.problem_b_note || '—'}
        </p>
        {contest.source_url && (
          <p className="contest-meta-source">
            Built from{' '}
            <a href={contest.source_url} target="_blank" rel="noopener noreferrer">
              {contest.year} University Physics Competition Results
            </a>
            .
          </p>
        )}
      </div>

      <hr className="section-divider" />

      <h2 className="section-title">Statistics (by problem and rank)</h2>
      <p className="card-description">Counts are derived from the team list below.</p>
      <div className="site-table-wrap">
        <table className="site-table">
          <thead>
            <tr>
              <th>University</th>
              <th>Problem</th>
              <th>Gold</th>
              <th>Silver</th>
              <th>Bronze</th>
              <th>Acc.</th>
              <th><strong>Total</strong></th>
            </tr>
          </thead>
          <tbody>
            {statsByProblem.map((row, i) => {
              const isFirstForUni = i === 0 || statsByProblem[i - 1].university !== row.university
              const rowspan = isFirstForUni
                ? statsByProblem.filter((r) => r.university === row.university).length
                : 0
              const compactRow = rowspan === 2 || !isFirstForUni
              return (
                <tr key={`${row.university}-${row.problem}-${i}`} className={compactRow ? 'site-table-compact-row' : undefined}>
                  {isFirstForUni && (
                    <td rowSpan={rowspan}>
                      {nameToSlug[row.university] ? (
                        <Link to={`/university/${nameToSlug[row.university]}`}>{row.university}</Link>
                      ) : (
                        row.university
                      )}
                    </td>
                  )}
                  <td>{row.problem}</td>
                  <td>{row.gold}</td>
                  <td>{row.silver}</td>
                  <td>{row.bronze}</td>
                  <td>{row.acc}</td>
                  <td><strong>{row.total}</strong></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {statsByProblem.length === 0 && <p className="loading">No data yet.</p>}

      <hr className="section-divider" />

      <h2 className="section-title">Medal summary by university</h2>
      <div className="site-table-wrap">
        <table className="site-table">
          <thead>
            <tr>
              <th>University</th>
              <th>Gold</th>
              <th>Silver</th>
              <th>Bronze</th>
              <th>Acc.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {medalSummary.map((row, i) => (
              <tr key={`${row.university}-${i}`}>
                <td>
                  {nameToSlug[row.university] ? (
                    <Link to={`/university/${nameToSlug[row.university]}`}>{row.university}</Link>
                  ) : (
                    row.university
                  )}
                </td>
                <td>{row.gold}</td>
                <td>{row.silver}</td>
                <td>{row.bronze}</td>
                <td>{row.acc}</td>
                <td>{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {medalSummary.length === 0 && <p className="loading">No data yet.</p>}

      <hr className="section-divider" />

      <h2 className="section-title">Bangladeshi teams</h2>
      {teams.length === 0 ? (
        <p className="loading">No teams added yet for this competition.</p>
      ) : (
        <ul className="team-list">
          {[...teams]
            .sort((a, b) => {
              const medalOrder = { Gold: 1, Silver: 2, Bronze: 3, Acc: 4, Accomplished: 4 }
              const rankA = medalOrder[a.medal] ?? 5
              const rankB = medalOrder[b.medal] ?? 5
              if (rankA !== rankB) return rankA - rankB
              return a.team_number - b.team_number
            })
            .map((team) => {
            const uniName = team.university_name ?? team.university?.name ?? '—'
            const slug = team.university?.slug
            return (
              <li key={team.id} className="team-list-item">
                <span className="team-list-num" aria-label="Team number">{team.team_number}</span>
                <span className={`team-list-problem team-list-problem--${team.problem}`} aria-label={`Problem ${team.problem}`}>{team.problem}</span>
                <div className="team-list-body">
                  <span className="team-list-university">
                    {slug ? <Link to={`/university/${slug}`}>{uniName}</Link> : uniName}
                  </span>
                  {team.members_text && (
                    <span className="team-list-members">Members: {team.members_text}</span>
                  )}
                  {team.sponsor && (
                    <span className="team-list-sponsor">Sponsor: {team.sponsor}</span>
                  )}
                  <span className={`team-list-medal team-list-medal--${team.medal.toLowerCase().replace(/\./g, '')}`}>{team.medal}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
