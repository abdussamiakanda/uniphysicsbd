import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { computeStatsByProblem, computeMedalSummary } from '../lib/contestStats'
import Modal from '../components/Modal'

export default function AdminContests() {
  const [contests, setContests] = useState([])
  const [universities, setUniversities] = useState([])
  const [selectedContest, setSelectedContest] = useState(null)
  const [teams, setTeams] = useState([])

  const [contestModalOpen, setContestModalOpen] = useState(false)
  const [editingContest, setEditingContest] = useState(null)
  const [formYear, setFormYear] = useState('')
  const [formIntro, setFormIntro] = useState('')
  const [formProblemA, setFormProblemA] = useState('')
  const [formProblemB, setFormProblemB] = useState('')
  const [formSourceUrl, setFormSourceUrl] = useState('')
  const [savingContest, setSavingContest] = useState(false)

  const [teamModalOpen, setTeamModalOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState(null)
  const [teamNumber, setTeamNumber] = useState('')
  const [teamUniversityId, setTeamUniversityId] = useState('')
  const [teamMembers, setTeamMembers] = useState('')
  const [teamSponsor, setTeamSponsor] = useState('')
  const [teamProblem, setTeamProblem] = useState('B')
  const [teamMedal, setTeamMedal] = useState('Gold')
  const [savingTeam, setSavingTeam] = useState(false)
  const [teamError, setTeamError] = useState('')
  const [teamRawPaste, setTeamRawPaste] = useState('')

  useEffect(() => {
    loadContests()
    loadUniversities()
  }, [])

  useEffect(() => {
    if (!selectedContest) {
      setTeams([])
      return
    }
    loadTeams()
  }, [selectedContest?.id])

  async function loadContests() {
    const { data } = await supabase.from('contests').select('*').order('year', { ascending: false })
    setContests(data || [])
  }

  async function loadUniversities() {
    const { data } = await supabase.from('universities').select('id, name, slug').order('name')
    setUniversities(data || [])
  }

  async function loadTeams() {
    if (!selectedContest) return
    const { data } = await supabase
      .from('contest_teams')
      .select('*, university:university_id(id, name, slug)')
      .eq('contest_id', selectedContest.id)
      .order('team_number')
    const normalized = (data || []).map((t) => ({
      ...t,
      university_name: t.university?.name ?? '',
    }))
    setTeams(normalized)
  }

  function selectContest(c) {
    setSelectedContest(c)
  }

  function openNewContestModal() {
    setEditingContest(null)
    const nextYear = contests.length ? Math.max(...contests.map((c) => c.year)) + 1 : new Date().getFullYear()
    setFormYear(String(nextYear))
    setFormIntro('')
    setFormProblemA('')
    setFormProblemB('')
    setFormSourceUrl('')
    setContestModalOpen(true)
  }

  function openEditContestModal(c) {
    setEditingContest(c)
    setFormYear(String(c.year))
    setFormIntro(c.intro_text || '')
    setFormProblemA(c.problem_a_note || '')
    setFormProblemB(c.problem_b_note || '')
    setFormSourceUrl(c.source_url || '')
    setContestModalOpen(true)
  }

  function closeContestModal() {
    setContestModalOpen(false)
    setEditingContest(null)
  }

  async function saveContest(e) {
    e.preventDefault()
    setSavingContest(true)
    const payload = {
      year: parseInt(formYear, 10),
      intro_text: formIntro || null,
      problem_a_note: formProblemA || null,
      problem_b_note: formProblemB || null,
      source_url: formSourceUrl || null,
      updated_at: new Date().toISOString(),
    }
    if (editingContest) {
      await supabase.from('contests').update(payload).eq('id', editingContest.id)
      const updated = { ...editingContest, ...payload }
      setSelectedContest((prev) => (prev?.id === updated.id ? updated : prev))
    } else {
      const { data } = await supabase.from('contests').insert(payload).select('id, year').single()
      if (data) setSelectedContest({ ...data, ...payload })
    }
    await loadContests()
    setSavingContest(false)
    closeContestModal()
  }

  async function deleteContest() {
    if (!selectedContest || !confirm('Delete this competition and all its teams?')) return
    await supabase.from('contests').delete().eq('id', selectedContest.id)
    setSelectedContest(null)
    loadContests()
    closeContestModal()
  }

  function openAddTeamModal() {
    setEditingTeam(null)
    setTeamNumber('')
    setTeamUniversityId(universities[0]?.id ?? '')
    setTeamMembers('')
    setTeamSponsor('')
    setTeamProblem('B')
    setTeamMedal('Gold')
    setTeamError('')
    setTeamRawPaste('')
    setTeamModalOpen(true)
  }

  /** Parse a pasted result line and fill form. Format e.g.: "698 Dr. Nadim Chowdhury Bangladesh University of Engineering and Technology A Acc. CompetitorAnirudha Roy Archo, Swapneel Paul, Soumya Mahbub" */
  function fillFormFromPaste() {
    setTeamError('')
    const raw = teamRawPaste.trim()
    if (!raw) return
    const numMatch = raw.match(/^\s*(\d+)/)
    const teamNum = numMatch ? numMatch[1] : ''
    let rest = raw.replace(/^\s*\d+/, '').trim()
    if (!rest) {
      setTeamNumber(teamNum)
      return
    }
    const problemMatch = rest.match(/\s([AB])\s/)
    if (!problemMatch) {
      setTeamError('Could not find problem (A or B) in pasted line.')
      setTeamNumber(teamNum)
      return
    }
    const problem = problemMatch[1]
    const beforeProblem = rest.slice(0, problemMatch.index).trim()
    let afterProblem = rest.slice(problemMatch.index + problemMatch[0].length).trim()
    const medalMatch = afterProblem.match(/^(Gold(?:\s+Medal)?|Silver(?:\s+Medal)?|Bronze(?:\s+Medal)?|Acc\.?\s*Competitor|Accomplished|Acc\.?)\s*/i)
    let members = ''
    if (medalMatch) {
      let medalVal = medalMatch[1]
      if (/^Acc\.?\s*Competitor$/i.test(medalVal) || /^Acc\.?$/i.test(medalVal) || medalVal.toLowerCase() === 'accomplished') medalVal = 'Acc'
      else if (/^Gold/i.test(medalVal)) medalVal = 'Gold'
      else if (/^Silver/i.test(medalVal)) medalVal = 'Silver'
      else if (/^Bronze/i.test(medalVal)) medalVal = 'Bronze'
      setTeamMedal(medalVal)
      afterProblem = afterProblem.slice(medalMatch[0].length).replace(/^Competitor\s*/i, '').trim()
      members = afterProblem
    } else {
      setTeamError('Could not find medal (Gold/Silver/Bronze/Acc. or "Acc. Competitor") in pasted line.')
    }
    setTeamNumber(teamNum)
    setTeamProblem(problem)
    setTeamMembers(members)
    const byLen = [...universities].sort((a, b) => b.name.length - a.name.length)
    let found = false
    for (const u of byLen) {
      if (beforeProblem.includes(u.name)) {
        setTeamUniversityId(u.id)
        const sponsor = beforeProblem.replace(u.name, '').trim()
        setTeamSponsor(sponsor)
        found = true
        break
      }
    }
    if (!found) {
      setTeamError((e) => (e ? e + ' ' : '') + 'University not matched; please select from dropdown.')
      setTeamSponsor(beforeProblem)
    }
  }

  function openEditTeamModal(team) {
    setEditingTeam(team)
    setTeamNumber(String(team.team_number))
    setTeamUniversityId(team.university_id ?? '')
    setTeamMembers(team.members_text || '')
    setTeamSponsor(team.sponsor || '')
    setTeamProblem(team.problem)
    setTeamMedal(team.medal)
    setTeamError('')
    setTeamModalOpen(true)
  }

  function closeTeamModal() {
    setTeamModalOpen(false)
    setEditingTeam(null)
  }

  function usedTeamNumbers() {
    return new Set(teams.filter((t) => editingTeam?.id !== t.id).map((t) => t.team_number))
  }

  async function saveTeam(e) {
    e.preventDefault()
    setTeamError('')
    const num = parseInt(teamNumber, 10)
    if (Number.isNaN(num) || num < 1) {
      setTeamError('Team number must be a positive number.')
      return
    }
    const used = usedTeamNumbers()
    if (used.has(num)) {
      setTeamError(`Team number ${num} is already used for this competition.`)
      return
    }
    if (!teamUniversityId) {
      setTeamError('Please select a university.')
      return
    }
    setSavingTeam(true)
    const payload = {
      contest_id: selectedContest.id,
      team_number: num,
      university_id: teamUniversityId,
      members_text: teamMembers.trim() || null,
      sponsor: teamSponsor.trim() || null,
      problem: teamProblem,
      medal: teamMedal,
    }
    if (editingTeam) {
      const { error } = await supabase.from('contest_teams').update(payload).eq('id', editingTeam.id)
      if (error) {
        if (error.code === '23505') setTeamError(`Team number ${num} is already used for this competition.`)
        else setTeamError(error.message)
        setSavingTeam(false)
        return
      }
    } else {
      const { error } = await supabase.from('contest_teams').insert(payload)
      if (error) {
        if (error.code === '23505') setTeamError(`Team number ${num} is already used for this competition.`)
        else setTeamError(error.message)
        setSavingTeam(false)
        return
      }
    }
    await loadTeams()
    setSavingTeam(false)
    closeTeamModal()
  }

  async function deleteTeam(id) {
    if (!confirm('Remove this team?')) return
    await supabase.from('contest_teams').delete().eq('id', id)
    loadTeams()
    if (editingTeam?.id === id) closeTeamModal()
  }

  const statsByProblem = computeStatsByProblem(teams)
  const medalSummary = computeMedalSummary(teams)

  return (
    <>
      <div className="admin-card">
        <h2>Competitions</h2>
        <p className="admin-card-description">Select a competition to manage teams and view stats. Edit or add competitions via the buttons below.</p>
        <ul className="admin-contest-list">
          {contests.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={`btn btn-secondary ${selectedContest?.id === c.id ? 'active' : ''}`}
                onClick={() => selectContest(c)}
              >
                UPC {c.year}
              </button>
            </li>
          ))}
        </ul>
        <div className="admin-actions" style={{ borderTop: 'none', paddingTop: '0.75rem' }}>
          <button type="button" className="btn btn-primary" onClick={openNewContestModal}>
            Add new competition
          </button>
          {selectedContest && (
            <button type="button" className="btn btn-secondary" onClick={() => openEditContestModal(selectedContest)}>
              Edit selected competition
            </button>
          )}
        </div>
      </div>

      <Modal title={editingContest ? `Edit competition ${editingContest.year}` : 'New competition'} open={contestModalOpen} onClose={closeContestModal}>
        <form className="admin-form" onSubmit={saveContest}>
          <label>Year</label>
          <input
            type="number"
            value={formYear}
            onChange={(e) => setFormYear(e.target.value)}
            min="2010"
            max="2030"
            required
          />
          <label>Intro text</label>
          <textarea value={formIntro} onChange={(e) => setFormIntro(e.target.value)} />
          <label>Problem A note</label>
          <input value={formProblemA} onChange={(e) => setFormProblemA(e.target.value)} />
          <label>Problem B note</label>
          <input value={formProblemB} onChange={(e) => setFormProblemB(e.target.value)} />
          <label>Source URL (e.g. PDF)</label>
          <input type="url" value={formSourceUrl} onChange={(e) => setFormSourceUrl(e.target.value)} />
          <div className="admin-actions">
            <button type="submit" className="btn btn-primary" disabled={savingContest}>
              {savingContest ? 'Saving…' : 'Save competition'}
            </button>
            {editingContest && (
              <button type="button" className="btn btn-danger" onClick={deleteContest}>
                Delete competition
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={closeContestModal}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {selectedContest && (
        <>
          <div className="admin-card">
            <div className="admin-section-title">
              <h3>Teams (competition {selectedContest.year})</h3>
              <button type="button" className="btn btn-primary btn-sm" onClick={openAddTeamModal}>
                Add team
              </button>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>University</th>
                  <th>Members</th>
                  <th>Sponsor</th>
                  <th>Problem</th>
                  <th>Medal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id}>
                    <td>{team.team_number}</td>
                    <td>{team.university_name || team.university?.name || '—'}</td>
                    <td>{team.members_text || '—'}</td>
                    <td>{team.sponsor || '—'}</td>
                    <td>{team.problem}</td>
                    <td>{team.medal}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEditTeamModal(team)}>Edit</button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteTeam(team.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {teams.length === 0 && (
              <p className="admin-empty">No teams yet. Add teams from the official results.</p>
            )}
          </div>

          <Modal title={editingTeam ? 'Edit team' : 'Add team'} open={teamModalOpen} onClose={closeTeamModal}>
            <form className="admin-form" onSubmit={saveTeam}>
              {teamError && (
                <p className="error" style={{ marginBottom: '0.5rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '6px', fontSize: '0.875rem' }}>
                  {teamError}
                </p>
              )}
              {!editingTeam && (
                <>
                  <label>Paste result line (fill form below)</label>
                  <textarea
                    value={teamRawPaste}
                    onChange={(e) => setTeamRawPaste(e.target.value)}
                    placeholder="e.g. 698 Dr. Nadim Chowdhury Bangladesh University of Engineering and Technology A Acc. CompetitorAnirudha Roy Archo, Swapneel Paul, Soumya Mahbub"
                    rows={3}
                    style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8125rem' }}
                  />
                  <button type="button" className="btn btn-secondary" onClick={fillFormFromPaste} style={{ marginBottom: '1rem' }}>
                    Fill form from paste
                  </button>
                </>
              )}
              <div className="admin-form row">
                <div>
                  <label>Team number</label>
                  <input
                    type="number"
                    min="1"
                    value={teamNumber}
                    onChange={(e) => setTeamNumber(e.target.value)}
                    placeholder="e.g. 496"
                    required
                  />
                </div>
                <div>
                  <label>University</label>
                  <select
                    value={teamUniversityId}
                    onChange={(e) => setTeamUniversityId(e.target.value)}
                    required
                  >
                    <option value="">Select university</option>
                    {universities.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Problem</label>
                  <select value={teamProblem} onChange={(e) => setTeamProblem(e.target.value)}>
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                </div>
                <div>
                  <label>Medal</label>
                  <select value={teamMedal} onChange={(e) => setTeamMedal(e.target.value)}>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Bronze">Bronze</option>
                    <option value="Acc">Accomplished</option>
                  </select>
                </div>
              </div>
              <label>Members (names)</label>
              <input
                value={teamMembers}
                onChange={(e) => setTeamMembers(e.target.value)}
                placeholder="e.g. Rudro Karmokar, Sanjeeda Islam Mou"
              />
              <label>Sponsor</label>
              <input
                value={teamSponsor}
                onChange={(e) => setTeamSponsor(e.target.value)}
                placeholder="e.g. Md. Faruk Hossain"
              />
              <div className="admin-actions">
                <button type="submit" className="btn btn-primary" disabled={savingTeam}>
                  {savingTeam ? 'Saving…' : editingTeam ? 'Update team' : 'Add team'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeTeamModal}>
                  Cancel
                </button>
              </div>
            </form>
          </Modal>

          <div className="admin-card">
            <h3>Computed stats (by problem)</h3>
            <p className="admin-card-description">Derived from teams above.</p>
            <table className="admin-table">
              <thead>
                <tr>
                  <th><span className="th-full">University</span><span className="th-short" aria-hidden>University</span></th>
                  <th><span className="th-full">Problem</span><span className="th-short" aria-hidden>P</span></th>
                  <th><span className="th-full">Gold</span><span className="th-short" aria-hidden>G</span></th>
                  <th><span className="th-full">Silver</span><span className="th-short" aria-hidden>S</span></th>
                  <th><span className="th-full">Bronze</span><span className="th-short" aria-hidden>B</span></th>
                  <th><span className="th-full">Acc</span><span className="th-short" aria-hidden>Acc</span></th>
                  <th><span className="th-full">Total</span><span className="th-short" aria-hidden>Tot</span></th>
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
                    <tr key={`${row.university}-${row.problem}-${i}`} className={compactRow ? 'admin-table-compact-row' : undefined}>
                      {isFirstForUni && (
                        <td rowSpan={rowspan}>{row.university}</td>
                      )}
                      <td>{row.problem}</td>
                      <td>{row.gold}</td>
                      <td>{row.silver}</td>
                      <td>{row.bronze}</td>
                      <td>{row.acc}</td>
                      <td>{row.total}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="admin-card">
            <h3>Computed medal summary</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th><span className="th-full">University</span><span className="th-short" aria-hidden>University</span></th>
                  <th><span className="th-full">Gold</span><span className="th-short" aria-hidden>G</span></th>
                  <th><span className="th-full">Silver</span><span className="th-short" aria-hidden>S</span></th>
                  <th><span className="th-full">Bronze</span><span className="th-short" aria-hidden>B</span></th>
                  <th><span className="th-full">Acc</span><span className="th-short" aria-hidden>Acc</span></th>
                  <th><span className="th-full">Total</span><span className="th-short" aria-hidden>Tot</span></th>
                </tr>
              </thead>
              <tbody>
                {medalSummary.map((row, i) => (
                  <tr key={i}>
                    <td>{row.university}</td>
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
        </>
      )}
    </>
  )
}
